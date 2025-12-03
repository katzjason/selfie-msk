"use client";
import Link from 'next/link';
import {  useState } from 'react';
import { useRouter } from 'next/navigation';

const STORED_AGE_KEY = "patient_age";
const STORED_SEX_KEY = "patient_sex";

export default function Home() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");

  // load stored age and sex on first render
  // useEffect(() => {
  //   const storedAge = localStorage.getItem(STORED_AGE_KEY);
  //   if (storedAge) setAge(storedAge);
  //   const storedSex = localStorage.getItem(STORED_SEX_KEY);
  //   if (storedSex) setSex(storedSex);
  // }, [] );

  function handleNext(e: React.FormEvent){
    e.preventDefault();
    if (age !== "" && sex !== "") {
      window.localStorage.setItem(STORED_AGE_KEY, age);  
      window.localStorage.setItem(STORED_SEX_KEY, sex);
      router.push('/diagnosis');
    }
  }
 
  return (
    <div className="flex flex-col bg-white h-screen">
      <form onSubmit={handleNext} className="flex flex-col h-4/5">
        <main className="flex-1 flex flex-col p-8 w-full max-w-md mx-auto">

          <label className="block text-black">
            <div className="block mb-1 font-bold">Patient Age</div>
            <input 
              className="border rounded px-3 py-2 w-full text-black"
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 45"
            />
          </label>

          <div className="text-black mt-4">
            <div className="block mb-1 pt-4 font-bold">Patient Sex</div>
            <div className="flex gap-4 pt-2 justify-start">
              <label className="flex items-center gap-2">
                <input 
                  type="radio"
                  name="sex"
                  value="Male"
                  className="accent-black w-4 h-4"
                  checked={sex==="Male"}
                  onChange={() => setSex("Male")}
                />
                <div>Male</div>
              </label>

              <label className="flex items-center gap-2 accent-black">
                <input 
                  type="radio"
                  name="sex"
                  value="Female"
                  className="accent-black w-4 h-4"
                  checked={sex==="Female"}
                  onChange={() => setSex("Female")}
                />
                <div>Female</div>
              </label>
            </div>
          </div>
          
        </main>
        <footer>
          <div className="w-full max-w-md mx-auto p-8 flex justify-center">
            <button type="submit" 
              className={`w-1/2 px-4 py-3 rounded 
                ${age !== "" && sex !== "" ? "opacity-100" : "opacity-25"} bg-gray-300 text-black font-semibold`}
              onClick={handleNext}>
              Next
              
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
