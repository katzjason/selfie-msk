'use client';
import { useRef, useState, useEffect } from "react";
import { Image, dataUrlToBlob } from "@/app/capture/image-helpers";
import { useRouter } from "next/dist/client/components/navigation";
import FooterButtons from '../components/footer-buttons';
import CaptureButton from '@/app/components/capture-button';
import CornerMarkers from '@/app/components/corner-markers';
import { useToast } from '@/app/components/toast-provider';
import { usePatient } from '@/app/contexts/patient';


// Request for Image Quality using Kivanc's model
async function assessQuality( dataUrl : string) {
  
  // Converting the dataUrl to a blob for more efficient transport
  const blob = await (await fetch(dataUrl)).blob();
  const formData = new FormData();
  formData.append("image", blob, "capture.png");
  let description = "";
  let score = "";

  const res = await fetch("/api/quality", {
      method: "POST",
      body: formData,
  }).then((response) => (response.json())
    .then((data) => {
      const sharpness = data["Sharpness"]["confidence"];
      const focus = data["Focus Area"]["confidence"];
      description += focus > 0.8 ? "Object appears well-centered " : "Object appears off-center "
      description += focus > 0.8 !== sharpness > 0.8 ? "but " : "and ";
      description += sharpness > 0.8 ? "edges are clear." : "edges are blurry";
      score = ((sharpness * 0.5 + focus * 0.5) * 100).toString();
      return {description : description, score : score};
  })).catch((error) => {
    return {description : "Quality assessment failed", score : "0"};
  });
  return res;
}


