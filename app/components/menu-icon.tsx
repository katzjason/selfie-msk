"use client"

export default function MenuIcon( { menuOpen, onClick } : { menuOpen : boolean, onClick : () => void}){
    return (
        <button className="relative group flex"
            onClick={onClick}
        >
            <div className="relative flex overflow-hidden items-center justify-center rounded-full w-[72px] h-[72px]">
                <div className="flex flex-col justify-between w-[32px] h-[28px] relative">

                    <div
                    className={[
                        "bg-gradient-to-br from-yellow-500 to-pink-500 h-[3px] w-full transform transition-all duration-300 origin-left",
                        menuOpen ? "translate-x-10 opacity-0" : "translate-x-0 opacity-100",
                    ].join(" ")}
                    />
                    <div
                    className={[
                        "bg-gradient-to-br from-yellow-500 to-pink-500 h-[3px] w-full rounded transform transition-all duration-300",
                        menuOpen ? "translate-x-10 opacity-0 delay-75" : "translate-x-0 opacity-100 delay-75",
                    ].join(" ")}
                    />
                    <div
                    className={[
                        "bg-gradient-to-br from-yellow-500 to-pink-500 h-[3px] w-full transform transition-all duration-300 origin-left",
                        menuOpen ? "translate-x-10 opacity-0 delay-150" : "translate-x-0 opacity-100 delay-150",
                    ].join(" ")}
                    />

                    <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className={[
                        "absolute bg-gradient-to-br from-yellow-500 to-pink-500 h-[3px] w-8 transform transition-all duration-500",
                        menuOpen ? "rotate-45 opacity-100 delay-150" : "rotate-0 opacity-0",
                        ].join(" ")}
                    />
                    <div
                        className={[
                        "absolute bg-gradient-to-br from-yellow-500 to-pink-500 h-[3px] w-8 transform transition-all duration-500",
                        menuOpen ? "-rotate-45 opacity-100 delay-150" : "rotate-0 opacity-0",
                        ].join(" ")}
                    />
                    </div>
                </div>
            </div>
        </button>
    );

}