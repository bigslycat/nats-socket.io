const Server = require('socket.io');
const NATS = require('nats');

const {
  NATS_HOSTNAME = 'localhost',
  NATS_USER,
  NATS_PASSWORD,
  NATS_TOKEN,
  WS_PATH = '/socket.io',
  WS_ORIGINS = '*',
} = process.env;

const NATS_PORT = process.env.NATS_PORT ? +process.env.NATS_PORT : 4222;

const nc = NATS.connect({
  url: `nats://${NATS_HOSTNAME}:${NATS_PORT}`,
  user: NATS_USER,
  pass: NATS_PASSWORD,
  token: NATS_TOKEN,
  json: true,
});

const io = new Server({
  path: WS_PATH,
  origins: WS_ORIGINS,
});

io.on('connection', socket => {
  const clientData = {
    headers: socket.request.headers,
    cookies: parseCookies(socket.request.headers.cookie),
    webSocketId: socket.id,
  };

  nc.publish('web client / connected', clientData);

  const sendWrongMessageFormat = (message, reply) => {
    nc.publish('web client / error', {
      ...clientData,
      kind: 'Wrong message format',
      message,
    });

    if (typeof reply === 'function') {
      reply({
        ok: false,
        error: {
          message: 'Wrong message format',
          givenMessage: message,
        },
      });
    }
  };

  socket.on('message', (message, reply) => {
    if (!message) sendWrongMessageFormat(message, reply);
    else if (typeof message === 'string') {
      sendMessage(message, clientData, reply);
    } else if (
      typeof message === 'object' &&
      typeof message.subject === 'string' &&
      message.subject
    ) {
      sendMessage(
        message.subject,
        { ...clientData, payload: message.payload },
        reply,
      );
    } else sendWrongMessageFormat(message, reply);
  });

  const personalSubject = `to web client ${socket.id} / *`;
  const personalMessages = nc.subscribe(
    personalSubject,
    (payload, replySubject, rawSubject) => {
      const subject = rawSubject.slice(personalSubject.length - 1).trim();

      if (replySubject) {
        socket.emit(subject, payload, responsePayload =>
          nc.publish(replySubject, {
            ...clientData,
            payload: responsePayload,
          }),
        );
      } else {
        socket.emit(subject, payload);
      }
    },
  );

  socket.on('disconnect', () => {
    nc.publish(
      `web client ${clientData.webSocketId} / disconnected`,
      clientData,
    );
    nc.unsubscribe(personalMessages);
  });
});

io.listen(80);

const parseCookies = header =>
  header
    ? header.split(';').reduce((acc, entry) => {
        const [key, value] = entry.trim().split('=');
        acc[key] = value;
        return acc;
      }, {})
    : {};

const sendMessage = (subject, body, reply) => {
  const natsSubject = `from web client ${body.webSocketId} / ${subject}`;

  if (typeof reply === 'function') {
    nc.requestOne(natsSubject, body, message =>
      reply(
        message &&
          (message.ok === true || (message.ok === false && message.error))
          ? message
          : { ok: true, result: message },
      ),
    );
  } else {
    nc.publish(natsSubject, body);
  }
};
