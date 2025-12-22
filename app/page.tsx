'use client';
import { useState, useEffect, useRef} from 'react';
import { usePatient } from '@/app/contexts/patient';
import DemographicsSummary from '@/app/components/demographics-summary';
import { useRouter } from 'next/navigation';
import FormField from '@/app/components/form-field';
import MenuIcon from '@/app/components/menu-icon'
import ResetButton from '@/app/components/reset-button';

const sexOptions = ['Male', 'Female', 'Other'];
const ageOptions : string[] = ["0-4","5-9","10-14","15-19","20-24","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65-69","70-74","75-79","80-84","85-89","90-94","95+"]
const mraDiagnoses : string[] = ["Angioma", "Benign keratosis (solar lentigo/SK/LPLK)", "Dermatofibroma", "Nevus",  "BCC",  "SCC",  "Melanoma", "Other"];
const raceOptions : string[] = ["White", "Hispanic/Latino/Spanish Origin of any race", "Black or African American", "Asian", "American Indian or Alaskan Native", "Native Hawaiian or Other Pacific Islander", "Two or more races"];
const anatomicSites : string[] = ["Head/Neck", "Upper Extremity", "Lower Extremity", "Anterior Torso", "Lateral Torso", "Posterior Torso", "Palms/Soles"];
const FIRST_VISIT_KEY = "hasSeenMenu";

