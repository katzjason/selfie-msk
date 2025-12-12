'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePatient } from '@/app/contexts/patient';
import { Image, groupImages } from "@/app/capture/image-helpers";
import { ChevronDown, ChevronUp } from 'lucide-react';
import ImageGroup from './capture/image-group';
import DemographicsSummary from '@/app/components/demographics-summary';
import { useRouter } from 'next/navigation';
import FormField from '@/app/components/form-field';

// All patient data now comes from context

const sexOptions = ['Male', 'Female', 'Other'];
const diagnosisOptions : string[] = ["Benign", "Biopsy"];
const clinicalDiagnosisOptions : string[] = ["Benign", "Malignant"];
const ageOptions : string[] = ["0-4","5-9","10-14","15-19","20-24","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65-69","70-74","75-79","80-84","85-89","90-94","95+"]
const mraDiagnoses : string[] = ["Melanoma", "Melanocytic nevus", "Basal cell carcinoma", "Actinic keratosis", "Benign keratosis (solar lentigo / seborrheic keratosis / lichen planus-like keratosis)",
    "Dermatofibroma", "Vascular lesion", "Squamous cell carcinoma", "Other"];
const raceOptions : string[] = ["American Indian or Alaska Native", "Asian", "Black or African American", "Native Hawaiian or Other Pacific Islander", "White", "Two or More Races", "Other", "Prefer not to answer"];
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

