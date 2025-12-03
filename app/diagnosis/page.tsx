"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Diagnosis() {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState("");
  //const [sex, setSex] = useState("");

  // load stored age and sex on first render
  // useEffect(() => {
  //   const storedAge = localStorage.getItem(STORED_AGE_KEY);
  //   if (storedAge) setAge(storedAge);
  //   const storedSex = localStorage.getItem(STORED_SEX_KEY);
  //   if (storedSex) setSex(storedSex);
  // }, [] );

  function handleNext(e: React.FormEvent){
    e.preventDefault();
    if (diagnosis !== "") {
      // window.localStorage.setItem(STORED_AGE_KEY, age);  
      // window.localStorage.setItem(STORED_SEX_KEY, sex);
      router.push('/anatomic-site');
    }
  }
 
  return (
    <div className="flex flex-col bg-white h-screen">
      <form onSubmit={handleNext} className="flex flex-col h-4/5">
        <main className="flex-1 flex flex-col p-8 w-full max-w-md mx-auto">

          <div className="text-black">
            <div className="block mb-1 font-bold">Diagnosis</div>
            <div className="flex gap-4 pt-2 justify-start">
              <label className="flex items-center gap-2">
                <input 
                  type="radio"
                  name="diagnosis"
                  value="Benign"
                  className="accent-black w-4 h-4"
                  checked={diagnosis==="Benign"}
                  onChange={() => setDiagnosis("Benign")}
                />
                <div>Benign</div>
              </label>

              <label className="flex items-center gap-2 accent-black">
                <input 
                  type="radio"
                  name="diagnosis"
                  value="Biopsy"
                  className="accent-black w-4 h-4"
                  checked={diagnosis==="Biopsy"}
                  onChange={() => setDiagnosis("Biopsy")}
                />
                <div>Biopsy</div>
              </label>
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
                <label className="flex items-center gap-2 accent-black">
                  <input 
                    type="radio"
                    name="clinical-diagnosis"
                    value="Benign"
                    className="accent-black w-4 h-4"
                    checked={diagnosis==="Biopsy"}
                    onChange={() => console.log("hi")}
                  />
                  <div>Benign</div>

                  <input 
                    type="radio"
                    name="clinical-diagnosis"
                    value="Malignant"
                    className="accent-black w-4 h-4"
                    checked={diagnosis==="Biopsy"}
                    onChange={() => console.log("hi")}
                  />
                  <div>Malignant</div>
              </label>
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