const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function handleSendCommand(message, sock) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
        return sock.sendMessage(message.key.remoteJid, { text: "📌 Reply to a status message to download it." });
    }

    const type = getContentType(quoted);
    if (type !== 'imageMessage' && type !== 'videoMessage') {
        return sock.sendMessage(message.key.remoteJid, { text: "⚠️ Only image or video statuses can be downloaded." });
    }

    try {
        const buffer = await downloadMediaMessage(
            { message: quoted },
            'buffer',
            {},
            { logger: console }
        );

        const fileName = `status_${Date.now()}.${type === 'imageMessage' ? 'jpg' : 'mp4'}`;
        fs.writeFileSync(fileName, buffer);

        await sock.sendMessage(message.key.remoteJid, {
            document: buffer,
            mimetype: type === 'imageMessage' ? 'image/jpeg' : 'video/mp4',
            fileName: fileName
        });

    } catch (err) {
        console.error("Download error:", err);
        await sock.sendMessage(message.key.remoteJid, { text: "❌ Failed to download status." });
    }
}
