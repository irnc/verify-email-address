'use strict';

const assert = require('assert');

const ascendingPriority = (a, b) => a.priority - b.priority;

function findExchangeWithLowestPriority(addresses) {
  assert(addresses && addresses.length > 0, 'addresses should has at least one address');

  return addresses.sort(ascendingPriority)[0].exchange;
}

module.exports = findExchangeWithLowestPriority;
