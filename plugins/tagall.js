const { cmd } = require("../command");
const config = require("../config");

cmd(
  {
    pattern: "tagall",
    desc: "Tag all group members (Owner only, admin not required)",
    category: "group",
    filename: __filename,
  },
  async (robin, mek, m, { from, isGroup, reply }) => {
    try {
      if (!isGroup) return reply("❌ මේ command එක group එකකට පමණයි.");

      // Owner check
      const senderNumber = mek.key.fromMe
        ? robin.user.id.split(":")[0]
        : mek.key.participant || mek.key.remoteJid;
      const isOwner = Array.isArray(config.OWNER_NUM)
        ? config.OWNER_NUM.includes(senderNumber.split("@")[0])
        : senderNumber.split("@")[0] === config.OWNER_NUM;

      if (!isOwner) return reply("❌ මේ command එක owner පමණක් භාවිතා කරන්න පුළුවන්.");

      // Fetch group metadata dynamically
      const groupMetadata = await robin.groupMetadata(from);
      if (!groupMetadata || !groupMetadata.participants || groupMetadata.participants.length === 0)
        return reply("❌ Group එකේ members කිසිවක් නැහැ.");

      // Mentions list
      const mentions = groupMetadata.participants.map(p => p.id);

      // Prepare text
      let text = "📣 ඔක්කොම members tag කරන්න\n\n";
      mentions.forEach(id => { text += `@${id.split("@")[0]} `; });

      // Send message with mentions (works even if bot is not admin)
      await robin.sendMessage(from, { text, mentions }, { quoted: mek });

    } catch (e) {
      console.error("❌ Tag all failed:", e);
      reply("❌ ඔක්කොම members tag කරන්න බැරි වුණා.");
    }
  }
);
