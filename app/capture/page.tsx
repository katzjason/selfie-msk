'use client';
import { useRef, useState, useEffect } from "react";
import { Image } from "@/app/capture/image-helpers";
import { useRouter } from "next/dist/client/components/navigation";
import FooterButtons from '../components/footer-buttons';
import CaptureButton from '@/app/components/capture-button';
import CornerMarkers from '@/app/components/corner-markers';


export default function Capture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const [zoomRange, setZoomRange] = useState<{min: number, max: number} | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>("HEY");


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

      // setTimeout(() => {
      //   initZoomCapabilities();
      // }, 0);


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
    const track = getVideoTrack();
    if (!track) return;

    const capabilities = track.getCapabilities() as any;
    if (!capabilities){
      setMessage("No capabilities found; Unable to zoom");
    }

    setZoomRange({min: capabilities.zoom.min, max: capabilities.zoom.max});
    const currentSettings = track.getSettings() as any;
    setZoom(currentSettings.zoom || zoomRange?.min || 1);
    setMessage("Min zoom: " + capabilities.zoom.min.toString() + " Max zoom: " + capabilities.zoom.max.toString());
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
  }, [stream]);

  const goToNextStep = () => {
  setStepIndex((prev) => Math.min(prev + 1, photoSteps.length - 1));
};

const goToPrevStep = () => {
  setStepIndex((prev) => Math.max(prev - 1, 0));
};

const photoSteps = [
  {
    id: "overview",
    title: "Overview photo",
    description: "Capture the entire area surrounding the lesion.",
  },
  {
    id: "non-polarized-non-contact",
    title: "Non-Polarized, Non-Contact Photo",
    description: "Make sure the lesion fills most of the frame.",
  },
  {
    id: "non-polarized-contact",
    title: "Non-Polarized, Contact Photo",
    description: "Make sure the lesion fills most of the frame.",
  },
  {
    id: "polarized-contact",
    title: "Polarized, Contact Photo",
    description: "Make sure the lesion fills most of the frame.",
  },
  {
    id: "non-polarized-liquid",
    title: "Non-polarized, Liquid Contact Photo",
    description: "Make sure the lesion fills most of the frame.",
  },
  {
    id: "uv",
    title: "UV, Liquid Contact Photo",
    description: "Make sure the lesion fills most of the frame.",
  },
  
];

const [stepIndex, setStepIndex] = useState(0);


return (
  <div className="flex flex-col min-h-[100dvh] pt-[env(safe-area-inset-top)] justify-center">
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
            disabled={stepIndex === photoSteps.length - 1}
            className="px-2 py-1 text-xs rounded-md border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1 max-h-[75vh] bg-black flex items-start justify-center">
        <div className="relative">
          <div className="relative">
            {/* Live-feed Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto object-contain bg-black "
            />
            <CornerMarkers />
          </div>
          
          <CaptureButton clickCallback={() => {}}/>
        </div>
        

        

        

        <div className="w-10 absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center h-90 justify-between">
          <div className="text-white text-2xl font-semibold pointer-events-none">+</div>
          {/* Zoom Slider */}
          <input
            type="range"
            min={zoomRange?.min ?? 0}
            max={zoomRange?.max ?? 10}
            step={0.01}
            value={zoom ?? 1}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            aria-orientation="vertical"
            className="slider-vertical -rotate-90"
              style={{
                WebkitAppearance: "none",
                width: "300px",
              }}
          />
          <div className="text-white text-2xl font-semibold pointer-events-none">-</div>
        </div>
      </div>
      
    </main>}
  </div>
            
);
}
