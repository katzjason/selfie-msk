

export default function ReportBug({clickCallback} : {clickCallback : () => void}) {
    return(
        <div>
            <img 
                onClick={clickCallback}
                src="/bug.png"
                className="fixed bottom-4 w-14 h-14 right-2 z-[9999]
                 transition hover:-translate-y-0.5"
            />
        </div>
        
    );
}