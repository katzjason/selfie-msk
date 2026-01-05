"use client";

import { useEffect, useState, useRef } from "react";
import MenuIcon from '@/app/components/menu-icon';
    
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
    image_type: string;
    file: string;
}

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

export default function Dashboard() {
    const [data, setData] = useState<Row[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const processedData = useRef<Record<number, imageMetadata[]>>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/db?last=10");
            const json = await res.json();
            setData(json.data);
            // console.log(json.data.type);
            console.log(json.data);

            // Preprocess queried data
            for (let i = 0; i < json.data.length; i++){
                const lesion_id : number = json.data[i].lesion_id;
                const filepaths : string[] = json.data[i].filepaths.split(", ");
                const image_types : string[] = json.data[i].image_types.split(", ");
                let metadata = new Array(5)

                for (let j = 0; j < filepaths.length; j++){
                    const idx : number | undefined = image_type_indices[image_types[j]];
                    if (typeof idx !== "undefined") {
                    metadata[idx] = { image_type: image_types[j], file: filepaths[j] };
                    }
                }

                // filling in missing data
                for (let k = 0; k < 5; k++){
                    if(metadata[k] == undefined){
                        metadata[k] = {image_type: reverse_image_type_indices[k], file: "N/A"}
                    }
                }

                processedData.current[lesion_id] = metadata;
            }
        })();
    }, []);

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
            <div className="flex flex-col text-black min-h-screen items-center ml-10 mr-10">
                <div className="flex flex-col w-full">
                    {data.map((row, i)=>
                        (<div key={i} className="flex flex-col bg-white rounded-xl p-4 shadow-lg text-black mt-10 pt-5 pb-5">
                            <div className="block text-sm text-gray-600 tracking-wide mb-2">
                                <div><span className="font-semibold uppercase ">Age Range: </span> {row.age_range?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Diagnosis: </span> {row.clinical_diagnosis?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Anatomic Site: </span> {row.anatomic_site?? "N/A"}</div>
                                <div><span className="font-semibold uppercase ">Timestamp: </span>{makeDatePretty(row.captured_at) ?? "N/A"}</div>
                            </div>
                            
                            <div className="flex flex-row justify-between">
                                {processedData.current[row.lesion_id].map((value, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className="block text-xs text-gray-600 lowercase tracking-wide mb-1 font-bold">{value.image_type}</div>
                                        {value.file == "N/A" ? <div className="flex flex-col items-center justify-center bg-gray-200 w-[200px] h-full font-bold text-gray-600">NOT TAKEN</div> : 
                                            <img key={idx} width={200}
                                                    //src={`https://172.28.37.105/api/images/${encodeURIComponent(value.file.substring(13))}`}
                                                src="https://us1.discourse-cdn.com/flex015/uploads/imagej/optimized/3X/8/2/820aad406e87ceb23e2347a20fed7131ba8a587e_2_551x499.png"
                                            /> }
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}