# Selfie App Dashboard Improvements

## Project Context
The selfie app is a web app allowing clinical users to enter patient demographics (age, sex, skin tone...), lesion-level information (anatomic site, id, diagnosis), and then capture a few different types of tagged images. After capturing a set of images and clicking "submit" to upload them, the user is brought back to the home page, which condenses the demographics section and allows for easy toggling of the lesion-level info. The metadata and images captured during this workflow are stored in a docker database volume and image volume, and are able to be viewed and exported from the /dashboard page.

## Setup Context
This code lives in a github repository that is cloned by an external user, which they do to run 'install.sh'. This sets up the web, database, image, and caddy images on their local server. Currently one user has downloaded this repository and my goal is to make it as easy as possible for them to incorporate these changes without doing too much work. The public repo lives on the "public" remote, whereas my version lives on origin/main. Both of these repositories should be identical.

## Problem Descriptions

### Cert Improvement
- The app needs to use entraprise-ca.pem on my local installation, but should use the key generated in the install script for other instances created by other uses. I broke my app recently and now it's not loading. Can you help me debug why the page isn't displaying and get back to the state where a secure conneciton is established? This previous change added some app_domain stuff to the install script. My app needs to run on the user's local server's IP (which is not this machine). My enterprise is adding a secure connection that ip address