# Selfie App
Streamlined lesion capture for standard smartphone images and dermoscopy through smartphone attachments. 

## Getting Started
**First**, ensure that [Docker](https://docs.docker.com/engine/install/) is installed on your server.

**Second**, clone this git repository and navigate to the root directory.
```
git clone https://github.mskcc.org/katzj2/selfie-app.git

cd selfie-app
```

**Next**, run the installer:
```
bash install.sh
```

The installer will:
- generate or update `.env`
- generate a new `DB_PASSWORD`
- create/update the self-signed LAN certificate (`certs/selfie.crt` + `certs/selfie.key`)
- optionally use enterprise certs if present (`certs/enterprise-ca.pem` + `certs/enterprise-ca.key`)
- detect existing database volume and prompt whether to keep it or delete it

Certificate choice guidance:
- Use enterprise cert on the local enterprise-managed server when its SAN covers the selected LAN IP/hostname.
- Use self-signed cert for other standalone/local deployments.

Data safety:
- The installer does not run `docker compose down -v`.
- If an existing DB volume is detected, it prompts before running `docker volume rm selfie-app_postgres_data`.

## Browser Requirements
- **iOS:** Safari 15.4+ (iOS 15.4+, iPhone 7 or later recommended)
- **Android:** Chrome 94+
- **Desktop:** Chrome 94+, Firefox 94+, Safari 15.4+, Edge 94+

Note: iPhone 6 and earlier devices running iOS 12 are not supported due to React 19 and Tailwind CSS v4 minimum browser requirements.

**The app should be up and running on your server and accessible at:**
```
https://<your-server's-IP-address>/
```
