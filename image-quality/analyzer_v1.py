# --- Dependency Check ---
try:
    import cv2
    import numpy as np

except ImportError as e:
    print(f"ImportError: {e}")
    print("One or more required Python packages are not installed.")
    print("Please install the necessary dependencies by running:")
    print("pip install -r requirements.txt")
    print("If you don't have 'requirements.txt', ensure you have opencv-python and numpy installed.")
    exit(1)

# --- Standard Library Imports ---
import json
import os
import logging
import argparse
import shutil  # Added for moving files
import configparser

# ---------------------------------------------------------------------------
# Notes:
#   The heuristic combines a central-crop Laplacian variance
#   (good for centered subjects) with a lightweight spectral-residual saliency
#   map (fast, helps find off-center salient regions). The stronger of the two
#   region sharpness values is used as the "Focus Area" score.
# - If run with `--image_verbose`, annotated images are saved to
#   <input_folder>/focus_bbox with a green bounding box and the focus score.
# ---------------------------------------------------------------------------

# --- Logger Setup ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration Loading ---
config = configparser.ConfigParser()
CONFIG_FILE_PATH = './image-quality/config.ini'

if not os.path.exists(CONFIG_FILE_PATH):
    logger.critical(
        f"Configuration file '{CONFIG_FILE_PATH}' not found. Please create it.")
    logger.critical(
        "You can use the example provided in the README or documentation.")
    exit(1)

try:
    config.read(CONFIG_FILE_PATH)

    SHARPNESS_NORMALIZATION_FACTOR = config.getfloat(
        'NormalizationFactors', 'sharpness', fallback=1000.0)
    FOCUS_AREA_NORMALIZATION_FACTOR = config.getfloat(
        'NormalizationFactors', 'focus_area', fallback=1000.0)
    NOISE_NORMALIZATION_FACTOR = config.getfloat(
        'NormalizationFactors', 'noise', fallback=50.0)

    EXPOSURE_IDEAL_MEAN_INTENSITY = config.getfloat(
        'Thresholds', 'exposure_ideal_mean', fallback=128.0)
    DYNAMIC_RANGE_MAX_VALUE = config.getfloat(
        'Thresholds', 'dynamic_range_max', fallback=255.0)
    OVERALL_CONF_TECH_WEIGHT = config.getfloat(
        'Weights', 'overall_tech', fallback=0.6)
    OVERALL_CONF_OTHER_WEIGHT = config.getfloat(
        'Weights', 'overall_other', fallback=0.4)

    # Removed YOLO model config entries for simplified analyzer

    JUDGEMENT_EXCELLENT = config.getfloat('JudgementLevels', 'excellent', fallback=0.9)
    JUDGEMENT_GOOD = config.getfloat('JudgementLevels', 'good', fallback=0.7)
    JUDGEMENT_FAIR = config.getfloat('JudgementLevels', 'fair', fallback=0.5)
    JUDGEMENT_POOR = config.getfloat('JudgementLevels', 'poor', fallback=0.3)

except (configparser.Error, ValueError) as e:
    logger.critical(
        f"Error reading configuration file '{CONFIG_FILE_PATH}': {e}")
    exit(1)

# We no longer use an object detector. The focus area will be estimated using
# a fast central-crop sharpness heuristic.


# --- Metric Calculation Helper Functions ---

def _calculate_sharpness(gray_img: np.ndarray) -> tuple[float, str]:
    """Calculates overall image sharpness using Laplacian variance."""
    laplacian_var = cv2.Laplacian(gray_img, cv2.CV_64F).var()
    score = min(laplacian_var / SHARPNESS_NORMALIZATION_FACTOR, 1.0)
    explanation = "Edges are sharp with high variance." if score > 0.8 else "Edges are slightly blurry."
    return score, explanation


