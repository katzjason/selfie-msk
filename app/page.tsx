"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatient } from '@/app/contexts/patient';
import FitzpatrickCarousel from '@/app/components/fitzpatrick-carousel';
import FooterButtons from '@/app/components/footer-buttons';
import Details from '@/app/components/details';


export default function Home() {
  const {
    age,
    setAge,
    sex,
    setSex,
  } = usePatient();

  const router = useRouter();

  const sexOptions : string[] = ["Male", "Female"];

  useEffect(() => { // load stored  age and sex on first render
    setAge(localStorage.getItem("age") || "");
    setSex(localStorage.getItem("sex") || "");
  }, [] );

  function handleNext(e: React.FormEvent){
    e.preventDefault();
    if (age !== "" && sex !== "") {
      window.localStorage.setItem("age", age);  // updating browser storage for persistance across sessions
      window.localStorage.setItem("sex", sex);
      router.push('/diagnosis');
    }
  }
 
  return (
    <div className="flex flex-col bg-white h-screen">
      <Details />
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

              {sexOptions.map((option) => (
                <label className="flex items-center gap-2" key={option}>
                <input 
                  type="radio"
                  name="sex"
                  value={option}
                  className="accent-black w-4 h-4"
                  checked={sex===option}
                  onChange={() => setSex(option)}
                />
                <div>{option}</div>
              </label>
              ))}
            </div>
          </div>

          <div className="text-black mt-4">
            <div className="block mb-1 pt-4 font-bold">Fitzpatrick Scale</div>
            <div className="flex gap-4 pt-2 justify-start">
              <FitzpatrickCarousel />
            </div>
          </div>
          
          
        </main>
        <FooterButtons activateNext={age !== "" && sex !== ""} showBack={false} showNext={true}handleNext={handleNext} handleBack={() => {}} />        
      </form>
    </div>
  );
}
