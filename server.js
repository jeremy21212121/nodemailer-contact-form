"use strict";

const main = async () => {
  const express = require("express");
  const config = require("./config.js");
  const createTransport = require("./lib/createTransport.js");
  const errorHandler = require("./lib/errorHandler.js");

  const app = express();
  // for proxying by eg. nginx in prod
  app.enable("trust proxy");
  // express doesn't need us to advertise for them
  app.set("x-powered-by", false);
  //enable cors to support cross-domain requests
  const cors = require("cors");
  app.use(cors());
  app.use(express.json());

  // serve a demo contact form for testing/dev purposes
  if (process.env.NODE_ENV !== "production") {
    app.get("/static/form", (req, res) => {
      res.sendFile(__dirname + "/public/index.html");
    });
  }

  // creates and verfies the transporter
  const transporter = await createTransport();
  // creates a sendMail controller using the above transporter
  const sendMail = require("./lib/controllers.js").sendMail(transporter);
  const router = require("./lib/router.js")(express, sendMail);

  app.use("/v2", router);
  app.use(errorHandler.main);

  const server = app.listen(config.port, config.host, () => {
    console.log(`Listening on ${config.host}:${config.port}`);
  });
  server.on("error", errorHandler.fatal);
};

main();
