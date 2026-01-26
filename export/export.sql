COPY (
  SELECT * 
    FROM patients p
    JOIN (
            SELECT *
            FROM lesions l
            JOIN images i
            ON l.id = i.lesion_id
    ) AS t1
    ON p.patient_id = t1.patient_id
) TO STDOUT WITH CSV HEADER;
