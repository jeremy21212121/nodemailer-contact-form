const rateLimit = require('express-rate-limit');

const utils = require('../lib/utils.js');
const config = require('../config.js');
const errorHandler = require('../lib/errorHandler.js');
// const cache = require('./cache.js'); // disabled for now
// const tokenObjectKeys = ['issued', 'expires']; // disabled for now

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

  verifyReferer: (req, res, next) => {

    const validReferers = config.middleware.validReferers;
    const refererHeader = req.headers.referer;
    const valid = validReferers.some(referer => refererHeader.startsWith(referer));
    if (valid) {
      next()
    } else {
      next(utils.buildError('invalid-referer'))
    }
  },

  // verifyToken: async (req, res, next) => { // disabled for now
  //   try {
  //     const token = req.body.token || '';
  //     // will reject if key not found/expired
  //     const tokenObject = JSON.parse(await cache.getKey(token));
  //     // verify that the object has the required properties
  //     const tokenKeysValid = tokenObjectKeys.every(key => tokenObject.hasOwnProperty(key));
  //     // the value passed to next()
  //     let nextParam = undefined;
  //     if (tokenKeysValid) {
  //       const { issued, expires } = tokenObject;
  //       const now = Date.now();
  //       const isValid = issued < now && expires > now;
  //       if (!isValid) {
  //         nextParam = utils.buildError('invalid-token');
  //       }
  //     } else {
  //       nextParam = utils.buildError('invalid-token');
  //     }
  //     next(nextParam);
  //   } catch (error) {
  //     console.log();
  //     next(utils.buildError('invalid-token'));
  //   }
  // }

};
