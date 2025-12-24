"use client"
import { useRouter } from "next/dist/client/components/navigation";

export default function CaptureButton({clickCallback, nextCallback, prevCallback, disablePrev, disableNext, nextText, retake, retakeCallback}: 
    {clickCallback: () => void, nextCallback: () => void, prevCallback: () => void, retakeCallback: () => void,
         disablePrev: boolean, disableNext: boolean, nextText: string, retake: boolean}) {
    const router = useRouter();
    return (
        <div className="relative bg-black h-19 flex items-center justify-center">
            <div className="flex items-center gap-40">
                <button
                    type="button"
                    onClick={() => { disablePrev ? router.back() : prevCallback(); }}
                    disabled={false}
                    className="w-24 py-1 text-md rounded-md border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {disablePrev ? "Back" : "Prev"}
                </button>
                <button
                    type="button"
                    onClick={nextCallback}
                    disabled={disableNext}
                    className="w-24 py-1 text-md rounded-md border border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {nextText}
                </button>
            </div>
            {retake ? 
                <button
                    className="absolute left-1/2 -translate-x-1/2 bg-white uppercase shadow-lg rounded-lg text-black font-semibold text-md hover:bg-white transition-colors duration-200 border border-gray-300 px-6 py-2"
                    onClick={retakeCallback}
                >
                    Retake
                </button>
            : (
            <div className="
              absolute bottom-2 left-1/2 -translate-x-1/2
              bg-white text-black font-semibold
              rounded-full w-15 h-15 shadow-lg
              flex items-center justify-center
            ">
            <div className="
                absolute bottom-1 left-1/2 -translate-x-1/2
                bg-black text-black font-semibold
                rounded-full w-13 h-13 shadow-lg
                flex items-center justify-center
                ">
                <button 
                    className="
                    absolute bottom-0.5 left-1/2 -translate-x-1/2
                    bg-white rounded-full w-12 h-12 shadow-lg
                    flex items-center justify-center
                    transition-all duration-150
                    active:scale-90 active:shadow-md
                    "
                    type="button"
                    onClick={clickCallback}
                    >
                </button>
            </div>
            </div>
            )}
        </div>
        
            
    );
}