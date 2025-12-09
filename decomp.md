# Selfie App Decomposition
Author:  Jason Katz <br>
Last Updated: 12/9/2025

## Project Goals
- Faciliate the collection of 100k far-away/dermoscopy images for the Melanoma Research Alliance (MRA) grant due EOY 2027.


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



TODO:
- Create local database
- Integrate database connection
- Finalized workflow for uploading images (when in the process does this occur?)
- (+) button to add images to a specific group?
- Preventing photo loss on refresh/different sessions
- Monk scale UI
- Anatomic Site Mannequin
- Capture multiple photos at one time
- Delete photos in group
- Updating data to include biopsy results
- Admin page for viewing all uploading images in the last X time period?
- Confirmation before official upload
- Hash MRN and serve non-protected patient data back
- Web responsiveness

DONE:
- ~~Group photos by MRN/LesionID/AnatomicSite~~
- ~~Make expand section look better~~
- ~~Make gallery data look better~~


-MEETING
-New name for app
-Working with Dr. Marghoob
