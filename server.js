'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const config = require('./config.js');

const middleware = require('./lib/middleware.js');
const utils = require('./lib/utils.js');
const errorHandler = require('./lib/errorHandler.js');

const app = express();
app.enable("trust proxy"); //for proxying by eg. nginx in prod
app.set('x-powered-by', false);// this header is not needed

if (process.env.NODE_ENV !== 'production') {
  //enable cors because different ports in dev trigger preflight checks
  const cors = require('cors');
  app.use(cors());
// serve a demo contact form for testing/dev purposes
  app.get('/static/form', (req, res) => {
      res.sendFile(__dirname + '/public/index.html')
  })
};

const transporter = nodemailer.createTransport({
    service: config.service,
    auth: {
        user: config.auth.user,
        pass: config.auth.pass
    }
});

transporter.verify( (err, success) => {
  if (err)  {
    errorHandler.fatal(err);
  } else {
    console.log('Server is ready to accept messages')
  }
});

app.use(express.json());




const sendMail = (req,res,next) => {
  const contactMsg = {
    name: utils.text.sanitizeInput(req.body.name, 90),
    email: utils.text.sanitizeEmailAddr(req.body.email),
    text: utils.text.sanitizeInput(req.body.text)
  };
  const mailOptions = {
      to: config.mail.to,
      subject: `${config.mail.subject} ${contactMsg.name}`,
      from: config.mail.from,
      text: utils.text.buildText(contactMsg)
  };
  transporter.sendMail(mailOptions,  (err, info) => {
      if (err || info.rejected.length) {
          next( utils.buildError('sendmail') )
      } else {
          res.json({success: true});
      }
  })
};

const router = express.Router();
router.use(middleware.limiter);
router.use(middleware.verifyContentType);
router.use(middleware.verifyContactMsgObj);
router.use(middleware.antiSpam);
router.post('/send', sendMail);
router.use( (req,res,next) => {
  // returns 404 when no routes match. enables sending a json 404 response
  next( utils.buildError('not-found') )
});

app.use('/', router);

app.use( errorHandler.main );

const server = app.listen(config.port, config.host, () => {
  console.log(`Listening on ${config.host}:${config.port}`)
});
server.on('error', errorHandler.fatal);
