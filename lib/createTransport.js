const nodemailer = require("nodemailer");
const errorHandler = require("./errorHandler.js");
const config = require("../config.js");

const transportOptions = {
  service: config.service,
  auth: {
    user: config.auth.user,
    pass: config.auth.pass
  }
};

module.exports = async () => {
  try {
    const transporter = nodemailer.createTransport(transportOptions);
    await transporter.verify();
    console.log("Server is ready to accept messages");
    return transporter;
  } catch (error) {
    errorHandler.fatal(error);
  }
};
