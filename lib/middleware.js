const rateLimit = require('express-rate-limit');

const utils = require('../lib/utils.js');
const config = require('../config.js');
const errorHandler = require('../lib/errorHandler.js');

const notEmptyOrWhitespace = (str) => (typeof str === "string" && str.trim()) ? true : false;
// returns true if str is a string & is not 0-length or all whitespace

module.exports = {

  limiter: rateLimit({
    windowMs: config.middleware.limiter.minutes * 60 * 1000,
    max: config.middleware.limiter.maxRequests,
    handler: errorHandler.rateLimited
  }),

  verifyContentType: (req, res, next) => {
  // verify that the content type is json
    if (req.is('json')) {
      next()
    } else {
      next( utils.buildError('content-type') )
    }
  },

  verifyContactMsgObj: (req, res, next) => {
    const fields = config.middleware.requiredBodyFields
    // valid === true if each desired property name exists, is a string, and is not 0-length or exclusively whitespace
    const valid = fields.every( field =>
      (req.body.hasOwnProperty(field)
      && notEmptyOrWhitespace(req.body[field]))
    );
    if (valid) {
      next()
    } else {
      next( utils.buildError('contact-msg-obj') )
    }
  },

  verifyHost: (req, res, next) => {
    const validHosts = config.middleware.validHosts;
    const hostHeader = req.headers.host;
    const valid = validHosts.some(host => host === hostHeader);
    if (valid) {
      next()
    } else {
      next(utils.buildError('invalid-referer'))
    }
  }

};
