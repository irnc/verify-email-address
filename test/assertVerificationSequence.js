'use strict';

const assert = require('assert');

const orderedSteps = [
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
];

module.exports = function assertVerificationSequence(result) {
  assert.deepEqual(
    Object.keys(result),
    [...orderedSteps, 'responses'],
    'does not have all needed properties'
  );

  let failedStep;

  orderedSteps.forEach((step) => {
    switch (result[step]) {
      case true:
        if (failedStep) {
          throw new Error(`Unexpected success at ${step} after failure at ${failedStep}`);
        }
        break;

      case false:
        if (failedStep) {
          throw new Error(`Unexpected failure at ${step} after failure at ${failedStep}`);
        } else {
          failedStep = step;
        }
        break;

      case undefined:
        if (!failedStep) {
          throw new Error(`Unexpected undefined at ${step} after previous successful step`);
        }
        break;

      default:
        throw new Error(`${step} set to unexpected value ${result[step]}`);
    }
  });
};
