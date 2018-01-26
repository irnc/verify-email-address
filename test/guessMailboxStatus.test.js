/* eslint-env mocha */

'use strict';

const assert = require('assert');
const querySmtp = require('../src/querySmtp');
const guessMailboxStatus = require('../src/guessMailboxStatus');

describe('guessMailboxStatus', () => {
  it('should conclude that mailbox doesn\'t exists for not-found gmail.com address', (done) => {
    const options = {
      exchange: 'gmail-smtp-in.l.google.com',
    };

    querySmtp('pavel.zubkou-not-found@gmail.com', options, (err, responses) => {
      assert.ifError(err);
      const status = guessMailboxStatus(responses);
      assert.equal(status.mailboxExists, false);
      done();
    });
  });

  it('should not conclude on mailbox existence when mail session was rejected', (done) => {
    const options = {
      exchange: 'mx01.emig.gmx.net',
    };

    querySmtp('pavel.zubkou-not-found@gmx.de', options, (err, responses) => {
      assert.ifError(err);
      const status = guessMailboxStatus(responses);
      assert.equal(status.exchangeAllowedMailSession, false);
      assert.equal(status.mailboxExists, undefined);
      done();
    });
  });

  it('should throw on no responses', () => {
    assert.throws(
      () => guessMailboxStatus([]),
      /\[NO_RESPONSES]/
    );
  });
});
