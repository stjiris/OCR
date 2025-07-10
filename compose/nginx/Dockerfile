FROM node:lts AS builder

COPY ./website/package* .

RUN npm ci

COPY ./website .

RUN npm run build

FROM nginx:stable

COPY --from=builder /build/ /usr/share/nginx/html

COPY ./compose/nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template

# To quickly setup SSL, uncomment and use a custom password to generate a self-signed certificate
#RUN openssl genrsa -des3 -passout pass:XXXXXX -out server.pass.key 2048 && \
#    openssl rsa -passin pass:XXXXXXXX -in server.pass.key -out /etc/ssl/private/nginx-selfsigned.key && \
#    rm server.pass.key && \
#    openssl req -new -key /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/private/nginx-selfsigned.csr \
#        -subj "/C=PT/ST=Lisbn/L=Lisbon/O=INESCOCR/OU=INESC OCR/CN=localhost" && \
#    openssl x509 -req -days 365 -in /etc/ssl/private/nginx-selfsigned.csr -signkey /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt

CMD ["nginx","-g","daemon off;"]
