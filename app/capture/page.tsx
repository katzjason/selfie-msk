'use client';
import { useRef, useState } from "react";
import Gallery from "@/app/capture/gallery";
import { Image } from "@/app/capture/image-helpers";
import { useRouter } from "next/dist/client/components/navigation";
import FooterButtons from '../components/footer-buttons';


export default function Capture() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<Image[]>([]);

  const handleClick = () => {
    inputRef.current?.click(); // Trigger the hidden input
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);

    setImages((prev) => [
      ...prev,
      { id: (`${Date.now()}-${Math.random()}`), url: url}
    ]);
  };


  return (
    <div className="flex flex-col bg-white h-screen">
      <main className="flex-1 flex flex-col p-8 w-full max-w-md mx-auto overflow-hidden">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClick}
            className="bg-gray-300 text-black font-semibold px-4 py-2 rounded-lg"
          >
            Capture New Photo
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment" // rear camera on most phones
            onChange={handleChange}
            style={{ display: "none" }}
          />

          <p className="text-xs text-gray-500 text-center max-w-xs">
            You’ll be briefly taken to your camera.  
            Adjust so that the lesion is in focus, then take a clear photo.
          </p>

          <div className="mt-8 block mb-1 text-black font-bold">Photo Gallery</div>
        </div>
        <div className="overflow-y-auto flex-1">
          <Gallery images={images}/>
        </div>
      </main>
      <FooterButtons activateNext={false} showBack={true} showNext={false} handleNext={()=>{}} handleBack={(e) => {e.preventDefault(); router.back();}} />
    </div>
  );
}
