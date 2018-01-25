/* eslint-env mocha */

'use strict';

const assert = require('assert');
const querySmtp = require('../src/querySmtp');

// Replace dynamic parts with placeholders, so we could assert equavalence.
function sanitizeResponses(responses) {
  const sessionId = responses[0].match(/ESMTP (.*) - gsmtp/)[1];
  const ip = responses[1].match(/your service, \[(.*)]/)[1];

  return responses
    .map(r => r.replace(ip, 'IP'))
    .map(r => r.replace(sessionId, 'SID'));
}

describe('querySmtp', () => {
  it('should return four expected responses from gmail.com', (done) => {
    querySmtp('pavel.zubkou@gmail.com', { exchange: 'gmail-smtp-in.l.google.com' }, (err, responses) => {
      assert.ifError(err);

      const expected = [
        '220 mx.google.com ESMTP SID - gsmtp\r\n',
        '250-mx.google.com at your service, [IP]\r\n'
          + '250-SIZE 157286400\r\n'
          + '250-8BITMIME\r\n'
          + '250-STARTTLS\r\n'
          + '250-ENHANCEDSTATUSCODES\r\n'
          + '250-PIPELINING\r\n'
          + '250-CHUNKING\r\n'
          + '250 SMTPUTF8\r\n',
        '250 2.1.0 OK SID - gsmtp\r\n',
        '250 2.1.5 OK SID - gsmtp\r\n',
        '221 2.0.0 closing connection SID - gsmtp\r\n',
      ];

      sanitizeResponses(responses).forEach((response, stage) => {
        assert.equal(response, expected[stage], `stage ${stage} response doesn't match`);
      });

      done();
    });
  });

  it('should return not ok response from stage 3 on invalid recipient', (done) => {
    const options = {
      exchange: 'gmail-smtp-in.l.google.com',
    };

    querySmtp('pavel.zubkou-not-found@gmail.com', options, (err, responses) => {
      assert.ifError(err);

      const expected = [
        '220 mx.google.com ESMTP SID - gsmtp\r\n',
        '250-mx.google.com at your service, [IP]\r\n'
          + '250-SIZE 157286400\r\n'
          + '250-8BITMIME\r\n'
          + '250-STARTTLS\r\n'
          + '250-ENHANCEDSTATUSCODES\r\n'
          + '250-PIPELINING\r\n'
          + '250-CHUNKING\r\n'
          + '250 SMTPUTF8\r\n',
        '250 2.1.0 OK SID - gsmtp\r\n',
        '550-5.1.1 The email account that you tried to reach does not exist. Please try\r\n'
          + '550-5.1.1 double-checking the recipient\'s email address for typos or\r\n'
          + '550-5.1.1 unnecessary spaces. Learn more at\r\n'
          + '550 5.1.1  https://support.google.com/mail/?p=NoSuchUser SID - gsmtp\r\n',
        '221 2.0.0 closing connection SID - gsmtp\r\n',
      ];

      sanitizeResponses(responses).forEach((response, stage) => {
        assert.equal(response, expected[stage], `stage ${stage} response doesn't match`);
      });

      done();
    });
  });

  it('should error on invalid exhcange', (done) => {
    // This is invalid exchange record from cloud.com domain.
    const exchange = 'ms14354512.msv1.invalid';

    querySmtp('test@cloud.com', { exchange }, (err) => {
      assert.equal(err.exchangeResolves, false, 'unexpected exchangeResolves');
      assert.equal(err.exchangeAllowedInitialConnection, undefined, 'unexpected exchangeAcceptsConnection');

      done();
    });
  });

  it('should return only one response in case of rejected mail session', (done) => {
    // MX for gmx.de
    const exchange = 'mx00.emig.gmx.net';

    querySmtp('test@gmx.de', { exchange }, (err, responses) => {
      assert.ifError(err);
      assert.equal(responses.length, 1, 'expected only one response');
      done();
    });
  });

  it('should include incomplete reply when server closes connection on mail session initiation', (done) => {
    // gmsil.com is a typo in gmail.com, but it has an SMTP exchange.
    querySmtp('example@gmsil.com', { exchange: 'gmsil.com.1.0001.arsmtp.com' }, (err, responses) => {
      assert.ifError(err);
      assert.equal(responses.length, 1);
      assert.equal(responses[0], '554 Transaction Failed');
      done();
    });
  });
});
