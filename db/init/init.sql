
CREATE TABLE patients (
  patient_id CHAR(64) PRIMARY KEY, -- SHA-256 hash of MRN/Study ID (64 hex chars)
  age_range VARCHAR(5) NOT NULL CHECK (age_range IN (
    '0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49',
    '50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90-94','95+'
  )),
  sex TEXT NOT NULL CHECK (sex IN ('Male', 'Female', 'Other')),
  monk_skin_tone INT CHECK (monk_skin_tone BETWEEN 1 AND 10),
  fitzpatrick_skin_type INT CHECK (fitzpatrick_skin_type BETWEEN 1 AND 6),
  self_reported_race TEXT
  -- ita_score DOUBLE PRECISION CHECK (ita_score BETWEEN -90.0 AND 90.0)
);

CREATE TABLE anatomic_sites (
  name TEXT PRIMARY KEY
);

INSERT INTO anatomic_sites (name) VALUES
  ('Head/Neck'),
  ('Upper Extremity'),
  ('Lower Extremity'),
  ('Anterior Torso'),
  ('Lateral Torso'),
  ('Posterior Torso'),
  ('Palms/Soles')
  ON CONFLICT DO NOTHING;


CREATE TABLE clinical_diagnoses (
  diagnosis TEXT PRIMARY KEY
);

INSERT INTO clinical_diagnoses (diagnosis) VALUES
  ('Melanoma'), 
  ('Melanocytic nevus'), 
  ('Basal cell carcinoma'), 
  ('Actinic keratosis'), 
  ('Solar lentigo'),
  ('Seborrheic keratosis'),
  ('Lichen planus-like keratosis'), 
  ('Squamous cell carcinoma'), 
  ('Angioma'), 
  ('Dermatofibroma'),
  ('Other')
  ON CONFLICT DO NOTHING;

CREATE TABLE lesions (
    id SERIAL PRIMARY KEY,
    patient_id CHAR(64) REFERENCES patients(patient_id),
    anatomic_site TEXT NOT NULL REFERENCES anatomic_sites(name),
    vectra_id INTEGER,
    biopsied BOOLEAN NOT NULL,
    clinical_diagnosis TEXT NOT NULL REFERENCES clinical_diagnoses(diagnosis) 
);


CREATE TABLE image_types (
  code TEXT PRIMARY KEY
);

INSERT INTO image_types (code) VALUES
  ('close-up'),
  ('polarized-contact'),
  ('non-polarized-contact'),
  ('non-polarized-liquid-contact'),
  ('non-polarized-cone')
  ON CONFLICT DO NOTHING;

CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lesion_id INTEGER REFERENCES lesions(id),
  device_type TEXT NOT NULL,
  device_os TEXT NOT NULL,
  image_type TEXT NOT NULL REFERENCES image_types(code),
  poor_quality BOOLEAN NOT NULL DEFAULT false,
  contains_phi BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE bug_reports (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

