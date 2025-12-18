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
    lesionCounter: number;
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
    lesionCounter: 1,
}



type PatientPatch =
  | Partial<PatientState>
  | ((prev: PatientState) => Partial<PatientState>);

type PatientContextValue = PatientState & {
  updatePatient: (patch: PatientPatch) => void;
};

// type PatientContextValue = PatientState & {
//     updatePatient: (patch: Partial<PatientState>) => void;
// };

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({children} : {children: React.ReactNode}) {
    const [patientState, setPatientState] = useState(defaultState);
    const [hydrated, setHydrated] = useState(false);

    const updatePatient = (patch: PatientPatch) => {
        setPatientState(prev => ({
            ...prev,
            ...(typeof patch === "function" ? patch(prev) : patch),
        }));
    };

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