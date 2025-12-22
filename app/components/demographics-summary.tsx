import { usePatient } from '@/app/contexts/patient';
import {  ChevronDown, Info } from 'lucide-react';

export default function DemographicsSummary( { concise } : { concise : boolean}) {
    const {
        mrn,
        age,
        sex,
        monkSkinTone,
        fitzpatrick,
        ita
    } = usePatient();

    return (
        <div className="flex flex-row w-full justify-center">
            <div className="flex flex-col flex-[10]">
                <div className="flex flex-row w-full justify-center gap-5 pl-1">
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">ID/MRN</div>
                        <div className="text-md text-gray-600 font-semibold">{mrn || "N/A"}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Age</div>
                        <div className="text-md text-gray-600 font-semibold">{age || "N/A"}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Sex</div>
                        <div className="text-md text-gray-600 font-semibold">{sex[0] || "N/A"}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Monk</div>
                        <div className="text-md text-gray-600 font-semibold">{monkSkinTone || "N/A"}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">FST</div>
                        <div className="text-md text-gray-600 font-semibold">{fitzpatrick || "N/A"}</div>
                    </div>
                    {/* {!concise && (<div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">ITA</div>
                        <div className="text-md text-gray-600 font-semibold">{ita || "N/A"}</div>
                    </div>)} */}
                </div>
            </div>
            <div className="flex flex-col justify-center items-end pr-2 flex-[1]">
                <>
                <ChevronDown className="w-7 h-7 text-gray-600 font-semibold" />
                </>
            </div>
        </div>
    );
}

