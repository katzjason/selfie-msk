

export default function FooterButtons( {activateNext, showBack, showNext, handleBack, handleNext} : {
    activateNext: boolean, showBack: boolean, showNext: boolean, handleBack: (e: React.FormEvent<Element>) => void, handleNext: (e: React.FormEvent<Element>) => void
}) {
    return (
        <footer>
          <div className="w-full mx-auto p-8 flex flex-row justify-center">
            {showBack && <button type="submit" 
              className="w-1/2 mr-1 px-4 py-3 rounded bg-gray-300 text-black font-semibold"
              onClick={handleBack}>
              Previous
            </button>
            }
            {showNext && <button type="submit" 
              className={`w-1/2 ml-1 px-4 py-3 rounded 
                ${activateNext ? "opacity-100" : "opacity-25"} bg-gray-300 text-black font-semibold`}
              onClick={handleNext}>
              Next
            </button>
        }
          </div>
        </footer>
    );
}