'use strict';

const assert = require('assert');
const net = require('net');
const debug = require('debug')('email-verify:querySmtp');

function querySmtp(email, options, callback) {
  assert(options.exchange, `exchange for ${email} should be provided in options`);

  const fqdn = options.fqdn || 'postman.example';
  const sender = options.sender || 'check@postman.example';
  const timeout = options.timeout || 500;
  const socket = net.createConnection(options.port || 25, options.exchange);

  let stage = 0;
  const response = {
    data: '',
    completed: false,
  };

  const responses = [];
  const advanceToNextStage = () => {
    stage += 1;
    response.data = '';
    response.completed = false;
  };

  if (timeout !== 0) {
    debug(`setting timeout for ${timeout} ms`);
    socket.setTimeout(timeout, () => {
      debug(`socket was idle for ${timeout} ms, it would be destroyed`);
      socket.destroy();

      const err = new Error('SMTP connection was idle too long');
      callback(err, responses);
    });
  }

  socket.on('data', (data) => {
    response.data += data.toString();
    response.completed = response.data.slice(-1) === '\n';

    // await additional data before processing response.
    if (!response.completed) {
      debug(`received ${data.length} bytes so far, waiting for complete response`, {
        data: response.data,
      });
      return;
    }

    debug(`handling stage ${stage} response`);

    // Collect all responses so higher consumers could analyse them.
    responses.push(response.data);

    switch (stage) {
      case 0:
        if (response.data.indexOf('220') === 0) {
          socket.write(`EHLO ${fqdn}\r\n`, advanceToNextStage);
        } else {
          socket.end();
        }
        break;

      case 1:
        if (response.data.indexOf('250') === 0) {
          socket.write(`MAIL FROM:<${sender}>\r\n`, advanceToNextStage);
        } else {
          socket.end();
        }
        break;

      case 2:
        if (response.data.indexOf('250') === 0) {
          socket.write(`RCPT TO:<${email}>\r\n`, advanceToNextStage);
        } else {
          socket.end();
        }
        break;

      case 3:
        socket.write('QUIT\r\n', advanceToNextStage);
        break;

      case 4:
        socket.end();

      // no default
    }
  });

  socket.once('connect', () => {
    debug('socket connected');
  });

  socket.once('error', (err) => {
    debug('socket emitted error event, calling querySmtp callback');
    const exchangeError = new Error(err.message);

    exchangeError.exchangeResolves = !err.message.match(/^getaddrinfo ENOTFOUND/);

    callback(exchangeError, responses);
  });

  socket.once('end', () => {
    debug('socket received end event');

    if (response.data.length > 0 && !response.completed) {

      // Per RFC 5321 Section 4.2, an _SMTP client MUST determine its actions
      // only by the reply code, not by the text; [...] in the general case, any
      // text, including no text at all (although senders SHOULD NOT send bare
      // codes), MUST be acceptable._
      //
      // Thus if there is a reply code, let's accept it as a complete reply
      // when connection is closed before mail sesion initiation.
      if (stage === 0 && response.data.match(/^[0-9]{3}/)) {
        callback(null, [response.data]);
        return;
      }

      const err = new Error(`Connection closed while reply from stage ${stage} wasn't complete`);
      err.stage = stage;
      err.incompleteReply = response.data;
      callback(err);
      return;
    }

    callback(null, responses);
  });
}

module.exports = querySmtp;
