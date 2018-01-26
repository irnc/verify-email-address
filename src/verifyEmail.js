'use strict';

const assert = require('assert');
const { MultiError } = require('verror');
const { isEmail } = require('validator');
const extractDomain = require('./extractDomain');
const getExchange = require('./getExchange');
const querySmtp = require('./querySmtp');
const guessMailboxStatus = require('./guessMailboxStatus');

// Template with all values undefined is needed to always return consistent set
// of properties.
const resultTemplate = {
  format: undefined,
  domainResolves: undefined,
  domainHasExchangeRecord: undefined,
  exchangeResolves: undefined,
  exchangeAllowedInitialConnection: undefined,
  exchangeAllowedMailSession: undefined,
  exchangeAcceptedHello: undefined,
  exchangeAcceptedMailCommand: undefined,
  exchangeAcceptedRecipientCommand: undefined,
  mailboxExists: undefined,
  mailboxCouldReceive: undefined,

  // Raw responses from SMTP server is also returned in result to allow
  // API consumers to observe data on which decisions was made.
  responses: undefined,
};

function verifyEmail(email, callback) {
  const result = Object.assign({}, resultTemplate);

  // Object is sealed to prevent mistyped properties to be added to result,
  // only what is in template is allowed.
  Object.seal(result);

  result.format = isEmail(email);

  if (!result.format) {
    process.nextTick(callback, null, result);
    return;
  }

  getExchange(extractDomain(email), (err, exchange) => {
    if (err) {
      try {
        assert('domainResolves' in err, 'domain error should have domainResolves');
        assert('domainHasExchangeRecord' in err, 'domain error should have domainHasExchangeRecord');
      } catch (assertionErr) {
        throw new MultiError([
          err,
          assertionErr,
        ]);
      }

      result.domainResolves = err.domainResolves;
      result.domainHasExchangeRecord = err.domainHasExchangeRecord;

      callback(null, result);
      return;
    }

    // If we managed to get exchange, it means that email domain resolves and
    // it has exchange record.
    result.domainResolves = true;
    result.domainHasExchangeRecord = true;

    querySmtp(email, { exchange }, (queryErr, responses) => {
      result.responses = responses;

      if (queryErr) {
        result.exchangeResolves = queryErr.exchangeResolves;

        callback(null, result);
        return;
      }

      // If there is no queryErr, then we conclude that exchange resolves.
      result.exchangeResolves = true;

      callback(null, Object.assign(result, guessMailboxStatus(responses)));
    });
  });
}

module.exports = verifyEmail;
