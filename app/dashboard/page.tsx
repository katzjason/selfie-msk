"use client";

import { useEffect, useState, useRef } from "react";
import MenuIcon from '@/app/components/menu-icon';
import { FeedbackProvider, usefeedback } from '@/app/components/feedback-provider';
import EnlargedImage from '@/app/components/enlarged-image';
import { useRouter } from 'next/navigation';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
    
type Row = {
    age_range: string;
    anatomic_site: string;
    clinical_diagnosis: string;
    image_types: string;
    patient_id: string;
    sex: string;
    filepaths: string;
    lesion_id: number;
    captured_at: string;
}

type imageMetadata = {
    id: number;
    image_type: string;
    file: string;
    poor_quality: boolean;
    contains_phi: boolean;
}

const anatomicSites : string[] = ["Head/Neck", "Upper Extremity", "Lower Extremity", "Anterior Torso", "Lateral Torso", "Posterior Torso", "Palms/Soles"];
const diagnoses : string[] = ["Angioma", "Solar Lentigo", "SK","LPLK", "Dermatofibroma", "Nevus", "BCC",  "SCC",  "Melanoma", "Other"];


const makeDatePretty = (isoDate: string) => {
    const date = new Date(isoDate);
    const datePart = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'EST',
        timeZoneName: 'short'
        })
    return datePart.toString();
}

const image_type_indices : Record<string, number> = {
    "close-up" : 0,
    "non-polarized-cone": 1,
    "polarized-contact": 2,
    "non-polarized-contact": 3,
    "non-polarized-liquid-contact":4
}

const reverse_image_type_indices : Record<number, string> = {
    0: "close-up",
    1: "non-polarized-cone",
    2: "polarized-contact",
    3: "non-polarized-contact",
    4: "non-polarized-liquid-contact"
}

