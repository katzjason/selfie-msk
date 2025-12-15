'use client';
import { createContext, useContext, useState } from 'react';

const PatientContext = createContext({
    name: "", setName: (name: string) => {},
    dob: "", setDob: (dob: string) => {},
    age:  "", setAge: (age: string) => {},
    sex: "", setSex: (sex: string) => {},
    fitzpatrick: "", setFitzpatrick: (fitzpatrick: string) => {},
    race: "", setRace: (race: string) => {},
    ita: "", setIta: (ita: string) => {},
    monkSkinTone: "", setMonkSkinTone: (monkSkinTone: string) => {},
    diagnosis: "", setDiagnosis: (diagnosis: string) => {},
    mrn: "", setMrn: (mrn: string) => {},
    lesionID: "", setLesionID: (lesionID: string) => {},
    clinicalDiagnosis: "", setClinicalDiagnosis: (clinicalDiagnosis: string) => {},
    lesionType: "", setLesionType: (lesionType: string) => {},
    anatomicSite: "", setAnatomicSite: (anatomicSite: string) => {},
});

export default function PatientProvider({children} : {children: React.ReactNode}) {
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [fitzpatrick, setFitzpatrick] = useState("");
    const [race, setRace] = useState("");
    const [ita, setIta] = useState("");
    const [monkSkinTone, setMonkSkinTone] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [mrn, setMrn] = useState("");
    const [lesionID, setLesionID] = useState("");
    const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
    const [lesionType, setLesionType] = useState("");
    const [anatomicSite, setAnatomicSite] = useState("");

    return (
        <PatientContext.Provider value={{
            name, setName,
            dob, setDob,
            age, setAge,
            sex, setSex,
            fitzpatrick, setFitzpatrick,
            race, setRace,
            ita, setIta,
            monkSkinTone, setMonkSkinTone,
            diagnosis, setDiagnosis,
            mrn, setMrn,
            lesionID, setLesionID,
            clinicalDiagnosis, setClinicalDiagnosis,
            lesionType, setLesionType,
            anatomicSite, setAnatomicSite,
        }}>{children}</PatientContext.Provider>
    );
}

export function usePatient() {
    return useContext(PatientContext);
}