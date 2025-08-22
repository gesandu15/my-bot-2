const fs = require("fs");
if (fs.existsSync("config.env"))
  require("dotenv").config({ path: "./config.env" });

function convertToBool(text, fault = "true") {
  return text === fault ? true : false;
}
module.exports = {
  SESSION_ID: process.env.SESSION_ID || "WLwRUTTa#Bl8cDN2IFX3hIqmv-y_Ps3sfDPjBvmGyuwsYEmT89Dg",
  MONGODB: process.env.MONGODB || "mongodb://mongo:PTrRcvFLmSoHDgITTInweNsiaunZyHzP@turntable.proxy.rlwy.net:21003",
  OWNER_NUM: process.env.OWNER_NUM || "94784525290",
};