function DashboardContent() {
    const router = useRouter();
    const { openFeedback } = usefeedback();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Row[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const processedData = useRef<Record<number, imageMetadata[]>>([]);
    // Initialize from localStorage if available
    const [anatomicSite, setAnatomicSite] = useState<string>(() => (typeof window !== 'undefined' && localStorage.getItem("anatomicSite")) || "");
    const [diagnosis, setDiagnosis] = useState<string>(() => (typeof window !== 'undefined' && localStorage.getItem("diagnosis")) || "");
    const [size, setSize] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem("size");
            return stored ? Number(stored) : 10;
        }
        return 10;
    });
    const [dbSize, setDbSize] = useState<number>(0);
    const [enlargedImage, setEnlargedImage] = useState<string>("");
    const [enlargedImageType, setEnlargedImageType] = useState<string>("");
    const [enlargedImageId, setEnlargedImageId] = useState<number>(0);
    const [enlargedImagePHI, setEnlargedImagePHI] = useState<boolean>(false);
    const [enlargedImageQuality, setEnlargedImageQuality] = useState<boolean>(false);

    // Save to localStorage when fields change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("anatomicSite", anatomicSite);
        }
    }, [anatomicSite]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("diagnosis", diagnosis);
        }
    }, [diagnosis]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem("size", String(size));
        }
    }, [size]);

    useEffect(() => {
        const getSize = async () => {
            const rawSize = await fetch("/api/db/size");
            const sizeJson = await rawSize.json();
            setDbSize(Number(sizeJson.size.rows[0].count));
        };
        getSize();
    }, []);

    useEffect(() => {
        if (enlargedImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
        }, [enlargedImage]);

    // Function to refetch data
    const refetchData = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (anatomicSite) params.append("anatomicSite", anatomicSite);
        if (diagnosis) params.append("diagnosis", diagnosis);
        if (size) params.append("last", size.toString());
        const res = await fetch("/api/db?" + params.toString());
        const json = await res.json();
        setData(json.data);

        // Preprocess queried data
        for (let i = 0; i < json.data.length; i++){
            const lesion_id : number = json.data[i].lesion_id;
            const filepaths : string[] = json.data[i].filepaths.split(", ");
            const image_types : string[] = json.data[i].image_types.split(", ");
            const image_ids : string[] = json.data[i].image_ids.split(", ");
            const image_poor_qualities : boolean[] = json.data[i].image_poor_qualities.split(", ").map((s: string) => s === "true");
            const image_contains_phi : boolean[] = json.data[i].image_contains_phi.split(", ").map((s: string) => s === "true");
            let metadata = new Array(5)

            for (let j = 0; j < filepaths.length; j++){
                const idx : number | undefined = image_type_indices[image_types[j]];
                if (typeof idx !== "undefined") {
                    metadata[idx] = { 
                        id: parseInt(image_ids[j], 10),
                        image_type: image_types[j], 
                        file: filepaths[j],
                        poor_quality: image_poor_qualities[j] || false,
                        contains_phi: image_contains_phi[j] || false
                    };
                }
            }

            // filling in missing data
            for (let k = 0; k < 5; k++){
                if(metadata[k] == undefined){
                    metadata[k] = {
                        id: 0,
                        image_type: reverse_image_type_indices[k], 
                        file: "N/A",
                        poor_quality: false,
                        contains_phi: false
                    }
                }
            }

            processedData.current[lesion_id] = metadata;
        }
        setLoading(false);
    };


    // Query DB whenever any filter changes
    useEffect(() => {
        setLoading(true);
        setData([]); // Hide results for flicker

        const timer = setTimeout(refetchData, 300);
        return () => clearTimeout(timer);
    }, [anatomicSite, diagnosis, size]);

    return (
          <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-900 w-full pb-10">
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
                <div className="max-w-5xl mx-auto absolute inset-3 pointer-events-none">
                    <h1 className="text-2xl font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">Selfie App</h1>
                    <h2 className="text-xs text-white text-center">Streamlined lesion photography</h2>
                </div>
                
            </div>
            <div className="mt-5 text-lg font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent text-center">{dbSize} images collected</div>

            <div className="flex flex-col md:flex-row items-center ml-4 mr-4 md:justify-center gap-2 md:gap-4 mt-2 w-auto">

                {/* Filter by Clinical Diagnosis */}
                <select
                    value={diagnosis ?? ""}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Filter by clinical diagnosis...</option>
                    {diagnoses.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>

                {/* Filter by Anatomic Site */}
                <select
                    value={anatomicSite ?? ""}
                    onChange={(e) => setAnatomicSite(e.target.value)}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Filter by anatomic site...</option>
                    {anatomicSites.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                    ))}
                </select>

                {/* Filter Quantity */}
                <select
                    value={isNaN(size) ? 1 : size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className={"w-[300px] text-gray-600 px-3 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 focus:bg-white transition-all cursor-pointer "}
                >
                    <option value="">Limit the number of results to...</option>
                    {[5, 10, 25, 50, 100].map((option) => (
                    <option key={option} value={option}>
                        {"Most recent " + option}
                    </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col text-black min-h-screen items-center ml-10 mr-10">
                {data.length == 0 && !loading ? 
                    <div className="w-[300px] text-white text-lg font-bold mt-20 uppercase flex flex-col items-center">No Results Found</div> : 
                    <div className="flex flex-col w-full">
                    {loading ? null : data.map((row, i)=>(
                        <div key={i} className="flex flex-col bg-white rounded-xl p-4 shadow-lg text-black mt-10 pt-5 pb-5">
                            <div className="block text-sm text-gray-600 tracking-wide mb-2">
                                <div><span className="font-semibold uppercase ">Age Range: </span> {row.age_range?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Diagnosis: </span> {row.clinical_diagnosis?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Anatomic Site: </span> {row.anatomic_site?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Timestamp: </span>{makeDatePretty(row.captured_at) ?? "N/A"}</div>
                                {/* <div><span className="font-semibold uppercase ">Lesion ID: </span>{row.lesion_id ?? "N/A"}</div> */}
                            </div>
                            <div
                                className="flex flex-row flex-wrap md:flex-nowrap gap-2 md:gap-4 w-full items-stretch md:justify-between justify-center"
                            >
                                {processedData.current[row.lesion_id].map((value, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col items-center flex-1 min-w-[120px] max-w-xs md:max-w-[320px] md:flex-[1_1_260px] w-full"
                                    >
                                        <div className="block text-xs lg:text-base text-gray-600 lowercase tracking-wide mb-1 font-bold text-center break-words w-full max-w-full">{value.image_type}</div>
                                        {value.file == "N/A" ? (
                                            <div className="flex flex-col items-center justify-center bg-gray-200 w-full h-full font-bold rounded-lg text-gray-600">NOT TAKEN</div>
                                        ) : (
                                            <div className="relative">
                                                <div className="absolute top-1 right-1 z-10 flex flex-row gap-1">
                                                    {value.contains_phi && <div className="bg-red-500 text-white px-1 py-1 rounded font-bold text-xs">Contains PHI</div>}
                                                    {value.poor_quality && <div className="bg-orange-500 text-white px-1 py-1 rounded font-bold text-xs">Poor Quality</div>}
                                                </div>
                                                <img
                                                    key={idx}
                                                    className="w-full object-cover rounded-lg max-h-[350px] md:max-h-[420px] hover:cursor-pointer"
                                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/images/${encodeURIComponent(value.file.substring(13))}`}
                                                    alt={value.image_type}
                                                    onClick={() => {
                                                        setEnlargedImage(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/images/${encodeURIComponent(value.file.substring(13))}`);
                                                        setEnlargedImageType(value.image_type);
                                                        setEnlargedImageId(value.id);
                                                        setEnlargedImagePHI(value.contains_phi);
                                                        setEnlargedImageQuality(value.poor_quality);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>}
            </div>

            {enlargedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/90">
                    <div className="flex flex-col items-center gap-4">
                        {/* Controls Row - Toggles and X button */}
                        <div className="flex flex-row items-start gap-4">
                            {/* PHI Toggle */}
                            <div className="bg-white rounded-lg shadow-lg p-2">
                                <div className="text-xs font-semibold text-gray-700 mb-2 text-center">PHI Status</div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={async () => {
                                            setEnlargedImagePHI(false);
                                            let formData = new FormData();
                                            formData.append("image_id", String(enlargedImageId));
                                            formData.append("contains_phi", "false");
                                            await fetch("/api/db/manual_phi", {
                                            method: "POST",
                                            body: formData
                                            });
                                            await refetchData();
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                            !enlargedImagePHI
                                                ? 'bg-green-500 text-white shadow'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        No PHI
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setEnlargedImagePHI(true);
                                            let formData = new FormData();
                                            formData.append("image_id", String(enlargedImageId));
                                            formData.append("contains_phi", "true");
                                            await fetch("/api/db/manual_phi", {
                                            method: "POST",
                                            body: formData
                                            });
                                            await refetchData();
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                            enlargedImagePHI
                                                ? 'bg-red-500 text-white shadow'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        Contains PHI
                                    </button>
                                </div>
                            </div>

                            {/* Quality Toggle */}
                            <div className="bg-white rounded-lg shadow-lg p-2">
                                <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Image Quality</div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={async () => {
                                            setEnlargedImageQuality(false);
                                            let formData = new FormData();
                                            formData.append("image_id", String(enlargedImageId));
                                            formData.append("poor_quality", "false");
                                            await fetch("/api/db/manual_quality", {
                                            method: "POST",
                                            body: formData
                                            });
                                            await refetchData();
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                            !enlargedImageQuality
                                                ? 'bg-green-500 text-white shadow'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        Good Quality
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setEnlargedImageQuality(true);
                                            let formData = new FormData();
                                            formData.append("image_id", String(enlargedImageId));
                                            formData.append("poor_quality", "true");
                                            await fetch("/api/db/manual_quality", {
                                            method: "POST",
                                            body: formData
                                            });
                                            await refetchData();
                                        }}
                                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                                            enlargedImageQuality
                                                ? 'bg-orange-500 text-white shadow'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        Poor Quality
                                    </button>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => {
                                    setEnlargedImage("");
                                    setEnlargedImageType("");
                                    setEnlargedImageId(0);
                                    setEnlargedImagePHI(false);
                                    setEnlargedImageQuality(false);
                                }}
                                aria-label="Close"
                            >
                                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg hover:cursor-pointer hover:shadow-xl transition-shadow">
                                    <span className="text-3xl font-bold bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent">
                                        &times;
                                    </span>
                                </div>
                            </button>
                        </div>
                    
                        {/* Enlarged Image */}
                        <EnlargedImage filepath={enlargedImage} image_type={enlargedImageType}/>
                    </div>
                </div>
            )}

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
                                router.push('/');
                            }}
                        >Home
                        </button>
                
                    </div>
                    <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {setMenuOpen(false)}}
                        >Dashboard
                        </button>
                     </div>
                     <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                setMenuOpen(false);
                                openFeedback();
                            }}
                        >Feedback
                        </button>
                     </div>
                      <div className="bg-white rounded-xl pl-10 pr-10 pt-2 pb-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-black">
                        <button 
                            className="text-xl font-semibold text-gray-600 uppercase tracking-wide"
                            onClick={() => {
                                router.push('/download');
                            }}
                        >Download
                        </button>
                     </div>
                </nav>
              </aside>
            </>
          )}
          </div>
    );
}

export default function Dashboard() {
    return (
        <FeedbackProvider>
            <DashboardContent />
        </FeedbackProvider>
    );
}