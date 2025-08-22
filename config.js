const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "jWB1gaSJ#Ow1BZvD0lGN3uV6_wyd2Hp8IJl43Nx8LIUX3dE2irTc",
  MONGODB: process.env.MONGODB || "mongodb://mongo:PTrRcvFLmSoHDgITTInweNsiaunZyHzP@turntable.proxy.rlwy.net:21003",
  OWNER_NUM: process.env.OWNER_NUM || "94784525290",
};
