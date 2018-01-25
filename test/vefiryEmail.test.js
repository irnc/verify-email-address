/* eslint-env mocha */

'use strict';

const assert = require('assert');
const verifyEmail = require('../src/verifyEmail');

describe('verifyEmail', () => {
  it('should return structured verification result', (done) => {
    verifyEmail('test@example.com', (err, result) => {
      assert.ifError(err);
      assert.deepEqual(Object.keys(result), [
        'format',
        'domainResolves',
        'domainHasExchangeRecord',
        'exchangeResolves',
        'exchangeAllowedInitialConnection',
        'exchangeAllowedMailSession',
        'exchangeAcceptedHello',
        'exchangeAcceptedMailCommand',
        'exchangeAcceptedRecipientCommand',
        'mailboxExists',
        'mailboxCouldReceive',
        'responses',
      ], 'does not have all needed properties');

      done();
    });
  });

  it('should succeed for existing email', (done) => {
    verifyEmail('pavel.zubkou@gmail.com', (err, result) => {
      assert.ifError(err);
      assert.equal(result.mailboxExists, true);
      assert.equal(result.mailboxCouldReceive, true);

      done();
    });
  });

  it('should error on invalid email format', (done) => {
    verifyEmail('test@example.com@example.com', (err, result) => {
      assert.ifError(err);
      assert.equal(result.format, false);
      assert.equal(result.domainResolves, undefined);

      done();
    });
  });

  it('should return SMTP server responses for observability', (done) => {
    verifyEmail('pavel.zubkou@gmail.com', (err, result) => {
      assert.ifError(err);
      assert.equal(result.responses.length, 5);

      done();
    });
  });
});
