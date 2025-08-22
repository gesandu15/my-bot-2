const { cmd } = require("../command");
const { getBuffer } = require("../lib/functions");
const fs = require("fs");

cmd(
  {
    pattern: "startas",
    desc: "Download startas file and send status",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, quoted, reply }) => {
    try {
      // Send initial text status
      await robin.sendMessage(from, { text: "⚡ Starting download..." }, { quoted: mek });

      // File URL
      const fileUrl = "https://example.com/startas-file.zip"; // replace with actual file URL

      // Send file with caption
      await robin.sendFileUrl(from, fileUrl, "📥 Here is your startas download ✅", mek);

      // Optional: send done text
      await robin.sendMessage(from, { text: "✅ Download complete!" }, { quoted: mek });
    } catch (err) {
      console.log(err);
      reply("❌ Download failed, try again later.");
    }
  }
);
