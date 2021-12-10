const secrets = require('./secrets.js');

module.exports = {
  port: 8080,
  host: '127.0.0.1', //bind to loopback interface so node server is only available from localhost. This is so it can't be accessed directly from the internet, only through eg. nginx proxy on the same machine.
  service: 'fastmail', // check https://github.com/nodemailer/nodemailer/blob/master/lib/well-known/services.json for list of well-known services. If your desired service isnt there, you can manually set the smtp host/port/auth.
  auth: {
      user: secrets.user,
      pass: secrets.pass
  },
  mail: {
    to: secrets.to,
    from: secrets.user,
    cc: secrets.cc,
    subject: 'Website contact from:'// + name
  },
  middleware: {
    limiter: {
      //max requests/minutes per IP address.
      //rejected POST's count towards this limit
      minutes: 30,
      maxRequests: 10,
    },
    validReferers: [
      // allowed host request header values used by verifyHost middleware
      'https://waxshop.ca',
      'https://dev.waxshop.ca',
      //'http://localhost:8080' // for dev/testing
    ],
    requiredBodyFields: [
      // the post request body must be a JSON object that has the following properties
      'name',
      'email',
      'text'
    ]
  },
};
