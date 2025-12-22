README: Focus heuristic and annotated bbox output

This document explains the focus-area heuristic added to the simplified Photo Quality Analyzer
(`analyzer_v1.py`), the saliency map, how annotated images are saved, and how to interpret
the bounding box and focus score.

Overview
--------
The analyzer  uses a fast, CPU-friendly heuristic to estimate focus on the "main" subject. 

The heuristic combines two measures:
1. Central-crop sharpness
   - A center crop (default 40% × 40% of the image) is used as a quick proxy for a
     main subject in images where the subject is near the center.
   - Sharpness is measured using the variance of the Laplacian on the crop.

2. Spectral-residual saliency
   - A fast spectral-residual saliency map (Hou & Zhang) is computed on a small resized
     version of the image (default 256x256) to identify visually salient regions.
   - The algorithm computes the spectral residual in log-amplitude space via FFT,
     performs a small blur, inverse-transforms, then upsamples back to the image size.
   - The saliency peak location is treated as a candidate "main subject" and a
     Laplacian-variance sharpness is computed on a region around that peak.

Combining the two
-----------------
- The heuristic computes sharpness for the central crop and for the saliency-defined
  region. It chooses the stronger (higher) score as the "Focus Area" confidence.
- The chosen bounding box (center crop or saliency ROI) is returned in the results
  as `Focus Area.bbox` and is used for annotated images.

Annotated images (bounding boxes)
---------------------------------
- Use the command-line flag `--image_verbose` to request annotated images:

```bash
python3 analyzer_v1.py --folder_path /path/to/images --image_verbose
```

- When `--image_verbose` is set the script creates a `focus_bbox` subfolder inside
  the input folder and writes annotated images there. Each annotated image has the
  same filename as the original plus the `_annotated` suffix (e.g. `IMG_0001_annotated.jpg`).

- The annotation includes:
  - A green rectangle (bbox) that identifies the chosen region used for the focus score.
  - A small label near the rectangle with the `Focus: XX%` value (rounded).

Interpreting the values
-----------------------
- `Focus Area.confidence` is a value in [0.0, 1.0]. Higher values indicate stronger
  edge contrast (sharper region) in the chosen region.
- `Focus Area.bbox` is a list `[x1, y1, x2, y2]` representing pixel coordinates in the
  original image coordinate system.
- `Saliency` (returned independently) reports the maximum saliency value in [0,1].
  A higher saliency indicates a more clearly defined salient region.

Limitations
-----------
- The heuristic is a pragmatic compromise: it's fast and works well for many common
  photo sets, but it does not perform semantic object detection. If the dataset
  has consistently off-center or very small subjects, consider one of the following:
  - Use the `--image_verbose` annotated outputs to inspect bounding boxes visually.
  - Extend the heuristic to compute sharpness on multiple crops (center + grid) and
    combine them if necessary.
  - Re-introduce a detector (YOLO) for semantic subject selection if you need class-aware
    focus assessments.

Developer notes
---------------
- Annotated images are saved using OpenCV's `cv2.imwrite`. The bounding box coordinates
  are converted to native Python ints to ensure JSON serialization compatibility.
- The saliency implementation is intentionally small and fast (resizes to 128×128, uses
  simple blur). It is not tuned for top performance quality; it's a practical default.


---
