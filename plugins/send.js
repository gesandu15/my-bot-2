const fs = require('fs');
const axios = require('axios');

module.exports = {
  command: ['.send'],
  description: 'ඡායාරූපයක් forward කරන්න',
  handler: async ({ sock, m }) => {
    const imageUrl = 'https://example.com/image.jpg'; // Replace with dynamic or static URL
    const caption = '✅ SUCCESS\n\n📸 Powered by GESANDU-MD';

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    await sock.sendMessage(m.key.remoteJid, {
      image: buffer,
      caption: caption
    }, { quoted: m });
  }
};