def _calculate_focus_area(
    img: np.ndarray, gray_img: np.ndarray, overall_sharpness_score: float, saliency_map: np.ndarray | None = None
) -> tuple[float, str, set[str], str | None, tuple[int, int, int, int] | None]:
    """
     Fast heuristic to estimate focus on the main subject without object detection.

     Strategy overview:
     1) Central crop sharpness (center 40% x 40%) - cheap and reliable for centered
         subjects.
     2) Spectral-residual saliency map (computed on a small resized version) to
         detect the most salient region; compute Laplacian variance in that region.
     3) Prefer the saliency-region score when it is higher (handles off-center
         subjects), otherwise fall back to center-crop score.

     Returns: (focus_score, explanation, detected_obj_names (empty set),
                  main_subject_name (None), chosen_bbox (x1,y1,x2,y2) or None).
    """
    h, w = gray_img.shape
    # central crop (center 40% x 40%) - adjustable if needed
    crop_frac = 0.4
    ch = max(1, int(h * crop_frac))
    cw = max(1, int(w * crop_frac))
    y1 = (h - ch) // 2 
    x1 = (w - cw) // 2
    y2 = y1 + ch
    x2 = x1 + cw

    focus_score = overall_sharpness_score
    focus_explanation = "Using overall sharpness as focus proxy."
    detected_obj_names: set[str] = set()
    main_subj_name: str | None = None

    try:
    # Center crop score (cheap)
        crop = gray_img[y1:y2, x1:x2]
        center_score = overall_sharpness_score
        if crop.size > 0:
            lap_var = cv2.Laplacian(crop, cv2.CV_64F).var()
            center_score = min(lap_var / FOCUS_AREA_NORMALIZATION_FACTOR, 1.0)

        # Saliency-based score (compute saliency if not provided)
        if saliency_map is None:
            saliency_map = _calculate_saliency(gray_img)

    # Find strongest saliency location and compute laplacian variance there
        peak_idx = np.unravel_index(int(np.argmax(saliency_map)), saliency_map.shape)
        py, px = peak_idx
        roi_size = max(3, int(min(h, w) * 0.25))
        sy1 = max(0, py - roi_size // 2)
        sx1 = max(0, px - roi_size // 2)
        sy2 = min(h, sy1 + roi_size)
        sx2 = min(w, sx1 + roi_size)
        sal_score = overall_sharpness_score
        if sy2 > sy1 and sx2 > sx1:
            sal_crop = gray_img[sy1:sy2, sx1:sx2]
            if sal_crop.size > 0:
                lap_var_sal = cv2.Laplacian(sal_crop, cv2.CV_64F).var()
                sal_score = min(lap_var_sal / FOCUS_AREA_NORMALIZATION_FACTOR, 1.0)

    # Combine: prefer saliency-based score if it is higher (handles off-center subjects)
        if sal_score >= center_score:
            focus_score = sal_score
            focus_explanation = "Focus estimated from salient region." if sal_score > 0.8 else "Salient region shows some softness."
            chosen_bbox = (sx1, sy1, sx2, sy2)
        else:
            focus_score = center_score
            focus_explanation = "Center area is in sharp focus." if center_score > 0.8 else "Center area shows some softness."
            chosen_bbox = (x1, y1, x2, y2)

    except Exception as e:
        # On any exception, fall back to overall sharpness and no bbox
        logger.debug(f"Focus heuristic failed: {e}")
        focus_explanation = "Error computing focus heuristic; using overall sharpness."
        chosen_bbox = None

    return focus_score, focus_explanation, detected_obj_names, main_subj_name, chosen_bbox


def _calculate_saliency(gray_img: np.ndarray, resize_to: int = 256 ) -> np.ndarray:
    """
    Compute a fast spectral residual saliency map (Hou & Zhang) on the grayscale image.

    Steps (fast approximate implementation):
    - Resize to a small square to speed up FFT operations.
    - Compute log amplitude and phase via FFT.
    - Smooth the log amplitude and compute the spectral residual.
    - Inverse FFT to obtain a saliency map, blur and normalize, then resize back.

    Returns a float32 saliency map in range [0, 1] with same shape as input.
    """
    try:
        h, w = gray_img.shape
        small = cv2.resize(gray_img, (resize_to, resize_to), interpolation=cv2.INTER_AREA)
        small_f = small.astype(np.float32)

        # FFT
        fft = np.fft.fft2(small_f) # converts image to its frequency representation
        amp = np.abs(fft)
        log_amp = np.log(amp + 1e-8)
        phase = np.angle(fft)

        # Smooth log amplitude and compute spectral residual
        avg_log = cv2.blur(log_amp, (3, 3),cv2.BORDER_REFLECT)
        spectral_residual = log_amp - avg_log

        # Inverse transform
        exp_spec = np.exp(spectral_residual + 1j * phase)
        saliency = np.abs(np.fft.ifft2(exp_spec)) ** 2
        saliency = np.real(saliency)

        # Post-process and normalize
        saliency = cv2.GaussianBlur(saliency, (9, 9), 2.5)
        saliency -= np.clip(saliency.min(), 0, None)
        if saliency.max() > 0:
            saliency = saliency / saliency.max()

        # Resize back to original size
        saliency_full = cv2.resize(saliency.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)
        saliency_full = np.clip(saliency_full, 0.0, 1.0)
        return saliency_full
    except Exception as e:
        logger.debug(f"Saliency computation failed: {e}")
        # Fallback: uniform (no saliency)
        return np.zeros_like(gray_img, dtype=np.float32)


def _save_annotated_image(src_path: str, bbox: tuple[int, int, int, int] | None, focus_score: float, out_path: str | None = None):
    """
    Draw a bounding box and focus score onto the image and save it.

    - bbox: (x1, y1, x2, y2) in image coordinates, or None (in which case no box is drawn).
    - out_path: if provided, save there; otherwise save next to source with '_annotated' suffix.
    """
    try:
        img = cv2.imread(src_path)
        if img is None:
            raise ValueError(f"Failed to load image for annotation: {src_path}")

        h, w = img.shape[:2]
        annotated = img.copy()

        if bbox:
            x1, y1, x2, y2 = bbox
            # clamp
            x1, y1 = max(0, int(x1)), max(0, int(y1))
            x2, y2 = min(w - 1, int(x2)), min(h - 1, int(y2))
            color = (0, 255, 0)
            thickness = max(1, int(round(min(w, h) / 200)))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness)

            # Text: focus score as percentage
            text = f"Focus: {focus_score*100:.0f}%"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            txt_thickness = 2
            # Compute text size and draw background for readability
            (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, txt_thickness)
            txt_x = x1
            txt_y = max(0, y1 - 6)
            # box behind text
            cv2.rectangle(annotated, (txt_x - 2, txt_y - text_h - 2), (txt_x + text_w + 2, txt_y + 4), (0, 0, 0), -1)
            cv2.putText(annotated, text, (txt_x, txt_y), font, font_scale, (255, 255, 255), txt_thickness, cv2.LINE_AA)

        # Determine output path
        if out_path is None:
            base, ext = os.path.splitext(src_path)
            out_path = f"{base}_annotated{ext if ext else '.jpg'}"

        cv2.imwrite(out_path, annotated)
        return out_path
    except Exception:
        logger.debug("Failed to save annotated image", exc_info=True)
        return None


def _calculate_exposure(gray_img: np.ndarray) -> tuple[float, str]:
    """Calculates image exposure based on mean intensity."""
    mean_intensity = np.mean(gray_img)
    score = max(0.0, 1.0 - abs(mean_intensity -
                EXPOSURE_IDEAL_MEAN_INTENSITY) / EXPOSURE_IDEAL_MEAN_INTENSITY)
    explanation = "Brightness is balanced with details in shadows and highlights." if score > 0.8 \
                  else "Image is slightly over/underexposed."
    return score, explanation


def _calculate_noise(gray_img: np.ndarray) -> tuple[float, str]:
    """Estimates image noise from a sample region."""
    # Using a small top-left region; for more robustness, consider analyzing multiple patches
    # or using more advanced noise estimation techniques if this proves insufficient.
    h, w = gray_img.shape
    roi_h, roi_w = min(50, h), min(50, w)  # Ensure ROI is within image bounds
    if roi_h == 0 or roi_w == 0:  # Handle very small images
        return 0.0, "Image too small to reliably estimate noise."

    noise_region = gray_img[0:roi_h, 0:roi_w]
    noise_level = np.std(noise_region)
    score = max(1.0 - noise_level / NOISE_NORMALIZATION_FACTOR, 0.0)
    explanation = "Minimal noise detected." if score > 0.8 else "Noticeable graininess present."
    return score, explanation


def _calculate_color_balance(img: np.ndarray) -> tuple[float, str]:
    """Assesses color balance by comparing mean values of color channels."""
    rgb_means = np.mean(img, axis=(0, 1))  # Mean of B, G, R channels
    # Score is higher if the standard deviation of channel means is low relative to their average
    score = max(0.0, 1.0 - np.std(rgb_means) / (np.mean(rgb_means) +
                1e-6)) if np.mean(rgb_means) > 1e-6 else 0.0
    explanation = "Colors are natural and balanced." if score > 0.8 else "Slight color cast detected."
    return score, explanation


def _calculate_dynamic_range(gray_img: np.ndarray) -> tuple[float, str]:
    """Calculates dynamic range from the histogram of the grayscale image."""
    hist = cv2.calcHist([gray_img], [0], None, [256], [0, 256])
    # Indices of bins with non-zero counts
    active_bins = np.where(hist[:, 0] > 0)[0]
    if len(active_bins) > 0:
        # Difference between highest and lowest active bin
        dynamic_range_val = active_bins[-1] - active_bins[0]
        score = min(float(dynamic_range_val) / DYNAMIC_RANGE_MAX_VALUE, 1.0)
    else:  # Flat image (e.g., all black or all white)
        score = 0.0
    explanation = "Wide dynamic range with details in all tones." if score > 0.8 \
                  else "Limited dynamic range with some detail loss."
    return score, explanation


def _generate_assessment_summary(
    overall_confidence: float,
    focus_area_explanation: str,
    main_subject_name: str | None,
    sharpness_score: float,
    exposure_score: float,
    noise_score: float,
    color_balance_score: float,
    dynamic_range_score: float,
    detected_object_names: set[str]
) -> tuple[str, str, str]:
    """Generates judgement, judgement description, and image description based on scores."""
    judgement = (
        "Excellent" if overall_confidence >= JUDGEMENT_EXCELLENT else
        "Good" if overall_confidence >= JUDGEMENT_GOOD else
        "Fair" if overall_confidence >= JUDGEMENT_FAIR else
        "Poor" if overall_confidence >= JUDGEMENT_POOR else
        "Very Poor"
    )

    jd_parts = []
    # Overall quality statement
    if overall_confidence >= 0.9:
        jd_parts.append("Overall technical quality is excellent.")
    elif overall_confidence >= 0.7:
        jd_parts.append("Overall technical quality is good.")
    elif overall_confidence >= 0.5:
        jd_parts.append("Overall technical quality is fair.")
    else:
        jd_parts.append("Overall technical quality is poor.")

    # Subject assessment
    if "central" in focus_area_explanation.lower() or "no clear main subject" in focus_area_explanation.lower():
        jd_parts.append("No distinct detected subject; focus assessed using a central crop heuristic.")
    elif main_subject_name:
        jd_parts.append(
            f"A main subject ('{main_subject_name}') was identified for focus assessment.")
    else:  # Fallback if main_subject_name is None but some detection happened
        jd_parts.append("A main subject was identified for focus assessment.")

    # Sharpness
    if sharpness_score > 0.8:
        jd_parts.append("Sharpness is excellent.")
    elif sharpness_score > 0.6:
        jd_parts.append("Sharpness is good.")
    elif sharpness_score > 0.4:
        jd_parts.append("Sharpness is acceptable.")
    else:
        jd_parts.append("The image appears blurry or lacks sharpness.")

    # Exposure
    if exposure_score > 0.85:
        jd_parts.append("Exposure is well-balanced.")
    elif exposure_score > 0.7:
        jd_parts.append("Exposure is generally good.")
    elif exposure_score > 0.5:
        jd_parts.append("Exposure is somewhat uneven.")
    else:
        jd_parts.append(
            "The image suffers from poor exposure (likely over or underexposed).")

    # Other issues/strengths
    issues, strengths = [], []
    if noise_score < 0.6:
        issues.append("noticeable noise")
    elif noise_score > 0.85:
        strengths.append("minimal noise")
    if color_balance_score < 0.7:
        issues.append("a potential color cast")
    elif color_balance_score > 0.85:
        strengths.append("good color balance")
    if dynamic_range_score < 0.6:
        issues.append("limited dynamic range")
    elif dynamic_range_score > 0.85:
        strengths.append("a wide dynamic range")

    if issues:
        jd_parts.append(f"Key issues include: {', '.join(issues)}.")
    elif strengths and not issues:  # Only add strengths if no major issues were listed
        jd_parts.append(
            f"Additional strengths include: {', '.join(strengths)}.")

    judgement_description = " ".join(jd_parts)
    image_description = f"Image containing: {', '.join(sorted(list(detected_object_names)))}." \
        if detected_object_names else "Image with no prominent objects detected."

    return judgement, judgement_description, image_description


# --- Main Evaluation Function ---

def evaluate_photo_quality(image_path: str) -> dict:
    """
    Orchestrates the evaluation of a photograph's quality by calling helper functions
    for each metric and then summarizing the results.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Failed to load image: {image_path}")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) # Convert image to grayscale

    # 1. Sharpness (overall)
    sharpness_score, sharpness_explanation = _calculate_sharpness(gray)
    # 1.5 Saliency map (fast)
    saliency_map = _calculate_saliency(gray)
    saliency_peak = float(np.max(saliency_map)) if saliency_map is not None else 0.0
    saliency_explanation = "Prominent salient region detected." if saliency_peak > 0.2 else "No prominent salient region detected."

    # 2. Focus Area (central-crop + saliency heuristic)
    focus_area_score, focus_area_explanation, detected_object_names, main_subject_name, focus_bbox = \
        _calculate_focus_area(img, gray, sharpness_score, saliency_map)

    # 3. Exposure
    exposure_score, exposure_explanation = _calculate_exposure(gray)

    # 4. Noise
    noise_score, noise_explanation = _calculate_noise(gray)

    # 5. Color Balance
    color_balance_score, color_balance_explanation = _calculate_color_balance(
        img)

    # 6. Dynamic Range
    dynamic_range_score, dynamic_range_explanation = _calculate_dynamic_range(
        gray)

    # Calculate overall confidence
    tech_scores = [sharpness_score, focus_area_score,
                   exposure_score, noise_score]
    other_scores = [color_balance_score, dynamic_range_score]
    avg_tech_score = sum(tech_scores) / \
        len(tech_scores) if tech_scores else 0.0
    avg_other_score = sum(other_scores) / \
        len(other_scores) if other_scores else 0.0
    overall_confidence = (avg_tech_score * OVERALL_CONF_TECH_WEIGHT) + \
                         (avg_other_score * OVERALL_CONF_OTHER_WEIGHT)

    # Generate assessment summary
    judgement, judgement_description, image_description = _generate_assessment_summary(
        overall_confidence, focus_area_explanation, main_subject_name,
        sharpness_score, exposure_score, noise_score, color_balance_score,
        dynamic_range_score, detected_object_names
    )

    return {
        "Sharpness": {"confidence": float(sharpness_score), "explanation": sharpness_explanation},
        "Focus Area": {"confidence": float(focus_area_score), "explanation": focus_area_explanation, "bbox": [int(x) for x in focus_bbox] if focus_bbox is not None else None},
        "Exposure": {"confidence": float(exposure_score), "explanation": exposure_explanation},
        "Noise": {"confidence": float(noise_score), "explanation": noise_explanation},
        "Color Balance": {"confidence": float(color_balance_score), "explanation": color_balance_explanation},
        "Dynamic Range": {"confidence": float(dynamic_range_score), "explanation": dynamic_range_explanation},
    "Saliency": {"confidence": float(saliency_peak), "explanation": saliency_explanation},
        "description": image_description,
        "overall_confidence": float(overall_confidence),
        "judgement_description": judgement_description,
        "judgement": judgement
    }


# --- File Processing Function ---

def process_folder(folder_path: str, verbose: bool, move_files: bool, image_verbose: bool):
    """
    Process all images in a folder and print quality evaluation results to the terminal.
    Optionally moves files to 'good', 'fair', or 'bad' subdirectories based on judgement.
    """

    # No external model required; proceed directly.
    logger.info(f"Processing images in folder: {folder_path}")

    # Define paths for sorted images
    good_dir = os.path.join(folder_path, "good_photos")
    fair_dir = os.path.join(folder_path, "fair_photos")
    bad_dir = os.path.join(folder_path, "bad_photos")

    if move_files:
        os.makedirs(good_dir, exist_ok=True)
        os.makedirs(fair_dir, exist_ok=True)
        os.makedirs(bad_dir, exist_ok=True)
        logger.info(f"Good photos will be moved to: {good_dir}")
        logger.info(f"Fair photos will be moved to: {fair_dir}")
        logger.info(f"Bad photos (Poor/Very Poor) will be moved to: {bad_dir}")

    # If image_verbose is requested, prepare a subfolder to store annotated bbox images
    bbox_dir = None
    if image_verbose:
        bbox_dir = os.path.join(folder_path, "focus_bbox")
        os.makedirs(bbox_dir, exist_ok=True)
        logger.info(f"Annotated focus bbox images will be saved to: {bbox_dir}")

    processed_count = 0

    image_files = [f for f in os.listdir(
        folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if not image_files:
        logger.info(f"No image files found directly in {folder_path}.")
        exit(1)

    for filename in image_files:
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(folder_path, filename)
            try:
                # Skip processing files if they are already in one of the target subdirectories
                if move_files:
                    parent_dir_abs = os.path.abspath(
                        os.path.dirname(image_path))
                    # Check if the image's parent directory is one of the target output directories
                    if parent_dir_abs in [os.path.abspath(d) for d in [good_dir, fair_dir, bad_dir]]:
                        if verbose:
                            logger.debug(
                                f"Skipping {filename} as it's already in a target move directory.")
                        continue

                result = evaluate_photo_quality(image_path)
                print(json.dumps(result)) # API reads stdout, not value returned
                return 0
                
                # processed_count += 1

                # # Conditional logging based on verbosity for individual results
                # if verbose:
                #     logger.info(f"--- Results for {filename} ---\n{json.dumps(result, indent=2)}")

                # # Save annotated image if requested (separate flag)
                # if image_verbose:
                #     try:
                #         bbox = result.get("Focus Area", {}).get("bbox")
                #         # bbox may be None or list
                #         if bbox:
                #             # save into the focus_bbox subfolder with same filename + _annotated
                #             if bbox_dir is not None:
                #                 base, ext = os.path.splitext(filename)
                #                 out_path = os.path.join(bbox_dir, f"{base}_annotated{ext if ext else '.jpg'}")
                #             else:
                #                 out_path = None
                #             annotated_path = _save_annotated_image(image_path, tuple(bbox), result["Focus Area"]["confidence"], out_path=out_path)
                #             if annotated_path:
                #                 logger.info(f"Annotated image written: {annotated_path}")
                #     except Exception:
                #         logger.debug("Failed to write annotated image", exc_info=True)
                # else:  # Not verbose, provide a summary regardless of move_files
                #     logger.info(
                #         f"Processed: {filename} - Judgement: {result['judgement']} (Confidence: {result['overall_confidence']:.2f}) - Summary: {result['judgement_description']}")

                # if move_files:
                #     destination_folder = ""
                #     if result['judgement'] in ["Excellent", "Good"]:
                #         destination_folder = good_dir
                #     elif result['judgement'] == "Fair":
                #         destination_folder = fair_dir
                #     else:  # Poor, Very Poor
                #         destination_folder = bad_dir

                #     destination_path = os.path.join(
                #         destination_folder, filename)  # Ensure filename is used, not image_path
                #     shutil.move(image_path, destination_path)
                #     logger.debug(f"Moved {filename} to {destination_folder}")

            except ValueError as ve:  # Catch specific error from imread
                logger.warning(f"Skipping {filename}: {ve}")
            except Exception as e:
                logger.error(
                    f"Error processing {filename}: {e}", exc_info=True)

    if processed_count == 0:
        logger.info(
            f"No image files were processed in {folder_path} (after filtering).")


# --- Main Execution ---

def main():
    """
    Parses command-line arguments, initializes the model, and starts image processing.
    """
    parser = argparse.ArgumentParser(
        description="Analyze photo quality in a folder (fast heuristic, no object detector required).")
    parser.add_argument(
        "--folder_path",
        type=str,
        # default = '/Users/kosek/Downloads/ISIC-images',
        default = '',
        required=True,
        help="Path to the folder containing images to analyze."
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print the full JSON output for each image."
    )
    parser.add_argument(
        "--image_verbose",
        action="store_false",
        help="Save annotated images with focus bounding boxes when processing."
    )
    parser.add_argument(
        "--move",
        action="store_true",
        help="Move photos to 'good_photos', 'fair_photos', or 'bad_photos' subfolders based on judgement."
    )
    args = parser.parse_args()


    # Validate folder path
    if not os.path.exists(args.folder_path):
        logger.error(f"The directory '{args.folder_path}' was not found.")
        exit(1)
    if not os.path.isdir(args.folder_path):
        logger.error(f"The path '{args.folder_path}' is not a directory.")
        exit(1)

    # Start processing
    process_folder(args.folder_path, args.verbose, args.move, args.image_verbose)


if __name__ == "__main__":
    main()
