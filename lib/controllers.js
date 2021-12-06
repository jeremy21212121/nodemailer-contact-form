const config = require('../config.js');
const utils = require('./utils.js');

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
          if (err || info.rejected.length) {
              next( utils.buildError('sendmail') )
          } else {
              res.json({success: true});
          }
      })
    }
  
}