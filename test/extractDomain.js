/* eslint-env mocha */

'use strict';

const assert = require('assert');
const extractDomain = require('../src/extractDomain');

describe('extractDomain', () => {
  it('should return domain part of an email address', () => {
    assert.equal(extractDomain('test@example.com'), 'example.com');
  });

  it('should return the last part', () => {
    assert.equal(extractDomain('test@example.com'), 'example.com');
  });
});
