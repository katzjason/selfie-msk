import useEmblaCarousel from 'embla-carousel-react';

export default function FitzpatrickCarousel() {
    const [emblaRef] = useEmblaCarousel();


    return (
        <div className="embla w-screen h-10" ref={emblaRef}>
            <div className="embla__container flex flex-row h-full">
                <div className="embla__slide w-1/3 flex flex-col">
                    <div className="bg-[#F6E2CE] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">1</div>
                </div>
                <div className="embla__slide w-1/3">
                    <div className="bg-[#E8C9B1] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">2</div>
                </div>
                <div className="embla__slide w-1/3">
                    <div className="bg-[#D1A67F] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">3</div>
                </div>
                <div className="embla__slide w-1/3">
                    <div className="bg-[#A97456] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">4</div>
                </div>
                <div className="embla__slide w-1/3">
                    <div className="bg-[#6C4A2C] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">5</div>
                </div>
                <div className="embla__slide w-1/3">
                    <div className="bg-[#3D2C1E] h-2/3"></div>
                    <div className="h-1/3 flex items-center justify-center pt-2">6</div>
                </div>
            </div>

        </div>
    );
}