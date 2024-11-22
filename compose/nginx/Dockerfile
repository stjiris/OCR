FROM node:20.8.1 AS builder

COPY ./website/package* .

RUN npm ci --legacy-peer-deps

COPY ./website .

RUN npm run build

FROM nginx:latest

COPY --from=builder /build/ /usr/share/nginx/html

COPY ./compose/nginx/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx","-g","daemon off;"]
