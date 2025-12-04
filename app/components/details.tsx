import { usePatient } from '@/app/contexts/patient';
import { Info } from 'lucide-react';

export default function Details() {

    const {
        age,
        sex,
        diagnosis,


    } = usePatient();
    return (
        <div className="flex flex-row w-screen mt-2 ml-2 pl-2 text-black text-sm justify-start">
            <Info className="w-4 h-4 flex-1 flex-shrink-0" />
            <div className="flex flex-20 flex-col pl-2">
                <div className="flex flex-row gap-2">
                    <div>Age: {age},</div>
                    <div>Sex: {sex},</div>
                    <div>Monk: TBD,</div>
                    <div>Diagnosis: {age},</div>
                </div>
                <div className="flex flex-row gap-2">
                    
                    <div>MRN: 12345678,</div>
                    <div>Lesion ID: 11111111,</div>
                </div>
                <div className="flex flex-row">
                    <div>Anatomic Site: {age}</div>
                </div>
            </div>
        </div>
    );
}