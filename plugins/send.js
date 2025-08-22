const { cmd } = require("../command");

cmd(
  {
    pattern: "send",
    desc: "Upload image/video with caption to WhatsApp status",
    category: "main",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    { from, args, q, reply, quoted }
  ) => {
    try {
      if (!q && !quoted) {
        return reply("📌 Please reply to an image/video or give me text with .send");
      }

      let caption = q ? q : "🚀 M.R.Gesa Bot Status"; // default caption

      if (quoted && quoted.message.imageMessage) {
        // If user replied to an image
        let buffer = await mek.download();
        await robin.sendMessage("status@broadcast", {
          image: buffer,
          caption: caption,
        });
        return reply("✅ Image uploaded to status!");
      } else if (quoted && quoted.message.videoMessage) {
        // If user replied to a video
        let buffer = await mek.download();
        await robin.sendMessage("status@broadcast", {
          video: buffer,
          caption: caption,
        });
        return reply("✅ Video uploaded to status!");
      } else {
        // Only text to status
        await robin.sendMessage("status@broadcast", {
          text: caption,
        });
        return reply("✅ Text status uploaded!");
      }
    } catch (e) {
      console.log(e);
      reply("❌ Error: " + e);
    }
  }
);
