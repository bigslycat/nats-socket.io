# nats-socket.io

[NATS] [Socket.io] proxy

## Usage

### Docker

```sh
docker run --rm -d -p 80:80 \
  -e "NATS_HOSTNAME=example.com" \
  -e "NATS_PORT=4222" \
  -e "WS_PATH=/socket.io" \
  -e "WS_ORIGINS=*" \
  bigslycat/nats-socket.io:latest
```

### Docker Compose

```yaml
version: '3.7'
services:
  nats-proxy:
    image: bigslycat/nats-socket.io:latest
    environment:
      NATS_HOSTNAME: example.com
      NATS_PORT: 4222
      WS_PATH: /socket.io
      WS_ORIGINS: '*'
```

## Environment variables

| Name            | Default value | Description                         |
|-----------------|---------------|-------------------------------------|
| `NATS_HOSTNAME` | `localhost`   | NATS server hostname                |
| `NATS_PORT`     | `4222`        | NATS server port                    |
| `NATS_USER`     |               | NATS user                           |
| `NATS_PASSWORD` |               | NATS password                       |
| `NATS_TOKEN`    |               | NATS connection authorization token |
| `WS_PATH`       | `/socket.io`  | Name of the path to capture WS      |
| `WS_ORIGINS`    | `*`           | The allowed origins                 |

## Events

### NATS incoming messages

All of NATS incoming messages have data object JSON with properties:

- `headers` — headers of WS client connection.
- `cookies` — cookies of WS client connection.
- `webSocketId` — unique id of WS client connection.

#### NATS incoming messages list

- `web client / connected` — emits after web client connected to server.
- `web client / disconnected` — emits after web client disconnected to server.
- `web client / error` — emits when something went wrong after web client message. Additional properties:
  - `kind` — error kind.
  - `message` — raw incoming data value. It may not be an object, because it may depend on a possibly wrong client IO.
- `from web client <webSocketId> / <subject>` — emits after web client sends a message. Additional properties:
  - `payload` — payload data of message. Optional.

### NATS outgoing messages

- `to web client <webSocketId> / <Socket.io event name>` — forwards to Socket.io connection as `<Socket.io event name>`.

### Outgoing Socket.io messages

- `message` — send message to NATS. Arguments:
  1. `string | Object`, required — message subject or object with properties:
     - `subject`, string, required — message subject.
     - `payload`, optional — message payload.
  2. `reply` — callback function for reply from NATS.

[NATS]: https://nats.io
[socket.io]: https://socket.io
