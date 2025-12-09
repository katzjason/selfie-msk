'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePatient } from '@/app/contexts/patient';
import { Image, groupImages } from "@/app/capture/image-helpers";
import Gallery from "@/app/capture/gallery";
import { ChevronDown, ChevronUp } from 'lucide-react';
import ImageGroup from '../capture/image-group';
import DemographicsSummary from '@/app/components/demographics-summary';

// All patient data now comes from context

const sexOptions = ['Male', 'Female', 'Other'];
const diagnosisOptions : string[] = ["Benign", "Biopsy"];
const clinicalDiagnosisOptions : string[] = ["Benign", "Malignant"];
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

export default function CondensedPage() {
    const {
      age,
      setAge,
      sex,
      setSex,
      monkSkinTone,
      setMonkSkinTone,
      diagnosis,
      setDiagnosis,
      mrn,
      setMrn,
      lesionID,
      setLesionID,
      clinicalDiagnosis,
      setClinicalDiagnosis,
      anatomicSite,
      setAnatomicSite
    } = usePatient();
    const [hasMounted, setHasMounted] = useState(false);
    const [images, setImages] = useState<Image[]>([]);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [showDemographics, setShowDemographics] = useState(true);
    const imageGroups = useMemo( () => groupImages(images), [images]);


    useEffect(() => { setHasMounted(true); }, []);

    const handleCaptureButton = () => {
        inputRef.current?.click();
        setShowDemographics(false);
    };

    const handleCaptureInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);

        setImages((prev) => [
        ...prev,
            {   id: (`${Date.now()}-${Math.random()}`), 
                url: url,
                captureTime: new Date().toISOString(),
                mrn: mrn ? mrn.toString() : undefined,
                anatomicSite: anatomicSite ? anatomicSite : '',
                lesionID: lesionID ? lesionID.toString() : undefined
            }
        ]);
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-900 p-10">
            {/* Title */}
            <div className="max-w-5xl mx-auto mb-8">
                <h1 className="text-2xl font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">Selfie App</h1>
                <h2 className="text-xs text-white text-center">Streamlined lesion photography <br></br> for the MRA study</h2>
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
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {showDemographics && (
                <div className="grid grid-cols-1 gap-5">
                    {/* Patient Age */}
                    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Age</label>
                        <input
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
                        />
                    </div>

                    {/* Patient Sex */}
                    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Sex</label>
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
                    </div>

                    {/* Monk Skin Type */}
                    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monk Skin Tone</label>
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
                    </div>
                
                    {/* Patient MRN */}
                    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">MRN</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={mrn ?? ''}
                            onChange={(e) => setMrn(e.target.value)}
                            placeholder="Enter patient MRN"
                            className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Diagnosis */}
            <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Diagnosis</label>
                <div className="flex gap-4 mt-2">
                    {diagnosisOptions.map(option => (
                    <label key={option} className="flex items-center gap-2 text-black">
                    <input 
                        type="radio"
                        name="diagnosis"
                        value={option}
                    className="accent-gray-500 w-4 h-4"
                    checked={diagnosis === option}
                    onChange={() => setDiagnosis(option)}
                    />
                    <div>{option}</div>
                    </label>
                    ))}
                </div>
            </div>

            {/* Conditional Fields for Biopsy Diagnosis */}
            {hasMounted && diagnosis?.toLowerCase() === "biopsy" && (
            <div className="gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Lesion ID</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={lesionID ?? ''}
                        onChange={(e) => setLesionID(e.target.value)}
                        placeholder="Enter patient lesion ID"
                        className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                    />
                </div>
            </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Anatomic Site</label>

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
                </div>

            {/* Take Photos Button */}
            <div className="flex justify-center w-full mt-5">
                <div className="w-1/2 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col items-center">
                    <button
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
                    />
                </div>
            </div>
            {imageGroups.map( (group) => (
                <ImageGroup key={group.id} images={group.images} mrn={group.mrn} anatomicSite={group.anatomicSite} lesionID={group.lesionID} />

            ))}
        </div>
    </div>
  );
}