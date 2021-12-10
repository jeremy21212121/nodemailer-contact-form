const {
  limiter,
  verifyReferer,
  verifyContentType,
  verifyContactMsgObj,
  // verifyToken, // disabled for now
} = require("./middleware.js");
const utils = require("./utils.js");
// const { getToken } = require("./controllers.js"); // disabled for now

const notFoundHandler = (req, res, next) => {
  next(utils.buildError("not-found"));
};

const createRouter = (express, sendMail) => {
  const router = express.Router();
  // general middleware
  router.use(limiter);
  router.use(verifyReferer);
  // router.use(verifyContentType);
  // /send endpoint
  router.use("/send", verifyContentType);
  router.use("/send", verifyContactMsgObj);
  // router.use("/send", verifyToken); // disabled for now
  router.post("/send", sendMail);
  // /token endpoint - partial impl. disabled for now.
  // router.post("/token", getToken);
  // router.post("/verify", verifyToken, async (req, res) => {
    // const valid = await verifyToken(req.body.token);
    // res.json({ valid:true });
  // });
  // enables sending a json 404 response
  router.use(notFoundHandler);
  return router;
};

module.exports = createRouter;
