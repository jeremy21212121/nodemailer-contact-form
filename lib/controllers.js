// const { v4: uuidv4 } = require('uuid'); // disabled for now

const config = require('../config.js');
const utils = require('./utils.js');
// const cache = require('./cache.js'); // disabled for now

module.exports = {
  sendMail: (transporter) => 
    (req,res,next) => {
      const contactMsg = {
        name: utils.text.sanitizeInput(req.body.name, 100),
        email: utils.text.sanitizeEmailAddr(req.body.email),
        text: utils.text.sanitizeInput(req.body.text)
      };
      const mailOptions = {
          to: config.mail.to,
          cc: config.mail.cc,
          subject: `${config.mail.subject} ${contactMsg.name}`,
          from: config.mail.from,
          replyTo: contactMsg.email,
          text: utils.text.buildText(contactMsg)
          // we specifically omit an html property, opting to send plain text email.
          // utils.text.sanitizeInput also throughly breaks any html tags in the message,
          // so even if the message is somehow interpreted as html by a client, it will not be valid.
          // so eg. malicious links, tracking pixels won't be effective.
      };
      transporter.sendMail(mailOptions,  (err, info) => {
          if (
            err ||
            (
              info.rejected.length
              // nodemailer-mock returns both, so this prevents failure during dev/testing
              && (process.env.NODE_ENV === 'production' || !info.accepted.length)
            )
          ) {
              next( utils.buildError('sendmail') );
          } else {
              res.json({
                success: true,
                message: process.env.NODE_ENV === 'production' ? 'Message sent' : info.response
              });
          }
      })
    },
  // disabled for now - i think this works though :D
  // getToken: async (req, res, next) => {
  //   const token = uuidv4();
  //   const now = Date.now();
  //   const metadata = { issued: now, expires: now + (3600*1000) };
  //   try {
  //     await cache.addKey(token, JSON.stringify(metadata));
  //     res.json({ success: true, token: token, expires: metadata.expires });
  //   } catch (error) {
  //     // addKey failed, likely because the key already exists. This should not be possible.
  //     next( utils.buildError('token-collision') )
  //   }
  // }

};