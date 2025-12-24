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

  const photoSteps = [
    {
      id: "close-up",
      title: "Close-up Photo",
      description: "From ~6 inches away, without any camera attachment",
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
  const [imageArr, setImageArr] = useState<{url: string, description: string, score: number, captureTime: string}[]>(
    Array(photoSteps.length).fill({url: "", description: "", score: 0, captureTime: ""})
  );


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // pulls up rear camera
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
      if (!capabilities){
        // ?
      }

    setZoomRange({min: capabilities.zoom.min, max: capabilities.zoom.max});
    const currentSettings = track.getSettings() as any;
    setZoom(currentSettings.zoom || zoomRange?.min || 1);
    } catch (err) {
      console.log("Error initializing zoom capabilities:", err);
    }
  }
    

  const handleZoomChange = async (value: number) => {
    setZoom(value);

    const track = getVideoTrack();
    if (!track) return;

    const constraints: MediaTrackConstraints = {
      advanced: [{ zoom: value }],
    } as any;

    try {
      await track.applyConstraints(constraints);
    } catch (err) {
      console.log("Error applying zoom constraints:", err);
    }
  };

  async function uploadImage(blob: Blob) {
    const form = new FormData();
    form.append("file", blob, "capture.png");

    const res = await fetch("/api/images", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error("Upload failed");
    return res.json(); // { id, filename, url }
  }

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return 0;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/png");

    // Assess image quality
    const qualityRes = await assessQuality(imageDataUrl)
    const description = qualityRes.description;
    const score = parseInt(qualityRes.score);
    const captureTime = new Date().toISOString();

    setImageArr((prev) => {
      const copy = [...prev];
      copy[stepIndex] = {url: imageDataUrl, description: description, score: score, captureTime};
      return copy;
    });

    return score;
  };

  const rafRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<number | null>(null);

  const applyZoomNow = (z: number) => {
    const track = trackRef.current;
    if (!track) return;
    
    // Apply immediately; no need to wait for setState
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

  useEffect(() => {
    startCamera();
    document.body.style.overflow = "hidden"; // locks scrolling

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
  }, [stream, stepIndex, imageArr]);

  function getDeviceCategory() {
    const ua = navigator.userAgent;
    if (/ipad|tablet/i.test(ua)) return "tablet";
    if (/mobile|iphone|android/i.test(ua)) return "mobile";
    return "desktop";
  }

  function getOS() {
    const ua = navigator.userAgent;

    if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
    if (/android/i.test(ua)) return "Android";
    if (/win/i.test(ua)) return "Windows";
    if (/mac/i.test(ua)) return "macOS";
    if (/linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  const goToNextStep = () => {
    if(stepIndex == photoSteps.length-1){
      handleUpload();
    }
    setStepIndex((prev) => Math.min(prev + 1, photoSteps.length - 1));
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
      if (!img?.url) continue;

      // Works for data: URLs and blob: URLs
      const blob = await (await fetch(img.url)).blob();

      const ext = blob.type === "image/png"
        ? "png"
        : blob.type === "image/webp"
          ? "webp"
          : "jpg";

      const filename = `${cleanDiagnosis}_${crypto.randomUUID()}.${ext}`;

      // Append binary part
      formData.append("images", blob, filename);

      // Track metadata aligned with the appended file
      metas.push({
        code: photoSteps[idx].id,
        capture_time: img.captureTime,
        filename,
      });
    }

    formData.append("metas", JSON.stringify(metas));


    // let finalImages : {url: string, code: string, capture_time: string}[] = [];
    // imageArr.forEach(async (img, idx) => {
    //   if(img.url){
    //     const blob = await (await fetch(img.url)).blob();
    //     const ext = blob.type.split("/")[1] || "jpg";
    //     const cleanDiagnosis = patient.clinicalDiagnosis.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    //     const filename = `${cleanDiagnosis}_${crypto.randomUUID()}.${ext}`;
    //     let metadata = {"url" : img.url, "code" : photoSteps[idx].id, "capture_time" : img.captureTime}
    //     finalImages.push(metadata);
    //   }
    // })

    // formData.append("images", JSON.stringify(finalImages));

    // POST request to /api/upload
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    if(res.status == 200){
      showToast("Uploaded Lesion No. " + lesionCounter.toString(), 3000);
      updatePatient(prev => ({
        lesionCounter: prev.lesionCounter + 1
      }));
      // Clear captured images from local storage
      localStorage.removeItem("capturedImages");
      setImageArr(Array(photoSteps.length).fill({url: "", description: "", score: 0}));
      localStorage.setItem("showReset", "true");
    } else {
      showToast("Uknown Upload Failure", 3000);
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
      if (Array.isArray(parsed) && parsed.some((x) => typeof x === "string" && x.length > 0)) {
        // Ensure correct length
        const next = Array(photoSteps.length).fill("");
        for (let i = 0; i < Math.min(parsed.length, next.length); i++) {
          if (typeof parsed[i] === "string") next[i] = parsed[i];
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
    <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] justify-center">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!!stream && <main className="flex-1 flex flex-col p-2 w-full mx-auto overflow-hidden bg-black justify-center">
      {/* Instruction bar at top */}
      <div className="mb-2 rounded-xl bg-black/70 text-white px-3 py-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide opacity-70">
            Step {stepIndex + 1} of {photoSteps.length}
          </span>
          <span className="text-sm font-semibold">
            {photoSteps[stepIndex].title}
          </span>
          <span className="text-xs opacity-80">
            {photoSteps[stepIndex].description}
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 max-h-[75vh] bg-black flex items-start justify-center">
        <div className="relative">
          <div className="relative bg-blue-500">
            {imageArr[stepIndex].url != "" ? ( // VIEWING IMAGE ALREADY TAKEN
              <div>
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
              <div>
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-contain bg-black" />
                <CornerMarkers />
              </div>
            )}        
          </div>

            <CaptureButton clickCallback={async () => {
              const score = await handleCapture();
              if(score > 80 && stepIndex != imageArr.length-1){
                goToNextStep();
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
                // Remove the image for this step
                const arrCopy = [...imageArr];
                arrCopy[stepIndex] = {url: "", description: "", score: 0} as any;
                setImageArr(arrCopy);
              }}
            />
          
        </div>
        

        {!imageArr[stepIndex].url && (
          <div className="w-10 absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center h-90 justify-between">
            <div className="text-white text-2xl font-semibold pointer-events-none">+</div>
            {/* Zoom Slider */}
            <input
              type="range"
              min={zoomRange?.min ?? 0}
              max={Math.min(zoomRange?.max ?? 5, 5)}
              step={0.1}
              value={zoom ?? 1}
              //onChange={(e) => handleZoomChange(Number(e.target.value))}
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
