"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatient } from '@/app/contexts/patient';

const anatomicSites : string[] = [
  "Head/Neck",
  "Upper Extremity",
  "Lower Extremity",
  "Anterior Torso",
  "Lateral Torso",
  "Posterior Torso",
  "Palms/Soles",
  "Oral/Genital"
];

export default function AnatomicSite() {
    const router = useRouter();
    const {
      anatomicSite,
      setAnatomicSite
    } = usePatient();
  
    // load stored anatomic site on first render
    useEffect(() => {
      setAnatomicSite(localStorage.getItem("anatomicSite") || "");
    }, [] );
  
    function handleNext(e: React.FormEvent){
      e.preventDefault();
      if (anatomicSite !== "") {
        window.localStorage.setItem("anatomicSite", anatomicSite);
        router.push('/capture');
      }
    }
    
    return (
      <div className="flex flex-col bg-white h-screen">
        <form onSubmit={handleNext} className="flex flex-col h-4/5">
          <main className="flex-1 flex flex-col p-8 w-full max-w-md mx-auto">
  
            <div className="text-black">
              <div className="block mb-1 font-bold">Anatomic Site</div>
              <div className="flex flex-col gap-4 pt-2 justify-start">
                {anatomicSites.map((site) => (
                  <label key={site} className="flex items-center gap-2">
                    <input 
                      type="radio"
                      name="anatomic-site"
                      value={site}
                      className="accent-black w-4 h-4"
                      checked={anatomicSite === site}
                      onChange={() => setAnatomicSite(site)}
                    />
                    <div>{site}</div>
                  </label>
                ))}
              </div>
            </div>
            
          </main>
          <footer>
            <div className="w-full max-w-md mx-auto p-8 flex justify-center">
              <button type="submit" 
                className={`w-1/2 px-4 py-3 rounded 
                  ${anatomicSite !== "" ? "opacity-100" : "opacity-25"} bg-gray-300 text-black font-semibold`}
                onClick={handleNext}>
                Next
              </button>
            </div>
          </footer>
        </form>
      </div>
    );
  }


