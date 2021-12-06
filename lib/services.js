const cache = require("./cache.js");

const verifyToken = async (token) => {
  let result = false;
  try {
    const metadata = await cache.getKey(token);
    const now = Date.now();
    if (
      metadata &&
      metadata.issued &&
      metadata.expires &&
      now > metadata.issued &&
      now < metadata.expires
    ) {
      result = true;
    }
  } catch (error) {
    //
  }
  return result;
};

module.exports = { verifyToken };
