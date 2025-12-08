"use client";
import React from "react";
import { Image } from "@/app/capture/image-type";
import useEmblaCarousel from "embla-carousel-react";

//export default function ImageGroup({ images }: { images: Image[] }) {
export default function ImageGroup() {
    const [emblaRef] = useEmblaCarousel();
    // const images:number[] = [1,2,3,4,5]; // Placeholder images
    const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=400&fit=crop',
    ];


    return (
        <div className="w-full bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            {images.length > 0 && (
                <div className="text-gray-600 font-semibold text-xs" ref={emblaRef}>
                    <div>Lesion ID: 12345</div>
                    <div>Anatomic Site: Upper Extremity</div>
                    <div className="flex flex-row overflow-x-auto gap-2 pt-4">
                        {images.map(image => (
                            <div className="w-2/3 flex flex-col items-center shrink-0" key={image}>
                                <img src={image} alt="Captured" className="h-67 w-50 rounded-lg border border-2 border-gray-200"/>
                            </div>
                     
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


