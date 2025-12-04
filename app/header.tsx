

export default function Header() {
    return (
        <div className="flex flex-row bg-gray-100 text-black h-12 items-center">
            <button className="relative group">
                <div className="relative flex overflow-hidden items-center justify-center rounded-full w-[50px] h-[50px] transform transition-all duration-200">
                <div className="flex flex-col justify-between w-[20px] h-[20px] transform transition-all duration-300 origin-center overflow-hidden">
                    <div className="bg-black h-[2px] w-7 transform transition-all duration-300 origin-left group-focus:translate-x-10"></div>
                    <div className="bg-black h-[2px] w-7 rounded transform transition-all duration-300 group-focus:translate-x-10 delay-75"></div>
                    <div className="bg-black h-[2px] w-7 transform transition-all duration-300 origin-left group-focus:translate-x-10 delay-150"></div>

                    <div className="absolute items-center justify-between transform transition-all duration-500 top-6 -translate-x-10 group-focus:translate-x-0 flex w-0 group-focus:w-12">
                    <div className="absolute bg-black h-[2px] w-5 transform transition-all duration-500 rotate-0 delay-300 group-focus:rotate-45"></div>
                    <div className="absolute bg-black h-[2px] w-5 transform transition-all duration-500 -rotate-0 delay-300 group-focus:-rotate-45"></div>
                    </div>
                </div>
                </div>
            </button>
            <p className="text-black font-normal pl-2 text-xl">Selfie App</p>
        </div>
    );
}