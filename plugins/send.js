const { cmd } = require("../command");
const { getBuffer } = require("../lib/functions");
const fs = require("fs");

cmd(
  {
    pattern: "send",
    desc: "Send sample file to user",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, quoted, reply }) => {
    try {
      // Send initial status
      await robin.sendMessage(from, { text: "⚡ Preparing your file..." }, { quoted: mek });

      // File path in project (local file)
      const filePath = "./files/sample.pdf";

      if (!fs.existsSync(filePath)) {
        return reply("❌ File not found on server!");
      }

      // Send the file
      await robin.sendMessage(from, {
        document: fs.readFileSync(filePath),
        fileName: "sample.pdf",
        mimetype: "application/pdf",
      }, { quoted: mek });

      // Done message
      await robin.sendMessage(from, { text: "✅ File sent successfully!" }, { quoted: mek });

    } catch (err) {
      console.log(err);
      reply("❌ Failed to send the file, try again later.");
    }
  }
);
