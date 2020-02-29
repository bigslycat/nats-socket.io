FROM node:13.8.0-alpine3.11 as builder

WORKDIR /app

ADD . .

RUN yarn --prod \
  && yarn build

FROM alpine:3.11.3

COPY --from=builder /app/bin/proxy /usr/local/bin/nats-socket.io

RUN apk add --no-cache libstdc++ libgcc

CMD nats-socket.io
