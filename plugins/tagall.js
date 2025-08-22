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
      const sender = mek.key.fromMe ? robin.user.id.split(":")[0] : mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const isOwner = Array.isArray(config.OWNER_NUM)
        ? config.OWNER_NUM.includes(senderNumber)
        : senderNumber === config.OWNER_NUM;

      if (!isOwner) return reply("❌ මේ command එක owner පමණක් භාවිතා කරන්න පුළුවන්.");

      // Fetch group metadata dynamically
      const group = await robin.groupMetadata(from);
      if (!group || !group.participants || group.participants.length === 0)
        return reply("❌ Group එකේ members කිසිවක් නැහැ.");

      // Create mentions
      const mentions = group.participants.map(p => p.id);

      // Compose message
      let text = "📣 ඔක්කොම members tag කරන්න\n\n";
      mentions.forEach(id => { text += `@${id.split("@")[0]} `; });

      // Send message as reply (admin not required)
      await robin.sendMessage(from, { text, mentions }, { quoted: mek });

    } catch (err) {
      console.error("❌ Tag all failed:", err);
      reply("❌ ඔක්කොම members tag කරන්න බැරි වුණා.");
    }
  }
);
