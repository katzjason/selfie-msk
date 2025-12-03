'use client';
import { createContext, useContext, useState } from 'react';

const PatientContext = createContext({
    age:  "",
    setAge: (age: string) => {},
    sex: "",
    setSex: (sex: string) => {},
    diagnosis: "",
    setDiagnosis: (diagnosis: string) => {},
    mrn: "",
    setMrn: (mrn: string) => {},
    lesionID: "",
    setLesionID: (lesionID: string) => {},
    clinicalDiagnosis: "",
    setClinicalDiagnosis: (clinicalDiagnosis: string) => {},
    anatomicSite: "",
    setAnatomicSite: (anatomicSite: string) => {},
});

export default function PatientProvider({children} : {children: React.ReactNode}) {
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [mrn, setMrn] = useState("");
    const [lesionID, setLesionID] = useState("");
    const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
    const [anatomicSite, setAnatomicSite] = useState("");

    return (
        <PatientContext.Provider value={{
            age,
            setAge,
            sex,
            setSex,
            diagnosis,
            setDiagnosis,
            mrn,
            setMrn,
            lesionID,
            setLesionID,
            clinicalDiagnosis,
            setClinicalDiagnosis,
            anatomicSite,
            setAnatomicSite,
        }}>{children}</PatientContext.Provider>
    );
}

export function usePatient() {
    return useContext(PatientContext);
}