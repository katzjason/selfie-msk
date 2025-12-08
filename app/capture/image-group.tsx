"use client";
import React from "react";
import { Image } from "@/app/capture/image-helpers";
import useEmblaCarousel from "embla-carousel-react";

export default function ImageGroup({ images, mrn, anatomicSite, lesionID }: { images: Image[], mrn?: string, anatomicSite: string, lesionID?: string }) {
    const [emblaRef] = useEmblaCarousel();
    return (
        <div className="w-full bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            {images.length > 0 && (
                <div className="text-gray-600 font-semibold text-xs" ref={emblaRef}>
                    <div>MRN: {mrn}</div>
                    <div>Lesion ID: {lesionID}</div>
                    <div>Anatomic Site: {anatomicSite}</div>
                    <div className="flex flex-row overflow-x-auto gap-2 pt-4">
                        {images.map(image => (
                            <div className="w-2/3 flex flex-col items-center shrink-0" key={image.id}>
                                <img src={image.url} alt="Captured" className="h-67 w-50 rounded-lg border border-2 border-gray-200"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


