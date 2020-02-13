FROM node:12.16.0-alpine3.11

WORKDIR /app

ADD . .

RUN yarn --prod

CMD node src/proxy.js
