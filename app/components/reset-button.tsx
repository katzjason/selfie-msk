

export default function ResetButton(){
    return (
        <div className="w-full flex justify-end">
            <button
                className="bg-white rounded-xl p-1 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-gray-700 text-xs font-semibold w-1/3 uppercase"
                onClick={() => {
                    localStorage.removeItem("patient-context");
                    localStorage.removeItem("showReset");
                    localStorage.removeItem("capturedImages");
                    window.location.reload();
                }}
                >Reset
            </button>
        </div>
        
    );
}