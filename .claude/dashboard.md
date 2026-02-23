# Selfie App Dashboard Improvements

## Project Context
The selfie app is a web app allowing clinical users to enter patient demographics (age, sex, skin tone...), lesion-level information (anatomic site, id, diagnosis), and then capture a few different types of tagged images. After capturing a set of images and clicking "submit" to upload them, the user is brought back to the home page, which condenses the demographics section and allows for easy toggling of the lesion-level info. The metadata and images captured during this workflow are stored in a docker database volume and image volume, and are able to be viewed and exported from the /dashboard page.

## Setup Context
This code lives in a github repository that is cloned by an external user, which they do to run 'install.sh'. This sets up the web, database, image, and caddy images on their local server. Currently one user has downloaded this repository and my goal is to make it as easy as possible for them to incorporate these changes without doing too much work. The public repo lives on the "public" remote, whereas my version lives on origin/main. Both of these repositories should be identical.

## Problem Descriptions

### Dashbaord Improvements
- When the user edits a dashboard row, the user MUST have either monk skin tone or fitzpatrick skin type set to a value. Do not let the user save changes if this is not true
- If the lesion has biopsy set to true, then display the lesion study id/mrn in a field box below, but grayed out. If the biopsy is set to false, don't display it. If the biopsy was set to false but is changed to true, prompt for a study id/mrn below and don't let the user save without entering this value. Just like page.tsx, you should highlight this input field in red and have a required flag appear. FYI, this MRN/study id should be hashed and stored in the db just like the other routes do it.

### General Improvments
- The app is hosted locally on my server and is being routed to https://snapcap.mskcc.org. This was establishing a secure connection before, but somethiing just changed. Can you help diagnose why a secure connection is no longer being made? Also, be considerate of the fact that this codebase is being spun up by other users, so the certificate given to me by MSK should only be used by me (not hard coded)
-