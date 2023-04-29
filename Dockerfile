FROM node:latest

RUN apt-get update -y && apt-get upgrade -y
RUN apt-get -y install chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY . /app
RUN cd /app
RUN yarn install --prod
RUN yarn add source-map-support
RUN yarn global add @nestjs/cli
CMD yarn run build && yarn run start