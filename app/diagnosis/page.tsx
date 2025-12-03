"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatient } from '@/app/contexts/patient';

export default function Diagnosis() {

  const diagnosisOptions : string[] = ["Benign", "Biopsy"];
  const clinicalDiagnosisOptions : string[] = ["Benign", "Malignant"];

  const {
      mrn,
      setMrn,
      lesionID,
      setLesionID,
      diagnosis,
      setDiagnosis,
      clinicalDiagnosis,
      setClinicalDiagnosis,
    } = usePatient();

  const router = useRouter();

  // load stored diagnosis, MRN, lesionID, clinicalDiagnosis on first render
  useEffect(() => {
    setDiagnosis(localStorage.getItem("diagnosis") || "");
    setMrn(localStorage.getItem("mrn") || "");
    setLesionID(localStorage.getItem("lesionID") || "");
    setClinicalDiagnosis(localStorage.getItem("clinicalDiagnosis") || "");
  }, []);

  function handleNext(e: React.FormEvent){
    e.preventDefault();
    if (diagnosis == "Benign") {
      window.localStorage.setItem("mrn", "");  
      window.localStorage.setItem("lesionID", "");
      window.localStorage.setItem("clinicalDiagnosis", "");
    } else {
      window.localStorage.setItem("mrn", mrn);  
      window.localStorage.setItem("lesionID", lesionID);
      window.localStorage.setItem("clinicalDiagnosis", clinicalDiagnosis);
    }
      window.localStorage.setItem("diagnosis", diagnosis);
      router.push('/anatomic-site');
  }
 
  return (
    <div className="flex flex-col bg-white h-screen">
      <form onSubmit={handleNext} className="flex flex-col h-4/5">
        <main className="flex-1 flex flex-col p-8 w-full max-w-md mx-auto">

          <div className="text-black">
            <div className="block mb-1 font-bold">Diagnosis</div>
            <div className="flex gap-4 pt-2 justify-start">

              {diagnosisOptions.map(option => (
                <label key={option} className="flex items-center gap-2">
                  <input 
                    type="radio"
                    name="diagnosis"
                    value={option}
                  className="accent-black w-4 h-4"
                  checked={diagnosis===option}
                  onChange={() => setDiagnosis(option)}
                />
                <div>{option}</div>
               </label>
              ))}
            </div>

            {diagnosis === "Biopsy" && 
              <div>
                <div className="block mb-1 font-bold pt-4">MRN</div>
                <label className="flex items-center gap-2 accent-black pt-2">
                  <input 
                    className="border rounded px-3 py-2 w-full text-black"
                    onChange={(e) => console.log("hi")}
                    placeholder="e.g. 12345678"
                  />
                </label>

                <div className="block mb-1 font-bold pt-4">Lesion ID</div>
                <label className="flex items-center gap-2 accent-black">
                  <input 
                    className="border rounded px-3 py-2 w-full text-black"
                    onChange={(e) => console.log("hi")}
                    placeholder="e.g. 12345678"
                  />
                </label>

                <div className="block mb-1 font-bold pt-4">Clinical Diagnosis</div>
                <div className="flex flex-row gap-4">
                {clinicalDiagnosisOptions.map(option => (
                <label key={option} className="flex items-center gap-2">
                  <input 
                    type="radio"
                    name="clinical-diagnosis"
                    value={option}
                  className="accent-black w-4 h-4"
                  checked={clinicalDiagnosis===option}
                  onChange={() => setClinicalDiagnosis(option)}
                />
                <div>{option}</div>
               </label>
              ))}
              </div>
              </div>
            }
          </div>
          
        </main>
        <footer>
          <div className="w-full max-w-md mx-auto p-8 flex justify-center">
            <button type="submit" 
              className={`w-1/2 px-4 py-3 rounded 
                ${diagnosis !== "" ? "opacity-100" : "opacity-25"} bg-gray-300 text-black font-semibold`}
              onClick={handleNext}>
              Next
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}