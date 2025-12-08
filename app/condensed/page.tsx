'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Image, groupImages } from "@/app/capture/image-helpers";
import Gallery from "@/app/capture/gallery";
import { ChevronDown, ChevronUp } from 'lucide-react';
import ImageGroup from '../capture/image-group';

interface PatientData {
    age: number | null;
    sex: 'male' | 'female' | 'other' | null;
    monkSkinTone: number | null;
    diagnosis: 'biopsy' | 'benign' | null;
    mrn: number | null;
    lesionID: number | null;
    clinicalDiagnosis: 'benign' | 'malignant' | null;
    anatomicSite: string | null;
}

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


export default function Condensed() {   
    const [formData, setFormData] = useState<PatientData & { patientId: string }>({
        patientId: typeof window !== 'undefined' ? window.localStorage.getItem("patientId") || '' : '',
        age: typeof window !== 'undefined' && window.localStorage.getItem("age") ? parseInt(window.localStorage.getItem("age") as string) : null,
        sex: typeof window !== 'undefined' && window.localStorage.getItem("sex") ? window.localStorage.getItem("sex") as 'male' | 'female' | 'other' : null,
        monkSkinTone: typeof window !== 'undefined' && window.localStorage.getItem("monkSkinTone") ? parseInt(window.localStorage.getItem("monkSkinTone") as string) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 : null,
        diagnosis: typeof window !== 'undefined' && window.localStorage.getItem("diagnosis") ? window.localStorage.getItem("diagnosis") as 'biopsy' | 'benign' : null,
        mrn: typeof window !== 'undefined' && window.localStorage.getItem("mrn") ? parseInt(window.localStorage.getItem("mrn") as string) : null,
        lesionID: typeof window !== 'undefined' && window.localStorage.getItem("lesionID") ? parseInt(window.localStorage.getItem("lesionID") as string) : null,
        clinicalDiagnosis: typeof window !== 'undefined' && window.localStorage.getItem("clinicalDiagnosis") ? window.localStorage.getItem("clinicalDiagnosis") as 'benign' | 'malignant' : null,
        anatomicSite: typeof window !== 'undefined' && window.localStorage.getItem("anatomicSite") ? window.localStorage.getItem("anatomicSite") as 'head' | 'trunk' | 'upper' | 'lower' | 'hand' | 'foot' : null,
    });
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
                mrn: formData.mrn ? formData.mrn.toString() : undefined,
                anatomicSite: formData.anatomicSite ? formData.anatomicSite : '',
                lesionID: formData.lesionID ? formData.lesionID.toString() : undefined
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
            <div className="flex justify-center mb-5">
                <button
                onClick={() => setShowDemographics(true)}
                className="bg-white shadow-lg rounded-b-lg px-6 py-2 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                aria-label={showDemographics ? 'Collapse section' : 'Expand section'}
                >
                {!showDemographics && (
                    <div className="flex flex-col text-black">
                        <div className="flex flex-row items-center gap-2 w-full justify-center">
                           <div>Age: {formData.age}</div>
                            <div>Sex: {formData.sex}</div>
                        </div>
                        <div className="flex flex-row items-center gap-2 w-full justify-center">
                            <div>Monk: {formData.monkSkinTone}</div>
                            <div>MRN: {formData.mrn}</div>
                        </div>
                        
                        <div className="flex flex-row">
                            <>
                            <ChevronDown className="w-5 h-5 text-black" />
                            <span className="text-sm text-black font-medium">Edit Demographics</span>
                            </>
                        </div>
                    </div>
                    
                )}
                </button>
            </div>

            {/* Form Grid */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {showDemographics && (
                <div className="grid grid-cols-1 gap-5">
                    {/* Patient Age */}
                    <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Age</label>
                        <input
                            type="number"
                            value={Number.isNaN(formData.age) ? '' : formData.age ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '')  {
                                    setFormData({ ...formData, age: null });
                                    return;
                                }
                                
                                const num = Number(val);
                                if (!Number.isNaN(num)) {
                                    setFormData({ ...formData, age: num });
                                }
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
                                        checked={formData.sex == option}
                                        onChange={(e) => setFormData({ ...formData, sex: e.target.value ? e.target.value as 'male' | 'female' | 'other' : null })}
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
                            value={formData.monkSkinTone ?? ''}
                            onChange={(e) => setFormData({ ...formData, monkSkinTone: e.target.value ? parseInt(e.target.value) : null })}
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
                            type="number"
                            value={formData.mrn !== null ? formData.mrn : ''}
                            onChange={(e) => setFormData({ ...formData, mrn: e.target.value ? parseInt(e.target.value) : null })}
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
                    checked={formData.diagnosis===option}
                    onChange={() => setFormData({ ...formData, diagnosis: option as 'biopsy' | 'benign' })}
                    />
                    <div>{option}</div>
                    </label>
                    ))}
                </div>
            </div>

            {/* Conditional Fields for Biopsy Diagnosis */}
            {hasMounted && formData.diagnosis?.toLowerCase() === "biopsy" && (
            <div className="gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Lesion ID</label>
                    <input
                        type="number"
                        value={formData.lesionID !== null ? formData.lesionID : ''}
                        onChange={(e) => setFormData({ ...formData, lesionID: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Enter patient lesion ID"
                        className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                    />
                </div>

                {/* <div className="bg-white rounded-xl mt-5 p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Clinical Diagnosis</label>
                    <input
                        type="text"
                        value={formData.clinicalDiagnosis !== null ? formData.clinicalDiagnosis : ''}
                        onChange={(e) => setFormData({ ...formData, clinicalDiagnosis: 'benign' })} // FIX ME
                        placeholder="Enter clinical diagnosis"
                        className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-black focus:outline-none focus:border-gray-500 transition-all"
                    />
                </div> */}
            </div>
            )}

            <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Anatomic Site</label>

                    <select
                        value={formData.anatomicSite ?? ''}
                        onChange={(e) => setFormData({ ...formData, anatomicSite: e.target.value ? e.target.value : null })}
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
                       // multiple
                        onChange={handleCaptureInput}
                        style={{ display: "none" }}
                    />
                </div>
            </div>
            {/* <Gallery images={images} /> */}

            {imageGroups.map( (group) => (
                <ImageGroup key={group.id} images={group.images} mrn={group.mrn} anatomicSite={group.anatomicSite} lesionID={group.lesionID} />

            ))}
            {/* <ImageGroup images={images} /> */}
        </div>
    </div>
  );
}


// {sexOptions.map((option) => (
//                                 <label className="flex flex-row items-center gap-2 text-black" key={option}>
//                                     <input 
//                                         type="radio"
//                                         name="sex"
//                                         value={option}
//                                         className="accent-gray-500 w-4 h-4"
//                                         checked={formData.sex == option}
//                                         onChange={(e) => setFormData({ ...formData, sex: e.target.value ? e.target.value as 'male' | 'female' | 'other' : null })}
//                                     />
//                                     <div>{option}</div>
//                                 </label>
//                             ))}