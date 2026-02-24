# Selfie App Dashboard Improvements

## Project Context
The selfie app is a web app allowing clinical users to enter patient demographics (age, sex, skin tone...), lesion-level information (anatomic site, id, diagnosis), and then capture a few different types of tagged images. After capturing a set of images and clicking "submit" to upload them, the user is brought back to the home page, which condenses the demographics section and allows for easy toggling of the lesion-level info. The metadata and images captured during this workflow are stored in a docker database volume and image volume, and are able to be viewed and exported from the /dashboard page.

## Setup Context
This code lives in a github repository that is cloned by an external user, which they do to run 'install.sh'. This sets up the web, database, image, and caddy images on their local server. Currently one user has downloaded this repository and my goal is to make it as easy as possible for them to incorporate these changes without doing too much work. The public repo lives on the "public" remote, whereas my version lives on origin/main. Both of these repositories should be identical.

## Goals

### Image Unavailability
- Images captured are stored on an image volume and the respective metadata is stored on a database volume. Currently, the dashboard page does not render any images for some reason. This was working in the past, but is no longer the case. Please determine why this is happening.

### Patient Study ID Visibility
- The Study ID/MRN field on the home page page.tsx is currently only visible if 'biopsy' is also toggled. Please make this field ALWAYS visible for instances where version 'MedUniWien' is selected during the install script.

### Database data overflow
- The user has complained that when they export data from the database volume, the demographics from the most recent patient appear for all rows. This should not be the case. Please diagnosis this issue

### iPHone 6 Compatibility
- The user has an iPhone 6 using Safari to on ios 12.x access this app. This is only one of their devices, so it's not a dealbreakder. However, if it would be possible to make this app compatible with this older device, please do so.

### Unknown Upload Error
- The user is receiving quite a few unknown upload errors. Please check if there is any reason that might be causing this to be the case on their installation, but not mine.

### HTTPS Cert
- The app is still showing as unsecure when I view it, even though this was resolved previously. Why is this happening?


Please make these changes in the vienna-errors branch.
