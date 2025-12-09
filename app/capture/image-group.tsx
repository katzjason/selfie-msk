"use client";
import React from "react";
import { Image } from "@/app/capture/image-helpers";
import useEmblaCarousel from "embla-carousel-react";


export default function ImageGroup({ images, mrn, anatomicSite, lesionID, onAddPhoto }: {
  images: Image[],
  mrn?: string,
  anatomicSite: string,
  lesionID?: string,
  onAddPhoto?: () => void
}) {
    const [emblaRef] = useEmblaCarousel();
    return (
        <div className="w-full bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            {images.length > 0 && (
                <>
                    <div className="flex flex-row w-full gap-6 pl-2 mb-2">
                        <div className="flex flex-col justify-start items-start">
                            <div className="text-xs uppercase text-gray-600">MRN</div>
                            <div className="text-sm text-gray-600 font-semibold">{mrn}</div>
                        </div>
                        <div className="flex flex-col justify-start items-start">
                            <div className="text-xs uppercase text-gray-600">Lesion ID</div>
                            <div className="text-sm text-gray-600 font-semibold">{lesionID}</div>
                        </div>
                        <div className="flex flex-col justify-start items-start">
                            <div className="text-xs uppercase text-gray-600">Anatomic Site</div>
                            <div className="text-sm text-gray-600 font-semibold">{anatomicSite}</div>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden mt-4">
                        <div ref={emblaRef}>
                            <div className="flex flex-row gap-2">
                                {images.map(image => (
                                    <div className="w-2/3 flex flex-col items-center shrink-0" key={image.id}>
                                        <img src={image.url} alt="Captured" className="h-67 w-50 rounded-lg border border-2 border-gray-200"/>
                                    </div>
                                ))}
                                <div
                                    className="w-20 flex flex-col items-center justify-center shrink-0 cursor-pointer rounded-lg border border-2 border-gray-200 bg-gradient-to-br from-yellow-500 to-pink-500 hover:bg-gray-300 transition"
                                    
                                    onClick={onAddPhoto}
                                >
                                <div className="text-5xl text-white font-thin">+</div>
                            </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


