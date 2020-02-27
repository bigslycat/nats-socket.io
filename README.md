# nats-socket.io

[NATS] [socket.io] proxy

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

[NATS]: https://nats.io
[socket.io]: https://socket.io
