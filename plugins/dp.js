module.exports = {
  command: ['.dp'],
  description: 'Bot DP එක update කරන්න',
  handler: async ({ sock, m }) => {
    const quoted = m.quoted;
    if (!quoted || !quoted.imageMessage) {
      await sock.sendMessage(m.key.remoteJid, {
        text: '📸 කරුණාකර image එකක් reply කරලා `.dp` කියන්න.'
      }, { quoted: m });
      return;
    }

    const buffer = await sock.downloadMediaMessage(quoted);

    await sock.updateProfilePicture(sock.user.id, buffer);

    await sock.sendMessage(m.key.remoteJid, {
      text: '✅ Bot DP update වුනා! 🔰 Powered by GESANDU-MD'
    }, { quoted: m });

    console.log(`
╭━━━┳━━━┳━━━┳━━━╮
┃╭━╮┃╭━╮┃╭━╮┃╭━╮┃
┃┃╱╰┫┃╱┃┃┃╱╰┫╰━╯┃
┃┃╭━┫┃╱┃┃┃╭━┫╭╮╭╯
┃╰┻━┃╰━╯┃╰┻━┃┃┃╰╮
╰━━━┻━━━┻━━━┻╯╰━╯
📸 DP UPDATED — GESANDU-MD
`);
  }
};
