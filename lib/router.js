const middleware = require('./middleware.js');
const utils = require('./utils.js');

const createRouter = (express, sendMail) => {
  const router = express.Router();
  router.use(middleware.limiter);
  router.use(middleware.verifyHost);
  router.use(middleware.verifyContentType);
  router.use(middleware.verifyContactMsgObj);
  router.post('/send', sendMail);
  router.use( (req,res,next) => {
    // returns 404 when no routes match. enables sending a json 404 response
    next( utils.buildError('not-found') )
  });
  return router;
}

module.exports = createRouter;
