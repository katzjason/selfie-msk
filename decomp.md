# Selfie App Decomposition
Author:  Jason Katz <br>
Last Updated: 12/17/2025


## Project Goals
- Faciliate the collection of 100k far-away/dermoscopy images for the Melanoma Research Alliance (MRA) grant due EOY 2027.
- **Barcelona Due Date: 1/1/2026**


## Selfie App User Workflow
1. Physical QR code pointing to the selfie app is hung up somewhere where clinicians can easily access it
2. Clinician fills out initial patient information (MRN, Monk Skin Tone, Diagnosis (Benign/Biopsy), LesionID (from Vectra), and Anatomic Site)
3. Clinician takes photos from phone camera (could be with Canfield attachment or not)
    - Not expected to be a patient "selfie", but could mimic it
    - Right now I don't have a way to automatically capture white light/UV photos -- this would need to be manually toggled
    - Ideally the clinician snaps a series of photos of the same lesion
4. Clinician can adjust patient information settings easily and take new pictures -- each of which will be tagged with the appropriate metadata behind the scenes
5. Clinician clicks 'Upload' to upload images from their session when finished
6. Later on when biopsy results come in for a specific patient/lesion, the app will automatically update the image data to include this diagnosis



# TODO:

## Frontend
- Slider sizing issue
- Monk scale UI
- Focus
- Anatomic Site Mannequin
- Layout size optimization

## Backend
- File naming convention
- Integrate database connection
- Export data button
- Hash MRN and serve non-protected patient data back

## Out of Scope
- Updating data to include biopsy results
- Admin page for viewing all uploading images in the last X time period?
- Cloud terms and conditions?



DONE:

## Outstanding Questions
- AWS Issues
- Admin Page
- Multiple versions of the app?
- Auth?
- Canfield automatic toggle limitations (according to Sam)
- Tying in path reports
- App name
- LANGUAGE/DERM DIAGNOSIS NAMES


http://172.28.37.105:3000


## Marghoob Study
- NO PHI COLLECTED (12/16)
- No need to biopsy -- they are all benign
- Diagnosis will be based on clinical/dermoscopic visual analysis
- Name, Date, MRN, DOB, Sex, Fitzpatrick Skin Type, ITA values, Monk Scale, Self-reported race
- Overview photo taken
- Then 4 images: contact vs. non-contact, polarized vs non-polarized
- Then UV images taken
- Want to access images from a website linked to the app
- Avatar to connect lesion to body site
- What to do if other site doesn't have vectra or a lesion ID?
- Miami equipment?

## Sites
- Miami/Texas for Marghoob study
- MSK? (MRA)
- Barcelona


## Questions
- Alignment of data fields
- Exact order/types of photos taken
