/* eslint-env mocha */

'use strict';

const assert = require('assert');
const net = require('net');
const getExchange = require('../src/getExchange');

// gmail.de is operated by Google, it doesn't have MX record; it redirects
// HTTP traffic to google.com/gmail (see `curl -I gmail.de`).
const VALID_DOMAIN_WITHOUT_MX = 'gmail.de';

describe('getExchange', () => {
  it('should error on not found domain', (done) => {
    getExchange('test.invalid', (err) => {
      assert.equal(err.domainResolves, false, 'unexpected domainResolves');
      assert('domainHasExchangeRecord' in err, 'domainHasExchangeRecord should be present');
      assert.equal(err.domainHasExchangeRecord, undefined, 'unexpected domainHasExchangeRecord');
      done();
    });
  });

  it('should error on domain without MX records', (done) => {
    getExchange(VALID_DOMAIN_WITHOUT_MX, (err) => {
      assert.equal(err.domainResolves, true, 'unexpected domainResolves');
      assert.equal(err.domainHasExchangeRecord, false, 'unexpected domainHasExchangeRecord');
      done();
    });
  });

  // dig MX xcvb.com answers with CNAME record
  it('should error on domain without MX record, but with CNAME in answer to MX record', (done) => {
    getExchange('xcvb.com', (err) => {
      assert.equal(err.domainResolves, true, 'unexpected domainResolves');
      assert.equal(err.domainHasExchangeRecord, false, 'unexpected domainHasExchangeRecord');
      done();
    });
  });

  it('should error when MX record is empty', (done) => {
    getExchange('yahho.com', (err, exchange) => {
      assert.equal(exchange, undefined);
      assert.equal(err.domainResolves, true, 'unexpected domainResolves');
      assert.equal(err.domainHasExchangeRecord, false, 'unexpected domainHasExchangeRecord');
      done();
    });
  });

  it('should error when TLD does not exist', (done) => {
    getExchange('hihi.hi', (err) => {
      assert.equal(err.domainResolves, false, 'unexpected domainResolves');
      done();
    });
  });

  it('should error when domain does not exist', (done) => {
    getExchange('eyefitu-non-existing-domain.com', (err) => {
      assert.equal(err.domainResolves, false, 'unexpected domainResolves');
      done();
    });
  });

  it('should pass exchange addresses without trying to resolve them', (done) => {
    getExchange('cloud.com', (err, exchange) => {
      assert.ifError(err);
      assert.deepEqual(exchange, 'ms14354512.msv1.invalid');

      // Confirm that attempt to resolve exchange domain fails.
      const socket = net.createConnection(25, exchange);
      socket.on('error', (e) => {
        assert.equal(e.message, 'getaddrinfo ENOTFOUND ms14354512.msv1.invalid ms14354512.msv1.invalid:25');
        done();
      });
      socket.on('connect', () => {
        done(new Error('Exchange domain expected to be not found'));
      });
    });
  });

  it('should pass MX address with lowest priority number', (done) => {
    getExchange('gmail.com', (err, exchange) => {
      assert.ifError(err);
      assert.equal(exchange, 'gmail-smtp-in.l.google.com');
      done();
    });
  });
});
