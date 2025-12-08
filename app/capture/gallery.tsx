"use client";
// import { useRef, useState, useEffect } from "react";
import { Image } from "@/app/capture/image-helpers";


export default function Gallery( { images }: {images: Image[]} ) {
    return (
        <div>
            {images.length > 0 && (
                <div>
                    {images.map(image => (
                        <div key={image.id} className="mb-4">
                            <img src={image.url} alt={`Captured ${image.id}`} className="max-w-full h-auto rounded-lg border"/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}