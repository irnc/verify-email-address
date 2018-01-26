/* eslint-env mocha */

'use strict';

const assert = require('assert');
const assertVerificationSequence = require('./assertVerificationSequence');
const verifyEmail = require('../src/verifyEmail');

describe('verifyEmail', () => {
  it('should return structured verification result', (done) => {
    verifyEmail('test@example.com', (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);

      done();
    });
  });

  it('should succeed for existing email', (done) => {
    verifyEmail('pavel.zubkou@gmail.com', (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);
      assert.equal(result.mailboxExists, true);
      assert.equal(result.mailboxCouldReceive, true);

      done();
    });
  });

  it('should error on invalid email format', (done) => {
    verifyEmail('test@example.com@example.com', (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);
      assert.equal(result.format, false);
      assert.equal(result.domainResolves, undefined);
      assert.equal(result.latestError, undefined);

      done();
    });
  });

  it('should return SMTP server responses for observability', (done) => {
    verifyEmail('pavel.zubkou@gmail.com', (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);
      assert.equal(result.responses.length, 5);

      done();
    });
  });

  it('should error on failure to establish a TCP connection', (done) => {
    verifyEmail('example@migration.com', (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);
      assert.equal(result.exchangeAllowedInitialConnection, false);
      assert.equal(
        result.latestError.message.match(/^connect ECONNREFUSED/).length,
        1
      );

      done();
    });
  });

  it('should definitely tell unavailability of outlook.com mailbox', (done) => {
    verifyEmail(`test-${Date.now()}@outlook.com`, (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);
      assert.equal(result.mailboxExists, false);

      done();
    });
  });

  it('should return exchange in result', (done) => {
    verifyEmail(`test-${Date.now()}@outlook.com`, (err, result) => {
      assert.ifError(err);
      assertVerificationSequence(result);

      assert.equal(result.exchange, 'outlook-com.olc.protection.outlook.com');

      done();
    });
  });
});
