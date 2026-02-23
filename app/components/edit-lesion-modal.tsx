"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

interface EditLesionModalProps {
  lesionId: number;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

type LesionDetail = {
  patient_id: string;
  age_range: string;
  sex: string;
  monk_skin_tone: number | null;
  fitzpatrick_skin_type: number | null;
  self_reported_race: string | null;
  lesion_id: number;
  anatomic_site: string;
  vectra_id: number | null;
  biopsied: boolean;
  clinical_diagnosis: string;
};

const ageRanges = [
  "0-4","5-9","10-14","15-19","20-24","25-29","30-34","35-39",
  "40-44","45-49","50-54","55-59","60-64","65-69","70-74","75-79",
  "80-84","85-89","90-94","95+"
];
const sexOptions = ["Male", "Female", "Other"];
const clinicalDiagnoses = [
  "Melanoma", "Melanocytic nevus", "Basal cell carcinoma",
  "Actinic keratosis", "Solar lentigo", "Seborrheic keratosis",
  "Lichen planus-like keratosis", "Squamous cell carcinoma",
  "Angioma", "Dermatofibroma", "Other"
];
const anatomicSites = [
  "Head/Neck", "Upper Extremity", "Lower Extremity",
  "Anterior Torso", "Lateral Torso", "Posterior Torso", "Palms/Soles"
];
const raceOptions = [
  "White", "Hispanic/Latino/Spanish Origin of any race",
  "Black or African American", "Asian",
  "American Indian or Alaskan Native",
  "Native Hawaiian or Other Pacific Islander",
  "Two or more races"
];

const selectClass = "w-full text-gray-600 px-3 py-2 bg-gray-50 border-2 rounded-lg focus:outline-none focus:border-gray-500 transition-all cursor-pointer text-sm";
const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

export default function EditLesionModal({ lesionId, onClose, onSaved, onDeleted }: EditLesionModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LesionDetail | null>(null);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fetch lesion detail on mount
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/db/lesion/${lesionId}`);
        const json = await res.json();
        if (json.ok) {
          const d = json.data;
          setForm({
            patient_id: d.patient_id,
            age_range: d.age_range,
            sex: d.sex,
            monk_skin_tone: d.monk_skin_tone,
            fitzpatrick_skin_type: d.fitzpatrick_skin_type,
            self_reported_race: d.self_reported_race,
            lesion_id: d.lesion_id,
            anatomic_site: d.anatomic_site,
            vectra_id: d.vectra_id,
            biopsied: d.biopsied,
            clinical_diagnosis: d.clinical_diagnosis,
          });
        } else {
          setError("Failed to load lesion data");
        }
      } catch {
        setError("Failed to load lesion data");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [lesionId]);

  const updateField = (field: keyof LesionDetail, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/db/lesion/${lesionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: {
            age_range: form.age_range,
            sex: form.sex,
            monk_skin_tone: form.monk_skin_tone,
            fitzpatrick_skin_type: form.fitzpatrick_skin_type,
            self_reported_race: form.self_reported_race,
          },
          lesion: {
            anatomic_site: form.anatomic_site,
            vectra_id: form.vectra_id,
            biopsied: form.biopsied,
            clinical_diagnosis: form.clinical_diagnosis,
          },
        }),
      });
      const json = await res.json();
      if (json.ok) {
        onSaved();
      } else {
        setError(json.error || "Save failed");
      }
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/db/lesion/${lesionId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        onDeleted();
      } else {
        setError(json.error || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/90">
      <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-extrabold uppercase bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent">
            Edit Lesion
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-all"
              aria-label="Delete lesion"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow hover:cursor-pointer">
                <span className="text-3xl font-bold bg-gradient-to-br from-yellow-200 to-pink-500 bg-clip-text text-transparent">
                  &times;
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading...</div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-sm mb-4">{error}</div>
          )}

          {form && !loading && (
            <div className="flex flex-col gap-4">
              {/* Patient Information */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Patient Information</div>
                <p className="text-xs text-gray-400 mb-3">Changes to patient info apply to all lesions for this patient.</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Age Range</label>
                    <select
                      value={form.age_range}
                      onChange={(e) => updateField("age_range", e.target.value)}
                      className={selectClass}
                    >
                      {ageRanges.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Sex</label>
                    <select
                      value={form.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
                      className={selectClass}
                    >
                      {sexOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Monk Skin Tone</label>
                    <select
                      value={form.monk_skin_tone ?? ""}
                      onChange={(e) => updateField("monk_skin_tone", e.target.value ? Number(e.target.value) : null)}
                      className={selectClass}
                    >
                      <option value="">Not set</option>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Fitzpatrick Skin Type</label>
                    <select
                      value={form.fitzpatrick_skin_type ?? ""}
                      onChange={(e) => updateField("fitzpatrick_skin_type", e.target.value ? Number(e.target.value) : null)}
                      className={selectClass}
                    >
                      <option value="">Not set</option>
                      {Array.from({ length: 6 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Self-Reported Race</label>
                    <select
                      value={form.self_reported_race ?? ""}
                      onChange={(e) => updateField("self_reported_race", e.target.value || null)}
                      className={selectClass}
                    >
                      <option value="">Not set</option>
                      {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Lesion Information */}
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Lesion Information</div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Clinical Diagnosis</label>
                    <select
                      value={form.clinical_diagnosis}
                      onChange={(e) => updateField("clinical_diagnosis", e.target.value)}
                      className={selectClass}
                    >
                      {clinicalDiagnoses.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Anatomic Site</label>
                    <select
                      value={form.anatomic_site}
                      onChange={(e) => updateField("anatomic_site", e.target.value)}
                      className={selectClass}
                    >
                      {anatomicSites.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Vectra ID</label>
                    <input
                      type="number"
                      value={form.vectra_id ?? ""}
                      onChange={(e) => updateField("vectra_id", e.target.value ? Number(e.target.value) : null)}
                      className={selectClass}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Biopsied</label>
                    <select
                      value={form.biopsied ? "true" : "false"}
                      onChange={(e) => updateField("biopsied", e.target.value === "true")}
                      className={selectClass}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {form && !loading && (
          <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-200 text-gray-600 font-semibold text-sm uppercase tracking-wide hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-br from-yellow-500 to-pink-500 text-white font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm text-center">
              <p className="text-gray-700 font-semibold mb-4">
                Are you sure you would like to delete this entry?
              </p>
              <p className="text-xs text-gray-400 mb-6">
                This will permanently remove the lesion and its images. If this is the only lesion for this patient, the patient will also be removed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2 rounded-xl bg-gray-200 text-gray-600 font-semibold text-sm uppercase tracking-wide hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