export default function Capture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const {lesionCounter, updatePatient} = usePatient();
  const patient = usePatient();
  const [supportsFocus, setSupportsFocus] = useState<boolean>(false);

  const photoSteps = [
    {
      id: "close-up",
      title: "Close-up Photo",
      description: "From ~6 inches away, without any camera attachment",
    },
    {
      id: "non-polarized-cone",
      title: "Non-Polarized, Cone Attachment w/o Glass",
      description: "Make sure the lesion fills most of the frame",
    },
    {
      id: "polarized-contact",
      title: "Polarized, Contact Photo",
      description: "Make sure the lesion fills most of the frame",
    },
    {
      id: "non-polarized-contact",
      title: "Non-Polarized, Contact Photo",
      description: "Make sure the lesion fills most of the frame",
    },
    {
      id: "non-polarized-liquid-contact",
      title: "Non-polarized, Liquid Contact Photo",
      description: "Apply liquid and turn select non-polarized light",
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [imageArr, setImageArr] = useState<{url: string, blob: Blob | null, description: string, score: number, captureTime: string}[]>(
    Array(photoSteps.length).fill({url: "", blob: null, description: "", score: 0, captureTime: ""})
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCapturedImage, setShowCapturedImage] = useState(false);
  const [isSliding, setIsSliding] = useState(false);


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: {ideal: 4032, max: 4032},
          height: {ideal: 3024, max: 3024}  
        }, // pulls up rear camera
        audio: false, 
      });

      setStream(mediaStream); // saving the stream into device state

      if (videoRef.current) { // attaching the stream to the video HTML element
        videoRef.current.srcObject = mediaStream;
      }

      const [track] = mediaStream.getVideoTracks();
      trackRef.current = track || null;

    } catch (err) {
      console.log("Error starting camera:",err);
    }
  }

  const getVideoTrack = () => {
    if (!stream) return null;
    const [track] = stream.getVideoTracks();
    trackRef.current = track || null;
    return trackRef.current;
  }
  

  const initZoomCapabilities = () => {
    try {
      const track = getVideoTrack();
      if (!track) return;

      const capabilities = track.getCapabilities() as any;
      if ('focusMode' in capabilities){
        setSupportsFocus(true);
      }

      console.log("Supports Focus: ", supportsFocus);
  
    setZoomRange({min: capabilities.zoom.min, max: capabilities.zoom.max});
    const currentSettings = track.getSettings() as any;
    setZoom(currentSettings.zoom || zoomRange?.min || 1);
    } catch (err) {
      console.log("Error initializing zoom capabilities:", err);
    }
  }

  function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  const handleCapture = async () => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    if (!video || !canvas) return 0;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use toBlob to get a JPEG
    return new Promise<number>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(0);
          return;
        }

        // Create object URL for display (more memory efficient than data URL)
        const objectUrl = URL.createObjectURL(blob);

        // Assess image quality (convert blob to dataUrl for model if needed)
        const reader = new FileReader();

        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const qualityRes = await assessQuality(dataUrl);
          const description = qualityRes.description;
          const score = parseInt(qualityRes.score);
          const captureTime = new Date().toISOString();
          
          setImageArr((prev) => {
            const copy = [...prev];
            // Store both the blob and object URL
            copy[stepIndex] = {url: objectUrl, blob: blob, description: description, score: score, captureTime};
            return copy;
          });
          // Show the captured image for 1 second
          setShowCapturedImage(true);
          setTimeout(() => {
            setShowCapturedImage(false);
          }, 1000);
          resolve(score);
        };
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const rafRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<number | null>(null);
  const lastAppliedTimeRef = useRef<number>(0);

  const applyZoomNow = (z: number) => {
    const track = trackRef.current;
    if (!track) return;
    
    const now = performance.now();
    // Throttle to max one constraint update every 100ms at high resolution
    if (now - lastAppliedTimeRef.current < 100) return;
    
    lastAppliedTimeRef.current = now;
    track.applyConstraints({ advanced: [{ zoom: z }] } as any).catch(() => {
      // Some devices/browsers won't support zoom; ignore gracefully
    });
  };

  const scheduleZoom = (z: number) => {
    pendingZoomRef.current = z;

    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingZoomRef.current == null) return;
      applyZoomNow(pendingZoomRef.current);
    });
  };

  const handleVideoClick = async (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = videoRef.current;
    const track = trackRef.current;
    if (!video || !track) return;

    const rect = video.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    console.log("X: ", x, " Y: ", y);
    try {
      await track.applyConstraints({
        advanced: [{ 
          focusMode: "manual",
          pointsOfInterest: [{ x, y }] 
        }]
      } as any);
    } catch (err) {
      console.log("Focus not supported or failed:", err);
    }
  };

  useEffect(() => {
    startCamera();
    document.body.style.overflow = "hidden"; // locks scrolling
    // Set initial zoom based on stepIndex: 5 for step 0, 2 otherwise
    setZoom(stepIndex === 0 ? 5 : 2);

    return () => {
      document.body.style.overflow = "";
    };
  }, [])

  useEffect(() => {
    
    if (!stream) return;
    initZoomCapabilities();
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    // Apply zoom preset based on stepIndex: 5 for step 0
    if(stepIndex == 0){
      setZoom(5);
      applyZoomNow(5);
    }
  }, [stream, stepIndex, imageArr]);

  function getDeviceCategory() {
    const ua = navigator.userAgent;
    if (/ipad|tablet/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function getOS() {
    const ua = navigator.userAgent;

    // iOS version detection
    if (/iphone|ipad|ipod/i.test(ua)) {
      const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        const version = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
        return `iOS ${version}`;
      }
      return "iOS";
    }

    // Android version detection
    if (/android/i.test(ua)) {
      const match = ua.match(/Android (\d+(?:\.\d+)?(?:\.\d+)?)/);
      if (match) {
        return `Android ${match[1]}`;
      }
      return "Android";
    }

    // Windows version detection
    if (/win/i.test(ua)) {
      const match = ua.match(/Windows NT (\d+\.\d+)/);
      if (match) {
        const ntVersion = match[1];
        const versionMap: Record<string, string> = {
          '10.0': '10/11',
          '6.3': '8.1',
          '6.2': '8',
          '6.1': '7',
          '6.0': 'Vista',
          '5.1': 'XP',
        };
        return `Windows ${versionMap[ntVersion] || ntVersion}`;
      }
      return "Windows";
    }

    // macOS version detection
    if (/mac/i.test(ua)) {
      const match = ua.match(/Mac OS X (\d+)[_.](\d+)(?:[_.](\d+))?/);
      if (match) {
        const version = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
        return `macOS ${version}`;
      }
      return "macOS";
    }

    if (/linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  const goToNextStep = (options?: { slide?: boolean }) => {
    const { slide = false } = options ?? {};
    if(stepIndex == photoSteps.length-1){
      handleUpload();
      return;
    }

    if(stepIndex == 0){
      setZoom(2);
      applyZoomNow(2);
    }
    
    // Trigger slide-out animation
    setIsSliding(slide);
    
    // Wait for animation to complete, then move to next step
    setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, photoSteps.length - 1));
      setIsSliding(false);
    }, 300);
  };

  const handleUpload = async () => {
    // Assemble form data
    let formData = new FormData();

    // Adding saved patient/lesion data
    formData.append("age", patient.age);
    formData.append("sex", patient.sex);
    formData.append("monk_skin_tone", patient.monkSkinTone);
    formData.append("fitzpatrick", patient.fitzpatrick);
    formData.append("race", patient.race);
    formData.append("biopsy", patient.biopsy.toString());
    formData.append("patient_id", patient.mrn);
    formData.append("lesion_id", patient.lesionID);
    formData.append("clinical_diagnosis", patient.clinicalDiagnosis); 
    formData.append("anatomic_site", patient.anatomicSite);

    // Adding image details
    formData.append("device_type", getDeviceCategory());
    formData.append("os", getOS());

    type ImageMeta = { code: string; capture_time: string; filename: string };
    const metas: ImageMeta[] = [];

    const cleanDiagnosis = patient.clinicalDiagnosis
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    for (let idx = 0; idx < imageArr.length; idx++) {
      const img = imageArr[idx];
      if (!img?.blob) continue;

      const mimeMap : Record<string, string>= {
        "image/png": "png",
        "image/webp": "webp",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/heic": "heic",
        "image/avif": "avif",
        "image/gif": "gif",
        "image/svg+xml": "svg"
      };

      const ext = mimeMap[img.blob.type] || "jpg";

      const filename = `${cleanDiagnosis}_${crypto.randomUUID()}.${ext}`;

      // Append binary part directly from stored blob
      formData.append("images", img.blob, filename);

      // Track metadata aligned with the appended file
      metas.push({
        code: photoSteps[idx].id,
        capture_time: img.captureTime,
        filename,
      });
    }

    formData.append("metas", JSON.stringify(metas));


    // POST request to /api/upload
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    if(res.status == 200){
      showToast("Uploaded Lesion No. " + lesionCounter.toString(), 4000);
      updatePatient(prev => ({
        lesionCounter: prev.lesionCounter + 1
      }));
      showToast("Uploaded Lesion No. " + lesionCounter.toString(), 4000);
      updatePatient(prev => ({
        lesionCounter: prev.lesionCounter + 1
      }));
      // Clear captured images from local storage
      localStorage.removeItem("capturedImages");
      // Revoke object URLs to free memory
      imageArr.forEach(img => {
        if (img.url) URL.revokeObjectURL(img.url);
      });
      setImageArr(Array(photoSteps.length).fill({url: "", blob: null, description: "", score: 0, captureTime: ""}));
      localStorage.setItem("showReset", "true");
    } else {
      showToast("Unknown Upload Failure", 4000);
    }
    
    // Navigate back to page to capture next lesion
    router.back();
  }

  const goToPrevStep = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  
  useEffect(() => {
    const stored = localStorage.getItem("capturedImages");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((x) => x?.url && x.url.length > 0)) {
        // Ensure correct length and structure
        const next = Array(photoSteps.length).fill({url: "", description: "", score: 0, captureTime: ""});
        for (let i = 0; i < Math.min(parsed.length, next.length); i++) {
          if (parsed[i]?.url) {
            next[i] = parsed[i];
          }
        }
        setImageArr(next);
      }
    } catch {

    }
  }, []); // run once

  useEffect(() => {
    localStorage.setItem("capturedImages", JSON.stringify(imageArr));
  }, [imageArr]);



  return (
    <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] justify-center">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!!stream && <main className="flex-1 flex flex-col p-2 w-full mx-auto overflow-hidden bg-black justify-center pb-4">
      {/* Instruction bar at top */}
      <div className="mb-2 rounded-xl bg-black/70 text-white px-3 py-2 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-[10px] uppercase tracking-wide opacity-70">
            Step {stepIndex + 1} of {photoSteps.length}
          </div>
          <div className="text-sm font-semibold">
            {photoSteps[stepIndex].title}
          </div>
          <div className="text-xs opacity-80">
            {photoSteps[stepIndex].description}
          </div>
        </div>
      </div>

      <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-visible pb-24">
        <div className="relative flex flex-col items-center" style={{ maxHeight: 'calc(100dvh - 200px)' }}>
          <div className="relative">
            {imageArr[stepIndex].url != "" ? ( // VIEWING IMAGE ALREADY TAKEN
              <div className={`transition-transform duration-300 ${
                isSliding ? '-translate-x-[100vw]' : 'translate-x-0'
              }`}>
                <img src={imageArr[stepIndex].url} className="w-full h-auto object-contain bg-black" />
                {/* Quality Score */}
                <div className="absolute bottom-0 flex flex-col w-full bg-black/50">

              
                  <div className="flex flex-row w-full">
                    <div className="text-xs flex items-center justify-start flex font-semibold pt-2 px-2 whitespace-nowrap">Quality Score</div>
                    
                    <div className="w-full pl-4 pb-1 pt-3 pr-2">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full overflow-hidden transition-all ${ 
                            imageArr[stepIndex].score > 80 
                              ? 'bg-green-500' 
                              : imageArr[stepIndex].score > 60 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500' 
                          }`} 
                          style={{ width: `${Math.max(imageArr[stepIndex].score, 25)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs flex justify-center w-full pb-1">{imageArr[stepIndex].description}</div>
                </div>
                
              </div>
            ) : (
              <div className="relative inline-block">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="max-w-full max-h-[calc(100dvh-150px)] w-auto h-auto object-contain bg-black cursor-pointer block" 
                  onClick={supportsFocus ? handleVideoClick : () => {console.log("Tap to focus is not supported")}}
                />
                <CornerMarkers />
                {/* Shutter effect overlay */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-black z-10" />
                )}
                {/* Show captured image overlay for 1 second */}
                {showCapturedImage && imageArr[stepIndex].url && (
                  <div className="absolute inset-0 bg-black z-20">
                    <img src={imageArr[stepIndex].url} className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            )}        
          </div>

            <div className="">
              <CaptureButton 
                clickCallback={ async () => {
                // Trigger shutter effect
                setIsCapturing(true);
                
                setTimeout(() => { // turn off shutter effect after 200ms
                  setIsCapturing(false);
                }, 200);
                
                const score = await handleCapture();
                
                // Wait for the 2-second image display, then auto-advance if quality is good
                if(score > 80 && stepIndex != imageArr.length-1){
                  setTimeout(() => {
                    goToNextStep({ slide: true });
                  }, 2000);
                }
              }}
              nextCallback={goToNextStep}
              prevCallback={goToPrevStep}
              disablePrev={stepIndex === 0}
              //disableNext={stepIndex === photoSteps.length - 1}
              disableNext={false}
              nextText={stepIndex == photoSteps.length - 1 ? "Submit" : imageArr[stepIndex].url != "" ? "Next" : "Skip"}
              retake={imageArr[stepIndex].url != ""}
              retakeCallback={() => {
                // Remove the image for this step and revoke object URL
                const arrCopy = [...imageArr];
                if (arrCopy[stepIndex].url) {
                  URL.revokeObjectURL(arrCopy[stepIndex].url);
                }
                arrCopy[stepIndex] = {url: "", blob: null, description: "", score: 0, captureTime: ""};
                setImageArr(arrCopy);
              }}
            />
            </div>
        </div>
        
        {!imageArr[stepIndex].url && (
          <div className="w-10 absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center h-90 justify-between">
            <div className="text-white text-2xl font-semibold pointer-events-none">+</div>
            {/* Zoom Slider */}
            <input
              type="range"
              min={stepIndex > 0 ? 1 : zoomRange?.min ?? 0}
              max={Math.min(zoomRange?.max ?? 5, 5)}
              step={0.1}
              value={zoom ?? 1}
              onInput={(e) => {
                const z = Number((e.target as HTMLInputElement).value);
                setZoom(z);        // UI thumb updates
                scheduleZoom(z);   // camera updates “live”
              }}
              aria-orientation="vertical"
              className="slider-vertical -rotate-90"
                style={{
                  WebkitAppearance: "none",
                  width: "300px",
                }}
            />
            <div className="text-white text-2xl font-semibold pointer-events-none">-</div>
          </div>)}
        </div>
      
    </main>}
  </div>
            
);
}
