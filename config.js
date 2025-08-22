const fs = require("fs");
const path = require("path");

// Load environment variables if config.env exists
const envPath = path.join(__dirname, "config.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

/**
 * Converts a string to boolean.
 * @param {string} text 
 * @param {string} fault 
 * @returns {boolean}
 */
function convertToBool(text, fault = "true") {
  return text === fault;
}

module.exports = {
  SESSION_ID: process.env.SESSION_ID || "jWB1gaSJ#Ow1BZvD0lGN3uV6_wyd2Hp8IJl43Nx8LIUX3dE2irTc",
  MONGODB: process.env.MONGODB || "mongodb://mongo:PTrRcvFLmSoHDgITTInweNsiaunZyHzP@turntable.proxy.rlwy.net:21003",
  OWNER_NUM: process.env.OWNER_NUM || "94784525290",
  DEBUG: convertToBool(process.env.DEBUG, "true"), // Optional debug flag
};
