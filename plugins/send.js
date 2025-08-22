const { cmd } = require("../command");
const { getBuffer } = require("../lib/functions");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

cmd(
  {
    pattern: "send",
    desc: "Send file automatically as reply",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, quoted, reply }) => {
    try {
      // Status message
      await robin.sendMessage(from, { text: "⚡ Preparing your file..." }, { quoted: mek });

      // File URL (replace with your actual file)
      const fileUrl = "https://example.com/test-file.zip";

      // Download file buffer
      const buffer = await getBuffer(fileUrl);

      // Optional: save locally
      const savePath = path.join(__dirname, "../files/test-file.zip");
      fs.writeFileSync(savePath, buffer);

      // Send file as reply
      await robin.sendMessage(from, {
        document: buffer,
        fileName: "test-file.zip",
        mimetype: "application/zip",
      }, { quoted: mek });

      // Done message
      await robin.sendMessage(from, { text: "✅ File sent successfully!" }, { quoted: mek });

    } catch (err) {
      console.log(err);
      reply("❌ Failed to send file. Try again later.");
    }
  }
);
