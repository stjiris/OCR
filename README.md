# OCR

# Setup
## Environment Variables for Local Testing
```
DEBUG=True
ES_URL=http://localhost:9200/
IMAGE_PREFIX=http://localhost
```

## `.env` file for the website
```
PORT=3001
REACT_APP_API_URL='http://localhost/api/'
REACT_APP_IMAGES_PREFIX = 'http://localhost'
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
## Start the NGINX
Go to the location where you downloaded NGINX and open `nginx.exe`.

## Start the backend server
```
$ cd server
$ pip install -r requirements.txt
$ python app.py
```

## Start the website
```
$ cd website
$ npm install
$ npm start
```
