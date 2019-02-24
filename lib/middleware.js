const rateLimit = require('express-rate-limit');

const utils = require('../lib/utils.js');
const config = require('../config.js');
const errorHandler = require('../lib/errorHandler.js');

const notEmptyOrWhitespace = (str) => (typeof str === "string" && str.trim()) ? true : false;
// returns true if str is a string & is not 0-length or all whitespace

const fields = ['name','email','text'];
// required fields

module.exports = {

  limiter: rateLimit({
    windowMs: config.limiter.minutes * 60 * 1000,
    max: config.limiter.maxRequests,
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
    const valid = fields.every( field =>
// valid === true if each desired property name exists, is a string, and is not 0-length or exclusively whitespace      
      req.body.hasOwnProperty(field)
      && notEmptyOrWhitespace(req.body[field])
    );
    if (valid) {
      next()
    } else {
      next( utils.buildError('contact-msg-obj') )
    }
  },

  antiSpam: (req, res, next) => {
    //abuse deterrent: if hidden form field is sent, immediately reject the message as it is likely a spambot
    if (req.body.phone) {
      next( utils.buildError('spam') )
    } else {
      next()
    }
  }

};
