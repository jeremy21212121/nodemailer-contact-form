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
      //rejected POST's count towards this limit (so if ie. the antispam middleware blocks the request, it still counts towards their limit)
      minutes: 30,
      maxRequests: 10,
    },
    validHosts: [
      // allowed host request header values used by verifyHost middleware
      'waxshop.ca',
      'dev.waxshop.ca',
      // 'localhost:8080'
    ],
    requiredBodyFields: [
      // the post request body must be an object that has the following properties
      'name',
      'email',
      'text'
    ]
  },
};
