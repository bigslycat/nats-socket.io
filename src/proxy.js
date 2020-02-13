const Server = require('socket.io');
const NATS = require('nats');

const {
  NATS_HOST = 'nats',
  NATS_USER,
  NATS_PASS,
  NATS_TOKEN,
  WS_PATH = '/socket.io',
  WS_ORIGINS = '*',
} = process.env;

const WS_PORT = process.env.WS_PORT ? +process.env.WS_PORT : 80;
const NATS_PORT = process.env.NATS_PORT ? +process.env.NATS_PORT : 4222;

const nc = NATS.connect({
  url: `nats://${NATS_HOST}:${NATS_PORT}`,
  user: NATS_USER,
  pass: NATS_PASS,
  token: NATS_TOKEN,
  json: true,
});

const io = new Server({
  path: WS_PATH,
  origins: WS_ORIGINS,
});

io.on('connection', socket => {
  const subjectPrefix = `web client ${socket.id}`;
  const subjectPrefixLength = subjectPrefix.length;

  const { headers } = socket.request;

  const cookies = headers.cookie
    ? headers.cookie.split(';').reduce((acc, entry) => {
        const [key, value] = entry.trim().split('=');
        acc[key] = value;
        return acc;
      }, {})
    : {};

  const fingerprint = {
    headers,
    cookies,
    socketId: socket.id,
  };

  nc.publish('web client / connect', fingerprint);

  const failSubject = subject =>
    nc.publish('web client / invalid subject', {
      ...fingerprint,
      givenSubjectType:
        typeof subject === 'object' && !subject ? 'null' : typeof subject,
    });

  socket.on('publish', (subject, payload) => {
    if (typeof subject !== 'string') {
      failSubject(subject);
    } else if (payload !== undefined) {
      nc.publish(subject, { ...fingerprint, payload });
    } else {
      nc.publish(subject, fingerprint);
    }
  });

  socket.on('request', (subject, arg0, arg1) => {
    if (typeof subject !== 'string') {
      failSubject(subject);
    } else if (typeof arg1 === 'function') {
      nc.requestOne(subject, { ...fingerprint, payload: arg0 }, arg1);
    } else if (typeof arg0 === 'function') {
      nc.requestOne(subject, fingerprint, arg1);
    } else {
      nc.publish('web client / no reply callback', fingerprint);
    }
  });

  const personal = nc.subscribe(
    `${subjectPrefix} *`,
    (payload, replySubject, rawSubject) => {
      const subject = rawSubject.slice(subjectPrefixLength).trim();

      if (replySubject) {
        socket.emit(subject, payload, responsePayload =>
          nc.publish(replySubject, {
            ...fingerprint,
            payload: responsePayload,
          }),
        );
      } else {
        socket.emit(subject, payload);
      }
    },
  );

  socket.on('disconnect', () => {
    nc.publish('web client / disconnect', fingerprint);
    nc.unsubscribe(personal);
  });
});

io.listen(WS_PORT);
