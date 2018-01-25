/* eslint-env mocha */

'use strict';

const assert = require('assert');
const findExchangeWithLowestPriority = require('../src/findExchangeWithLowestPriority');

describe('findExchangeWithLowestPriority', () => {
  it('should error when no addresses has been passed', () => {
    assert.throws(
      () => findExchangeWithLowestPriority(),
      // eslint-disable-next-line comma-dangle
      /^AssertionError: addresses should has at least one address$/
    );
    assert.throws(
      () => findExchangeWithLowestPriority([]),
      // eslint-disable-next-line comma-dangle
      /^AssertionError: addresses should has at least one address$/
    );
  });

  it('should select exchange with lowest priority', () => {
    // MX for gmail.com
    const validAddresses = [
      { exchange: 'gmail-smtp-in.l.google.com', priority: 5 },
      { exchange: 'alt3.gmail-smtp-in.l.google.com', priority: 30 },
      { exchange: 'alt2.gmail-smtp-in.l.google.com', priority: 20 },
      { exchange: 'alt4.gmail-smtp-in.l.google.com', priority: 40 },
      { exchange: 'alt1.gmail-smtp-in.l.google.com', priority: 10 },
    ];
    assert.equal(findExchangeWithLowestPriority(validAddresses), 'gmail-smtp-in.l.google.com');

    // MX for cloud.com
    const invalidAddresses = [
      { exchange: 'ms14354512.msv1.invalid', priority: 32767 },
    ];
    assert.equal(findExchangeWithLowestPriority(invalidAddresses), 'ms14354512.msv1.invalid');
  });
});
