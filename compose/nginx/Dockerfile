FROM node:lts AS builder

COPY ./website/package* .

RUN npm ci

COPY ./website .

RUN npm run build

FROM nginx:stable

COPY --from=builder /build/ /usr/share/nginx/html

COPY ./compose/nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template

CMD ["nginx","-g","daemon off;"]
