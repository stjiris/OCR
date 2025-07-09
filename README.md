# OCR

# Setup
## Example production `.env` file for the `website` folder
```sh
PUBLIC_URL = /endpoint-that-serves-website/
GENERATE_SOURCEMAP = false

REACT_APP_API_URL = /endpoint-that-serves-website/api
REACT_APP_HEADER_STYLE = ''
REACT_APP_ADMIN = "?perfil=admin"
```

## Example production `.env` file for the `server` folder
```sh
CELERY_BROKER_URL = redis://redis:6379/0
CELERY_RESULT_BACKEND = redis://redis:6379/0
ES_URL=http://elasticsearch:9200

# IMAGE_PREFIX must be set to the same value as website's PUBLIC_URL if PUBLIC_URL is not '/' 
FILES_PATH = _files
PRIVATE_PATH = _files/_private_sessions

FLASK_DEBUG = False
FLASK_SECRET_KEY = something_very_long_and_complex # (for example, use python's secrets.token_hex())
FLASK_SECURITY_PASSWORD_SALT = a_big_number_for_HMAC_salt # (for example, use python's secrets.SystemRandom().getrandbits(128))

ADMIN_EMAIL = put_admin_email_or_username@here.spam
ADMIN_PASSWORD = put_admin_password_here
```

## Environment variables recommended for development
```
# website:
PUBLIC_URL = /
DEBUG=True
GENERATE_SOURCEMAP = true
REACT_APP_API_URL = /api

# server:
FLASK_DEBUG = True
```

## NGINX config file
After downloading, you should go to `path/to/NGINX/conf/nginx.conf` and replace its contents with something similar to (`path/to/` should be replaced with the path from your own PC):

```
worker_processes  1;

events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;

        location / {
            root path/to/OCR/website/build;
            index index.html;
        }

        location /api/ {
            proxy_pass http://localhost:5001/;
            client_max_body_size 0;
        }

        location /images/ {
            alias path/to/OCR/server/files/;
        }
    }

}

```

# Running the system

## First-time startup

Run the following command from the project root:
`docker-compose -f docker-compose.yml up -d --force-recreate --build`

## Shutting down

Run the following command from the project root:
`docker-compose -f docker-compose.yml down`

## Restarting

Run the following command from the project root:
`docker-compose -f docker-compose.yml up -d`