export default function Home() {
  const router = useRouter();
  const {
    name, setName,
    dob, setDob,
    age, setAge,
    sex, setSex,
    fitzpatrick, setFitzpatrick,
    race, setRace,
    ita, setIta,
    monkSkinTone, setMonkSkinTone,
    diagnosis, setDiagnosis,
    mrn, setMrn,
    lesionID, setLesionID,
    clinicalDiagnosis, setClinicalDiagnosis,
    anatomicSite, setAnatomicSite
  } = usePatient();

  const [hasMounted, setHasMounted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showDemographics, setShowDemographics] = useState(true);
  //const imageGroups = useMemo( () => groupImages(images), [images]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mraStudy, setMraStudy] = useState(true);


  useEffect(() => { setHasMounted(true); }, []);

  const handleCaptureButton = () => {
      inputRef.current?.click();
      setShowDemographics(false);
  };

  const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);

    //   setImages((prev) => [
    //   ...prev,
    //       {   id: (`${Date.now()}-${Math.random()}`), 
    //           url: url,
    //           captureTime: new Date().toISOString(),
    //           mrn: mrn ? mrn.toString() : undefined,
    //           anatomicSite: anatomicSite ? anatomicSite : '',
    //           lesionID: lesionID ? lesionID.toString() : undefined
    //       }
    //   ]);
  };


  const AddPhotoToGroup = (groupId: string) => {
      handleCaptureButton();
      handleCaptureInput;
  }

    useEffect(() => {
    const imgs = JSON.parse(localStorage.getItem('capturedImages') || '[]');
    setImages(imgs);
    }, []);


  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-900">

        <div className="relative flex flex-row">
            <button className="relative group flex"
                onClick={() => setMenuOpen((prev) => !prev)}
            >
                <div className="relative flex overflow-hidden items-center justify-center rounded-full w-[72px] h-[72px]">
                    <div className="flex flex-col justify-between w-[32px] h-[28px] relative">
                        {/* Hamburger lines */}
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

                        {/* X icon */}
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

            {/* Title */}
            <div className="max-w-5xl mx-auto mb-8 absolute inset-3 pointer-events-none">
                <h1 className="text-2xl font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">Selfie App</h1>
                <h2 className="text-xs text-white text-center">Streamlined lesion photography</h2>
            </div>

        </div>
        

          {/* Toggle Button */}
          <div className="flex mb-5">
              {!showDemographics && (
                  <button
                      onClick={() => setShowDemographics(true)}
                      className="bg-white shadow-lg rounded-lg px-2 py-2 transition-colors duration-200 flex items-center gap-2 w-full"
                      //aria-label={showDemographics ? 'Collapse section' : 'Expand section'}
                      >
                      {!showDemographics && (
                          <DemographicsSummary />
                      )}
                      </button>
              )}
          </div>

        {/* Form Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pl-10 pr-10">
            {showDemographics && (
            <div className="grid grid-cols-1 gap-5">

                {!mraStudy && (<FormField label="Patient Name"
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={name ?? ''}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter patient name"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                      />
                    }
                ></FormField>)}

                {!mraStudy && (<FormField label="Date of Birth"
                    children={
                        <input
                          type="date"
                          inputMode="numeric"
                          value={dob ?? ''}
                          onChange={(e) => setDob(e.target.value)}
                          placeholder="Enter date of birth"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                      />
                    }
                ></FormField>)}

                {mraStudy && (<FormField label="Age"
                    children={
                        <select
                            value={age ?? ''}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select age range...</option>
                        {ageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                        ))}
                        </select>
                    }
                ></FormField>)}
                    {/* <input
                        type="text"
                        inputMode="numeric"
                        value={age ?? ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '')  {
                                setAge("");
                                return;
                            }
                            setAge(val);
                        }}
                        placeholder="Enter patient age"
                        className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                    /> */}
                {/* </div> */}

                <FormField label="Sex"
                    children={
                        <div className="flex flex-row gap-4">
                          {sexOptions.map((option) => (
                              <label className="flex flex-row items-center gap-2 text-black" key={option}>
                                  <input 
                                      type="radio"
                                      name="sex"
                                      value={option}
                                      className="accent-gray-500 w-4 h-4"
                                      checked={sex === option}
                                      onChange={() => setSex(option)}
                                  />
                                  <div>{option}</div>
                              </label>
                          ))}
                      </div>
                    }
                ></FormField>

                {!mraStudy && (<FormField label="Fitzpatrick Skin Type"
                    children={
                        <select
                          value={fitzpatrick ?? ''}
                          onChange={(e) => setFitzpatrick(e.target.value)}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select type...</option>
                        {["I", "II", "III", "IV", "V", "VI"].map((type) => (
                        <option key={type} value={type}>Type {type}</option>
                        ))}
                        </select>
                        }
                ></FormField>)}

                {!mraStudy && (<FormField label="ITA Scale"
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ita ?? ''}
                          onChange={(e) => setIta(e.target.value)}
                          placeholder="Enter ITA value"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                        />
                        }
                ></FormField>)}

                <FormField label="Monk Skin Tone"
                    children={
                        <select
                          value={monkSkinTone ?? ''}
                          onChange={(e) => setMonkSkinTone(e.target.value)}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select type...</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((type) => (
                        <option key={type} value={type}>
                            Type {type}
                        </option>
                        ))}
                        </select>
                    }
                ></FormField>

                {true && (<FormField label="MRN"
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mrn ?? ''}
                          onChange={(e) => setMrn(e.target.value)}
                          placeholder="Enter patient MRN"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                      />
                        }
                ></FormField>)}
            </div>
            )}

            {!mraStudy && (<FormField label="Self-reported Race"
                    children={
                        <select
                          value={race ?? ''}
                          onChange={(e) => setRace(e.target.value)}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select self-reported race...</option>
                        {raceOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                        </select>
                    }
                ></FormField>)}

            {mraStudy && (<FormField label="Clinical Diagnosis"
                children={
                    <select
                        value={clinicalDiagnosis ?? ''}
                        onChange={(e) => setClinicalDiagnosis(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                    >
                    <option value="">Select diagnosis...</option>
                    {mraDiagnoses.map((type) => (
                    <option key={type} value={type}>{type}</option>
                    ))}
                    </select>
                }
            ></FormField>)}

            {/* Conditional Fields for Biopsy Diagnosis */}
            {/* {hasMounted && diagnosis?.toLowerCase() === "biopsy" &&  */}
            {true && (<FormField label="Lesion ID"
                    children={
                        <input
                            type="text"
                            inputMode="numeric"
                            value={lesionID ?? ''}
                            onChange={(e) => setLesionID(e.target.value)}
                            placeholder="Enter patient lesion ID"
                            className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                        />
                    }
                ></FormField>)
            }

            <FormField label="Anatomic Site"
                children={
                    <select
                        value={anatomicSite ?? ''}
                        onChange={(e) => setAnatomicSite(e.target.value)}
                        className="w-full text-black px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                    >
                    {anatomicSites.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                    </select>
                    }
            ></FormField>

            {images.map((url, idx) => <img key={idx} src={url} alt={`Captured ${idx}`} />)}

          {/* Take Photos Button */}
          <div className="flex justify-center w-full mt-5">
              <div className="w-1/2 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center">
                  <button
                    type="button"
                    className="block text-sm font-semibold text-white uppercase tracking-wide"
                    onClick={() =>router.push('capture')}
                  >Take Photos</button>
                  {/* <button
                      type="button"   
                      className="block text-sm font-semibold text-white uppercase tracking-wide"
                      onClick={handleCaptureButton}
                  >
                  Take Photos
                  </button>
                  <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      capture="environment" // rear camera on most phones
                      onChange={handleCaptureInput}
                      style={{ display: "none" }}
                  /> */}
              </div>
          </div>
          {/* {imageGroups.map( (group) => (
              <ImageGroup key={group.id} images={group.images} mrn={group.mrn} anatomicSite={group.anatomicSite} lesionID={group.lesionID} onAddPhoto={() => AddPhotoToGroup(group.id)} />

          ))} */}
          
          {/* Sidebar overlay */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setMenuOpen(false)}
                aria-label="Close sidebar overlay"
              />
              <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-gray-200 to-gray-500 shadow-lg z-50 flex flex-col p-6 transition-transform duration-300">
                <nav className="flex flex-col gap-4 items-start">
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMraStudy(true);
                                setMenuOpen(false);
                            }}
                        >MRA Study
                        </button>
                    </div>
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMraStudy(false);
                                setMenuOpen(false);
                            }}
                        >Marghoob
                        </button>
                    </div>
                </nav>
              </aside>
            </>
          )}
      </div>
  </div>
);
}