const { cmd } = require("../command");

cmd(
  {
    pattern: "tagall",
    desc: "Tag all group members",
    category: "group",
    filename: __filename,
  },
  async (robin, mek, m, { from, isGroup, groupMetadata, isOwner, reply }) => {
    try {
      if (!isGroup) return reply("❌ මේ command එක group එකකට පමණයි.");
      if (!isOwner) return reply("❌ මේ command එක owner පමණක් භාවිතා කරන්න පුළුවන්.");

      const participants = groupMetadata.participants;
      if (!participants || participants.length === 0)
        return reply("❌ Group එකේ members කිසිවක් නැහැ.");

      // Mentions list
      const mentions = participants.map(p => p.id);

      // Tag text
      let text = "📣 ඔක්කොම members tag කරන්න\n\n";
      mentions.forEach(id => {
        text += `@${id.split("@")[0]} `;
      });

      await robin.sendMessage(
        from,
        {
          text,
          mentions,
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error("❌ Tag all failed:", e);
      reply("❌ ඔක්කොම members tag කරන්න බැරි වුණා.");
    }
  }
);
