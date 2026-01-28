FROM node:25.2.1-alpine3.21 AS build
WORKDIR /app/
# Configure npm to handle self-signed certificates
RUN npm config set strict-ssl false
COPY spa/package.json spa/package-lock.json spa/vite.config.js ./
RUN npm install
COPY spa/index.html ./
COPY spa/src ./src/
RUN npx vite build

FROM nginx:1.29.3
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /var/www/diffuzzer/
