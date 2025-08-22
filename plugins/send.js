const { cmd } = require("../command");
const { getBuffer } = require("../lib/functions");
const fs = require("fs");

cmd(
  {
    pattern: "send", // change command name to `.send`
    desc: "Send a predefined file to user",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, quoted, reply }) => {
    try {
      // Send initial status
      await robin.sendMessage(from, { text: "⚡ Preparing file..." }, { quoted: mek });

      // File path in local project
      const filePath = "./files/sample.pdf"; // change to your file path
      if (!fs.existsSync(filePath)) return reply("❌ File not found!");

      // Send the file
      await robin.sendMessage(from, {
        document: fs.readFileSync(filePath),
        fileName: "sample.pdf", // rename as needed
        mimetype: "application/pdf",
      }, { quoted: mek });

      // Send completion status
      await robin.sendMessage(from, { text: "✅ File sent successfully!" }, { quoted: mek });

    } catch (err) {
      console.log(err);
      reply("❌ Failed to send file, try again later.");
    }
  }
);
