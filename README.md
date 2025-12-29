# Selfie App
Streamlined lesion capture for standard smartphone images and dermoscopy through smartphone attachments. 

## Getting Started
**First**, ensure that [Docker](https://docs.docker.com/engine/install/) is installed on your server.

**Second**, clone this git repository and navigate to the root directory.
```
git clone https://github.mskcc.org/katzj2/selfie-app.git

cd selfie-app
```

**Next**, build the container and launch the volumes for image store and the database.
```
docker compose build

docker compose up -d
```

**The app should be up and running on your server and accessible at:**
```
https://<your-server's-IP-address>/
```