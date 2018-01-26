'use strict';

const assert = require('assert');

// gmail.com
const E_DOES_NOT_EXIST = '550-5.1.1 The email account that you tried to reach does not exist.';
const E_IS_DISABLED = '550-5.2.1 The email account that you tried to reach is disabled.';
const E_IS_OVER_QUOTA = '552-5.2.2 The email account that you tried to reach is over quota.';

// outlook.com
const E_OUTLOOK_MAILBOX_UNAVAILABLE = '550 5.5.0 Requested action not taken: mailbox unavailable.';


const resultTemplate = {
  exchangeAllowedInitialConnection: undefined,
  exchangeAllowedMailSession: undefined,
  exchangeAcceptedHello: undefined,
  exchangeAcceptedMailCommand: undefined,
  exchangeAcceptedRecipientCommand: undefined,

  mailboxExists: undefined,
  mailboxCouldReceive: undefined,
};

function guessMailboxStatus(responses) {
  assert(responses.length > 0, '[NO_RESPONSES] could not guess from nothing');

  const result = Object.assign({}, resultTemplate);

  Object.seal(result);

  // There was an initial connection if we have at least one response.
  result.exchangeAllowedInitialConnection = true;

  // Mail session is rejected.
  if (responses[0].indexOf('554') === 0) {
    result.exchangeAllowedMailSession = false;

    return result;
  }

  // Mail session is initiated.
  if (responses[0].indexOf('220') === 0) {
    result.exchangeAllowedMailSession = true;
  }

  // We couldn't guess more if there is no more responses.
  if (responses.length === 1) {
    return result;
  }

  // EHLO command accepted.
  result.exchangeAcceptedHello = responses[1].indexOf('250') === 0;

  if (responses.length === 2) {
    return result;
  }

  result.exchangeAcceptedMailCommand = responses[2].indexOf('250') === 0;

  if (responses.length === 3) {
    return result;
  }

  result.exchangeAcceptedRecipientCommand = responses[3].indexOf('250') === 0;

  // If RCPT command was accepted, it means mailbox exists, and we assume that
  // it could receive emails.
  if (result.exchangeAcceptedRecipientCommand) {
    result.mailboxExists = true;
    result.mailboxCouldReceive = true;

    return result;
  }

  // Otherwise, if RCPT command was not successful, it doesn't mean that mailbox
  // doesn't exist. So here we start checking for specific messages to conclude
  // that mailbox definitely doesn't exist.
  //
  // Existence would be undefined if we couldn't conclude definitely.

  if (
    responses[3].indexOf(E_DOES_NOT_EXIST) === 0 ||
    responses[3].indexOf(E_OUTLOOK_MAILBOX_UNAVAILABLE) === 0
  ) {
    result.mailboxExists = false;
    result.mailboxCouldReceive = false;

    return result;
  }

  if (
    responses[3].indexOf(E_IS_DISABLED) === 0 ||
    responses[3].indexOf(E_IS_OVER_QUOTA) === 0
  ) {
    result.mailboxExists = true;
    result.mailboxCouldReceive = false;

    return result;
  }

  return result;
}

module.exports = guessMailboxStatus;