export default function Home() {
    const router = useRouter();
    const {
        updatePatient,
        age,
        sex,
        monkSkinTone,
        fitzpatrick,
        ita,
        race,
        newPatient,
        biopsy,
        mrn,
        lesionID,
        clinicalDiagnosis,
        anatomicSite,
    } = usePatient();

    const [hasMounted, setHasMounted] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [showDemographics, setShowDemographics] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mraStudy, setMraStudy] = useState(true);
    const [showRequired, setShowRequired] = useState(false);
    const [showReset, setShowReset] = useState(false);

    useEffect(() => {
        setHasMounted(true);

        const showDemographicsCached = localStorage.getItem('showDemographics');
        if (showDemographicsCached !== null) {
            setShowDemographics(JSON.parse(showDemographicsCached));
        }
        const mraStudyCached = localStorage.getItem('mraStudy');
        if (mraStudyCached !== null) {
            setMraStudy(JSON.parse(mraStudyCached));
        }

        const showResetCached = localStorage.getItem('showReset');
        if (showResetCached !== null) {
            setShowReset(JSON.parse(showResetCached));
        }

        const hasSeen = localStorage.getItem(FIRST_VISIT_KEY);

        if (!hasSeen) {
            // first ever mount in this browser
            setMenuOpen(true);
            localStorage.setItem(FIRST_VISIT_KEY, "true");
        } else {
            // not first visit -> keep closed
            setMenuOpen(false);
        }
    }, []);



  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-900">
        <div className="relative flex flex-row">
            <MenuIcon
                menuOpen={menuOpen}
                onClick={() => {
                    setMenuOpen(prev => {
                    const next = !prev;
                    localStorage.setItem("showMenuOpen", JSON.stringify(next));
                    return next;
                    });
                }}
                />

            {/* Title */}
            <div className="max-w-5xl mx-auto mb-8 absolute inset-3 pointer-events-none">
                <h1 className="text-2xl font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">Selfie App</h1>
                <h2 className="text-xs text-white text-center">Streamlined lesion photography</h2>
            </div>
        </div>
        
        {/* Expand Summary Button */}
        <div className="flex mt-7 mb-5">
            {!showDemographics && (
                <button
                    onClick={() => {
                        setShowDemographics(true);
                        localStorage.setItem('showDemographics', JSON.stringify(true));
                    }}
                    className="bg-white shadow-lg rounded-lg px-2 py-2 transition-colors duration-200 flex items-center gap-2 w-full"
                    >
                    {!showDemographics && (<DemographicsSummary concise={mraStudy}/>)}
                </button>
            )}
        </div>

        {/* Form Grid */}
        <div className="max-w-xl mx-auto grid grid-cols-1 gap-5 pl-10 pr-10">
            {showDemographics && (
            <div className="grid grid-cols-1 gap-5">

                {showReset && (<ResetButton />)}

                <FormField label="Age" requiredFlag={showRequired && age == ""}
                    children={
                        <select
                            value={age ?? ''}
                            onChange={(e) => updatePatient({ age: e.target.value, lesionCounter: 1})}
                            className={"w-full px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer " + (showRequired && age == "" ? "border-red-500" : "border-gray-200")}
                        >
                        <option value="">Select age range...</option>
                        {ageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                        ))}
                        </select>
                    }
                ></FormField>

                <FormField label="Sex" requiredFlag={showRequired && sex == ""}
                    children={
                        <div className="flex flex-row gap-4">
                          {sexOptions.map((option) => (
                              <label className="flex flex-row items-center gap-2 text-black" key={option}>
                                  <input 
                                      type="radio"
                                      name="sex"
                                      value={option}
                                      className="w-4 h-4 accent-gray-500"
                                      checked={sex === option}
                                      onChange={(e) => updatePatient({ sex: e.target.value, lesionCounter: 1 })}
                                  />
                                  <div>{option}</div>
                              </label>
                          ))}
                      </div>
                    }
                ></FormField>

                {(!mraStudy || (mraStudy && !newPatient) ) && (<FormField label="MRN" requiredFlag={false}
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mrn ?? ''}
                          onChange={(e) => updatePatient({ mrn: e.target.value, lesionCounter: 1 })}
                          placeholder="Enter patient MRN"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                      />
                        }
                ></FormField>)}

                <FormField label="Monk Skin Tone" requiredFlag={false}
                    children={
                        <select
                          value={monkSkinTone ?? ''}
                          onChange={(e) => updatePatient({ monkSkinTone: e.target.value, lesionCounter: 1 })}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select type...</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((type) => (
                        <option key={type} value={type}>Type {type}</option>
                        ))}
                        </select>
                    }
                ></FormField>

                {!mraStudy && (<FormField label="Fitzpatrick Skin Type" requiredFlag={false}
                    children={
                        <select
                          value={fitzpatrick ?? ''}
                          onChange={(e) => updatePatient({ fitzpatrick: e.target.value, lesionCounter: 1 })}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select type...</option>
                        {["I", "II", "III", "IV", "V", "VI"].map((type) => (
                        <option key={type} value={type}>Type {type}</option>
                        ))}
                        </select>
                        }
                ></FormField>)}

                {!mraStudy && (<FormField label="ITA Scale" requiredFlag={false}
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={ita ?? ''}
                          onChange={(e) => updatePatient({ ita: e.target.value, lesionCounter: 1 })}
                          placeholder="Enter ITA value"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                        />
                        }
                ></FormField>)}

                {!mraStudy && (<FormField label="Self-reported Race" requiredFlag={false}
                    children={
                        <select
                          value={race ?? ''}
                          onChange={(e) => updatePatient({ race: e.target.value, lesionCounter: 1 })}
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer"
                        >
                        <option value="">Select self-reported race...</option>
                        {raceOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                        </select>
                    }
                ></FormField>)}
            </div>
            )}

            <FormField label="Clinical Diagnosis" requiredFlag={showRequired && clinicalDiagnosis==""}
                children={
                    <select
                        value={clinicalDiagnosis ?? ''}
                        onChange={(e) => updatePatient({ clinicalDiagnosis: e.target.value })}
                        className={"w-full px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer " + (showRequired && clinicalDiagnosis=="" ? "border-red-500" : "border-gray-200")}
                    >
                    <option value="">Select diagnosis...</option>
                    {mraDiagnoses.map((type) => (
                    <option key={type} value={type}>{type}</option>
                    ))}
                    </select>
                }
            ></FormField>

            <FormField label="Anatomic Site" requiredFlag={showRequired && anatomicSite == ""}
                children={
                    <select
                        value={anatomicSite ?? ''}
                        onChange={(e) => updatePatient({ anatomicSite: e.target.value })}
                        className={"w-full px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer " + (showRequired && anatomicSite == "" ? "border-red-500" : "border-gray-200")}
                    >
                    <option value="">Select anatomic site...</option>
                    {anatomicSites.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                    </select>
                    }
            ></FormField>

            <FormField label="Lesion ID" requiredFlag={showRequired && lesionID == ""}
                children={
                    <div>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={lesionID ?? ''}
                            onChange={(e) => updatePatient({ lesionID: e.target.value })}
                            placeholder="Enter patient lesion ID"
                            className={"w-full px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer " + (showRequired && lesionID == "" ? "border-red-500" : "border-gray-200")}
                        />
                        
                        {mraStudy && (<label className="flex flex-row items-center gap-2 text-black mt-4" key="biopsy">
                            <input 
                                type="checkbox"
                                name="biopsy"
                                value="Biopsy"
                                className="accent-gray-500 w-4 h-4"
                                checked={biopsy === true}
                                onChange={() => {updatePatient({ biopsy: !biopsy })}}
                            />
                            <div>Biopsy</div>
                        </label>)}
                    </div>
                }
            ></FormField>

            {mraStudy && biopsy && newPatient && (<FormField label="MRN" requiredFlag={false}
                    children={
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mrn ?? ''}
                          onChange={(e) => updatePatient({ mrn : e.target.value })}
                          placeholder="Enter patient MRN"
                          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                      />
                        }
            ></FormField>)}

            
          {/* Take Photos Button */}
          <div className="flex justify-center w-full mt-5 mb-10">
              <div className="w-1/2 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center">
                  <button
                    type="button"
                    className="block text-sm font-semibold text-white uppercase tracking-wide"
                    onClick={() => {
                        if(age && sex && clinicalDiagnosis && anatomicSite){
                            setShowDemographics(false);
                            localStorage.setItem('showDemographics', JSON.stringify(false));
                            setShowRequired(false);
                            updatePatient({ newPatient: false })
                            router.push('capture');
                        } else {
                            setShowRequired(true);
                        }
                    }}
                  >Take Photos</button>
              </div>
          </div>
          
          {/* Sidebar overlay */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => {
                    setMenuOpen(false);
                    localStorage.setItem("showMenuOpen", JSON.stringify(false));
                }}
                aria-label="Close sidebar overlay"
              />
              <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-gray-200 to-gray-500 shadow-lg z-50 flex flex-col p-6 transition-transform duration-300">
                <nav className="flex flex-col gap-4 items-start">
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMraStudy(true);
                                localStorage.setItem('mraStudy', JSON.stringify(true));
                                setMenuOpen(false);
                                localStorage.setItem("showMenuOpen", JSON.stringify(false));
                            }}
                        >MRA Study
                        </button>
                    </div>
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMraStudy(false);
                                localStorage.setItem('mraStudy', JSON.stringify(false));
                                setMenuOpen(false);
                                localStorage.setItem("showMenuOpen", JSON.stringify(false));
                            }}
                        >Marghoob
                        </button>
                    </div>
                    {/* <div>Export Data</div> */}
                </nav>
              </aside>
            </>
          )}
      </div>
  </div>
);
}