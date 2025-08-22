const { cmd } = require("../command");
const { getBuffer } = require("../lib/functions"); // make sure you have getBuffer implemented
const axios = require("axios");

cmd(
  {
    pattern: "send",
    desc: "Send file/image with status messages",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, reply }) => {
    try {
      // 1️⃣ Send initial status
      await robin.sendMessage(from, { text: "⚡ Download starting..." }, { quoted: mek });

      // 2️⃣ File URL
      const fileUrl = "https://example.com/image.jpg"; // replace with your file/image URL

      // 3️⃣ Download file buffer
      const buffer = await getBuffer(fileUrl); // or use axios to get arraybuffer

      // 4️⃣ Send file as reply
      await robin.sendMessage(from, {
        image: buffer,
        caption: "✅ Download complete!",
      }, { quoted: mek });

      // Optional: final status message (if separate)
      // await robin.sendMessage(from, { text: "✅ Download completed successfully!" }, { quoted: mek });

    } catch (err) {
      console.error(err);
      reply("❌ Download failed, try again later.");
    }
  }
);
