FROM node:20-alpine

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont 

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY . /app
RUN cd /app

RUN npm i
RUN npm i -g nest
RUN npm run build
CMD npm run start