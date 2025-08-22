const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const P = require("pino");
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 8000;
const config = require("./config");
const { sms } = require("./lib/msg");
const { getGroupAdmins } = require("./lib/functions");
const { File } = require("megajs");

const ownerNumber = Array.isArray(config.OWNER_NUM) ? config.OWNER_NUM : [config.OWNER_NUM];

// 🔐 Session Auth via Mega.nz
if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
  if (!config.SESSION_ID) return console.log("Please add your session to SESSION_ID env !!");
  const sessdata = config.SESSION_ID;
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
  filer.download((err, data) => {
    if (err) throw err;
    fs.writeFileSync(__dirname + "/auth_info_baileys/creds.json", Buffer.from(data));
    console.log("Session downloaded ✅");
  });
}

// 🌐 Express Server
app.get("/", (req, res) => {
  res.send("M.R.Gesa bot started ✅");
});
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

// 🤖 WhatsApp Bot Connection
async function connectToWA() {
  try {
    const connectDB = require("./lib/mongodb");
    connectDB();

    const { readEnv } = require("./lib/database");
    const dbConfig = await readEnv();
    const prefix = dbConfig.PREFIX || ".";

    console.log("Connecting M.R.Gesa ❤️");
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/auth_info_baileys/");
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
      logger: P({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version,
    });

    // Plugins loader
    robin.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          console.log("Reconnecting in 5s...");
          setTimeout(connectToWA, 5000);
        }
      } else if (connection === "open") {
        console.log("Installing plugins...");
        fs.readdirSync("./plugins/").forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() === ".js") {
            require("./plugins/" + plugin);
          }
        });
        console.log("M.R.Gesa installed successful ✅");
      }
    });

    robin.ev.on("creds.update", saveCreds);

    robin.ev.on("messages.upsert", async (mek) => {
      mek = mek.messages[0];
      if (!mek.message) return;
      mek.message = getContentType(mek.message) === "ephemeralMessage"
        ? mek.message.ephemeralMessage.message
        : mek.message;
      if (mek.key?.remoteJid === "status@broadcast") return;

      const m = sms(robin, mek);
      const type = getContentType(mek.message);
      const body =
        type === "conversation" ? mek.message.conversation :
        type === "extendedTextMessage" ? mek.message.extendedTextMessage.text :
        type === "imageMessage" && mek.message.imageMessage.caption ? mek.message.imageMessage.caption :
        type === "videoMessage" && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : "";

      const isCmd = body.startsWith(prefix);
      const command = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");
      const from = mek.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = mek.key.fromMe ? robin.user.id.split(":")[0] + "@s.whatsapp.net" : mek.key.participant || from;
      const senderNumber = sender.split("@")[0];
      const botNumber = robin.user.id.split(":")[0];
      const pushname = mek.pushName || "Sin Nombre";
      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const botNumber2 = await jidNormalizedUser(robin.user.id);
      const groupMetadata = isGroup ? await robin.groupMetadata(from).catch(() => {}) : "";
      const groupAdmins = isGroup ? await getGroupAdmins(groupMetadata.participants) : [];
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
      const reply = (teks) => robin.sendMessage(from, { text: teks }, { quoted: mek });

      if (!isOwner && config.MODE === "private") return;
      if (!isOwner && isGroup && config.MODE === "inbox") return;
      if (!isOwner && !isGroup && config.MODE === "groups") return;

      // Load commands from plugins
      const events = require("./command");
      if (isCmd) {
        const cmd = events.commands.find((cmd) => cmd.pattern === command) ||
                    events.commands.find((cmd) => cmd.alias?.includes(command));
        if (cmd) {
          if (cmd.react) robin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
          try {
            cmd.function(robin, mek, m, {
              from, body, isCmd, command, args, q, isGroup, sender,
              senderNumber, botNumber2, botNumber, pushname, isMe,
              isOwner, groupMetadata, groupAdmins, isBotAdmins, isAdmins, reply,
            });
          } catch (e) {
            console.error("[PLUGIN ERROR] " + e);
          }
        }
      }
    });

  } catch (err) {
    console.error("[WA CONNECT ERROR] ", err);
    setTimeout(connectToWA, 5000);
  }
}

setTimeout(() => {
  connectToWA();
}, 4000);
