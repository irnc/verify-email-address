'use strict';

const dns = require('dns');
const findExchangeWithLowestPriority = require('./findExchangeWithLowestPriority');

function getExchange(domain, callback) {
  dns.resolveMx(domain, (err, addresses) => {
    if (err) {
      const domainError = new Error(err.message);

      domainError.domainResolves = !err.message.match(/^queryMx ENOTFOUND/);
      domainError.domainHasExchangeRecord = undefined;

      if (domainError.domainResolves) {
        // ENODATA occurs when there are no records in DNS answer, but there
        // could be records, but of type other than MX, see below for handling.
        domainError.domainHasExchangeRecord = !err.message.match(/^queryMx ENODATA/);
      }

      callback(domainError);
      return;
    }

    // `resolveMx` errors when there are no records in DNS answer, but there
    // could be records, but of type other than MX. In this case, there would
    // be no error and addresses would be empty array.
    if (addresses.length === 0) {
      const domainError = new Error(`No addresses for ${domain}`);
      domainError.domainResolves = true;
      domainError.domainHasExchangeRecord = false;

      callback(domainError);
      return;
    }

    const exchange = findExchangeWithLowestPriority(addresses);

    // Empty MX record with priority 0 was observer on mistyped yahho.com
    // domain at January 24, 2018.
    if (exchange === '') {
      const domainError = new Error('Unexpected value in MX record');
      domainError.domainResolves = true;
      domainError.domainHasExchangeRecord = false;
      callback(domainError);
      return;
    }

    callback(null, exchange);
  });
}

module.exports = getExchange;
