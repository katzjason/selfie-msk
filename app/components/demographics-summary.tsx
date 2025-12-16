import { usePatient } from '@/app/contexts/patient';
import {  ChevronDown, Info } from 'lucide-react';

export default function DemographicsSummary() {
    const {
        age,
        sex,
        monkSkinTone,
        mrn
    } = usePatient();

    return (
        <div className="flex flex-row w-full justify-center">
            <div className="flex flex-col flex-[10]">
                <div className="flex flex-row w-full justify-center gap-5 pl-1">
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">MRN</div>
                        <div className="text-md text-gray-600 font-semibold">{mrn}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Age</div>
                        <div className="text-md text-gray-600 font-semibold">{age}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Sex</div>
                        <div className="text-md text-gray-600 font-semibold">{sex[0] ?? ""}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">Monk</div>
                        <div className="text-md text-gray-600 font-semibold">{monkSkinTone}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">FST</div>
                        <div className="text-md text-gray-600 font-semibold">{"TBD"}</div>
                    </div>
                    <div className="flex flex-col justify-start items-start">
                        <div className="text-xs uppercase text-gray-600">ITA</div>
                        <div className="text-md text-gray-600 font-semibold">{"TBD"}</div>
                    </div>
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

