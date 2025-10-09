# OCR Service

# Setup
For a prepared server, the only required setup is the creation of `.env` files in the `website` and `server` folders. If the server is behind a proxy and must be accessed through a specific path, this path must be placed where `/path-that-serves-website/` is specified.

## Example production `website/.env` file
```sh
PUBLIC_URL = https://example.com/path-that-serves-website
REACT_APP_BASENAME = path-that-serves-website  # no forward slashes at the start or end
REACT_APP_API_URL = path-that-serves-website/api
GENERATE_SOURCEMAP = false
```

## Example production `server/.env` file
```sh
APP_BASENAME = path-that-serves-website  # no forward slashes at the start or end
CELERY_BROKER_URL = redis://redis:6379/0
CELERY_RESULT_BACKEND = redis://redis:6379/0
ES_URL = http://elasticsearch:9200/

# IMAGE_PREFIX must be set to the same value as website's PUBLIC_URL if PUBLIC_URL is not '/'
FILES_PATH = _files
PRIVATE_PATH = _files/_private_spaces

FLASK_DEBUG = False
FLASK_SECRET_KEY = something_very_long_and_complex # (for example, use python's secrets.token_hex())
FLASK_SECURITY_PASSWORD_SALT = a_big_number_for_HMAC_salt # (for example, use python's secrets.SystemRandom().getrandbits(128))

ADMIN_EMAIL = put_admin_email_or_username@here.spam
ADMIN_PASS = put_admin_password_here
```

## Environment variables recommended for local development
```sh
# website:
PUBLIC_URL = http://localhost
DEBUG = True
GENERATE_SOURCEMAP = true
REACT_APP_API_URL = /api

# server:
APP_BASENAME = ""
FLASK_DEBUG = True
```

## NGINX config file
The config file for NGINX is generated from `compose/nginx/nginx.conf.template` and does not need changes. Eventual alterations to NGINX's configuration should be done on this file.

# Running the system

## Installation and first-time startup

Run the following command from the project root:
`docker compose -f docker-compose.production.yml up -d --force-recreate --build`

## Shutting down

Run the following command from the project root:
`docker compose -f docker-compose.production.yml down`

## Restarting after shutdown

Run the following command from the project root:
`docker-compose -f docker-compose.production.yml up -d`
