'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = "patient-context";

interface PatientState {
    age: string;
    sex: string;
    monkSkinTone: string;
    fitzpatrick: string;
    ita: string;
    race: string;
    newPatient: boolean;
    biopsy: boolean;
    mrn: string;
    lesionID: string;
    clinicalDiagnosis: string;
    anatomicSite: string;
}

const defaultState = {
    age: '',
    sex: '',
    monkSkinTone: '',
    fitzpatrick: '',
    ita: '',
    race: '',
    newPatient: true,
    biopsy: false,
    mrn: '',
    lesionID: '',
    clinicalDiagnosis: '',
    anatomicSite: '',
}

type PatientContextValue = PatientState & {
    updatePatient: (patch: Partial<PatientState>) => void;
};

const PatientContext = createContext<PatientContextValue | null>(null);

// const PatientContext = createContext({

//     // DEMOGRAPHIC DATA
//     age:  "", setAge: (age: string) => {},
//     sex: "", setSex: (sex: string) => {},
//     monkSkinTone: "", setMonkSkinTone: (monkSkinTone: string) => {},
//     fitzpatrick: "", setFitzpatrick: (fitzpatrick: string) => {},
//     ita: "", setIta: (ita: string) => {},
//     race: "", setRace: (race: string) => {},
//     newPatient: false, setNewPatient: (newPatient: boolean) => {},
    
//     // LESION-LEVEL DATA
//     biopsy: false, setBiopsy: (biopsy: boolean) => {},
//     mrn: "", setMrn: (mrn: string) => {},
//     lesionID: "", setLesionID: (lesionID: string) => {},
//     clinicalDiagnosis: "", setClinicalDiagnosis: (clinicalDiagnosis: string) => {},
//     lesionType: "", setLesionType: (lesionType: string) => {},
//     anatomicSite: "", setAnatomicSite: (anatomicSite: string) => {},
// });

export function PatientProvider({children} : {children: React.ReactNode}) {
    const [patientState, setPatientState] = useState(defaultState);
    const [hydrated, setHydrated] = useState(false);

    const updatePatient = (patch: Partial<PatientState>) =>
        setPatientState(prev => ({ ...prev, ...patch }));

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setPatientState(JSON.parse(stored));
            } catch {
                console.warn('Invalid patient context in localStorage');
            }
        }
        setHydrated(true);
    }, []);

    
    useEffect(() => {
        if (!hydrated) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patientState));
    }, [patientState, hydrated]);

    return (
        <PatientContext.Provider
            value={{
                ...patientState,
                updatePatient,
            }}
            >
            {children}
        </PatientContext.Provider>
    );
}


export function usePatient() {
    const ctx = useContext(PatientContext);
    if (!ctx) {
        throw new Error('usePatient must be used within PatientProvider');
    }
    return ctx;
}
//export const usePatient = () => useContext(PatientContext);

    // export const usePatient = () => useContext(PatientContext);




    // DEMOGRAPHIC DATA
//     const [age, setAge] = useState("");
//     const [sex, setSex] = useState("");
//     const [monkSkinTone, setMonkSkinTone] = useState("");
//     const [fitzpatrick, setFitzpatrick] = useState("");
//     const [ita, setIta] = useState("");
//     const [race, setRace] = useState("");
//     const [newPatient, setNewPatient] = useState(true);

    
//     const [biopsy, setBiopsy] = useState(false);
//     const [mrn, setMrn] = useState("");
//     const [lesionID, setLesionID] = useState("");
//     const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
//     const [lesionType, setLesionType] = useState("");
//     const [anatomicSite, setAnatomicSite] = useState("");

//     return (
//         <PatientContext.Provider value={{
//             age, setAge,
//             sex, setSex,
//             monkSkinTone, setMonkSkinTone,
//             fitzpatrick, setFitzpatrick,
//             ita, setIta,
//             race, setRace,
//             newPatient, setNewPatient,
//             biopsy, setBiopsy,
//             mrn, setMrn,
//             lesionID, setLesionID,
//             clinicalDiagnosis, setClinicalDiagnosis,
//             lesionType, setLesionType,
//             anatomicSite, setAnatomicSite,
//         }}>{children}</PatientContext.Provider>
//     );
// }

// export function usePatient() {
//     return useContext(PatientContext);
// }