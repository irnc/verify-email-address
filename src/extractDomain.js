'use strict';

function extractDomain(email) {
  return email.split('@').splice(-1)[0].toLowerCase();
}

module.exports = extractDomain;
