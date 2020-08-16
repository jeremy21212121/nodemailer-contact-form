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
//the dumbest bots dont execute javascript. These will send the POST with url-encoded data instead of JSON (see public/index.html). So this will prevent a really dumb bot from sending me an email.
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

  verifyReferer: (req, res, next) => {
    const validReferers = config.middleware.validReferers;
    const refererHeader = req.headers('Referer');
    const valid = validReferers.some(refr => refr === refererHeader);
    if (valid) {
      next()
    } else {
      next(utils.buildError('invalid-referer'))
    }
  }

};
