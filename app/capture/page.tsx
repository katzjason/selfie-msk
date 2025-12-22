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
    console.log("Error:", error);
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

  const photoSteps = [
    {
      id: "closeup",
      title: "Close-up Photo",
      description: "From 6 inches away, without any camera attachment",
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
  const [imageArr, setImageArr] = useState<{url: string, description: string, score: number}[]>(Array(photoSteps.length).fill({url: "", description: "", score: 0}));


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
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/png");

    // Assess image quality
    const qualityRes = await assessQuality(imageDataUrl)
    const description = qualityRes.description;
    const score = parseInt(qualityRes.score);
      

    setImageArr((prev) => {
      const copy = [...prev];
      copy[stepIndex] = {url: imageDataUrl, description: description, score: score};
      return copy;
    });

        // FIX THIS API CALL!!!!
        // const blob = dataUrlToBlob(imageDataUrl); //  converting data URL to Blob
        // const { url } = await uploadImage(blob);

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


  const goToNextStep = () => {
    if(stepIndex == photoSteps.length-1){
      handleUpload();
    }
    setStepIndex((prev) => Math.min(prev + 1, photoSteps.length - 1));
  };

  const handleUpload = () => {
    // TODO write data to the database

    showToast("Uploaded Lesion No. " + lesionCounter.toString(), 3000);
    updatePatient(prev => ({
      lesionCounter: prev.lesionCounter + 1
    }));
    
    // Clear captured images from local storage
    localStorage.removeItem("capturedImages");
    setImageArr(Array(photoSteps.length).fill({url: "", description: "", score: 0}));

    localStorage.setItem("showReset", "true");
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevStep}
            disabled={stepIndex === 0}
            className="px-2 py-1 text-xs rounded-md border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={goToNextStep}
            //disabled={stepIndex === photoSteps.length - 1}
            className="px-2 py-1 text-xs rounded-md border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {stepIndex == photoSteps.length - 1 ? "Submit" : imageArr[stepIndex].url != "" ? "Next" : "Skip"}
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 max-h-[75vh] bg-black flex items-start justify-center">
        <div className="relative">
          <div className="relative">
            {imageArr[stepIndex].url != "" ? (
              <div>
                <img src={imageArr[stepIndex].url} className="w-full h-auto object-contain bg-black" />
                {/* <div className="text-white text-xs font-semibold flex justify-center">{imageArr[stepIndex].description}</div> */}
                <div className="flex flex-row w-full">
                  <div className="text-xs flex items-center justify-start flex font-semibold px-2 whitespace-nowrap">Quality Score</div>
                  {/* Score Scale */}
                  <div className="w-full pl-4 py-3 bg-black/50">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full overflow-hidden transition-all ${ 
                          imageArr[stepIndex].score > 90 
                            ? 'bg-green-500' 
                            : imageArr[stepIndex].score > 70 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500' 
                        }`} 
                        style={{ width: `${Math.max(imageArr[stepIndex].score, 25)}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <div className="text-xs flex justify-center">{imageArr[stepIndex].description}</div>
              </div>
              
              
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-contain bg-black" />
                <CornerMarkers />
              </div>
            )}        
            
          </div>
          
          {imageArr[stepIndex].url != "" ? (
            <div className="flex justify-center mt-4">
              <button
                className="bg-white uppercase shadow-lg rounded-lg px-6 py-2 text-black font-semibold text-md hover:bg-white transition-colors duration-200 border border-gray-300"
                onClick={() => {
                  // Remove the image for this step
                  const arrCopy = [...imageArr];
                  arrCopy[stepIndex] = {url: "", description: "", score: 0} as any;
                  setImageArr(arrCopy);
                }}
              >
                Retake
              </button>
            </div>
          ) : (
            <CaptureButton clickCallback={async () => {
              await handleCapture();
              goToNextStep();
            }}/>
          )}
          
        </div>
        

        {!imageArr[stepIndex] && (
          <div className="w-10 absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center h-90 justify-between">
            <div className="text-white text-2xl font-semibold pointer-events-none">+</div>
            {/* Zoom Slider */}
            <input
              type="range"
              min={zoomRange?.min ?? 0}
              max={zoomRange?.max ?? 10}
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
