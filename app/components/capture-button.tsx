"use client"

export default function CaptureButton({clickCallback}: {clickCallback: () => void}) {
    return (
        <div className="bg-black h-19">
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
                    bg-white text-black font-semibold
                    rounded-full w-12 h-12 shadow-lg
                    flex items-center justify-center
                    "
                    type="button"
                    onClick={clickCallback}
                    >
                </button>
            </div>
            </div>
        </div>
    );
}