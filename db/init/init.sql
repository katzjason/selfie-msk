
CREATE TABLE patients (
    mrn_hash CHAR(64) PRIMARY KEY, -- SHA-256 hash of MRN (64 hex chars)
    full_name TEXT,
    date_of_birth DATE,
    age_range VARCHAR(5) NOT NULL CHECK (age_range IN (
      '0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44','45-49',
      '50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90-94','95+'
    )),
    sex TEXT CHECK (sex IN ('Male', 'Female', 'Other')),
    monk_skin_tone INT CHECK (monk_skin_tone BETWEEN 1 AND 10),
    fitzpatrick_skin_type INT CHECK (fitzpatrick_skin_type BETWEEN 1 AND 6),
    ita_score DOUBLE PRECISION CHECK (ita_score BETWEEN -90.0 AND 90.0)
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
  ('Benign keratosis (solar lentigo / seborrheic keratosis / lichen planus-like keratosis)'),
  ('Vascular lesion'), 
  ('Squamous cell carcinoma'), 
  ('Other'),
  ('Seborrheic Keratosis'), 
  ('Angioma'), 
  ('Dermatofibroma')
  ON CONFLICT DO NOTHING;

CREATE TABLE lesions (
    id SERIAL PRIMARY KEY,
    mrn_hash CHAR(64) REFERENCES patients(mrn_hash),
    anatomic_site TEXT REFERENCES anatomic_sites(name),
    vectra_id INTEGER,
    biopsied BOOLEAN,
    clinical_diagnosis TEXT REFERENCES clinical_diagnoses(diagnosis)
);

CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vectra_id INTEGER,
  lesion_id INTEGER REFERENCES lesions(id)
);

