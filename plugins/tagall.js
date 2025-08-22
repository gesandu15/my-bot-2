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
      // Check if it's a group
      if (!isGroup) return reply("❌ මේ command එක group එකකට පමණයි.");

      // Only owner can run
      if (!isOwner) return reply("❌ මේ command එක owner පමණක් භාවිතා කරන්න පුළුවන්.");

      // Get group participants
      const participants = groupMetadata.participants;
      if (!participants || participants.length === 0)
        return reply("❌ Group එකේ members කිසිවක් නැහැ.");

      // Prepare mentions list
      const mentions = participants.map(p => p.id);

      // Prepare tag message
      let text = "📣 ඔක්කොම members tag කරන්න\n\n";
      mentions.forEach(id => {
        text += `@${id.split("@")[0]} `;
      });

      // Send message tagging all
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
