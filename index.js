// Required modules
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

// Express server
app.get("/", (req, res) => res.send("M.R.Gesa bot started ✅"));
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));

// Session download if not exist
async function downloadSession() {
  if (!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
    if (!config.SESSION_ID) return console.log("Please add your SESSION_ID in config!");
    const filer = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);
    const data = await new Promise((resolve, reject) => {
      filer.download((err, buffer) => (err ? reject(err) : resolve(buffer)));
    });
    fs.writeFileSync(__dirname + "/auth_info_baileys/creds.json", Buffer.from(data));
    console.log("Session downloaded ✅");
  }
}

// Main connect function
async function connectToWA() {
  try {
    await downloadSession();

    const connectDB = require("./lib/mongodb");
    connectDB();

    const { readEnv } = require("./lib/database");
    const dbConfig = await readEnv();
    const prefix = dbConfig.PREFIX || ".";

    const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/auth_info_baileys/");
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
      logger: P({ level: "silent" }),
      printQRInTerminal: true, // temporarily true for QR scan if needed
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version,
    });

    // Plugins loader
    const pluginsPath = path.join(__dirname, "plugins");
    if (fs.existsSync(pluginsPath)) {
      fs.readdirSync(pluginsPath).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require(path.join(pluginsPath, plugin));
        }
      });
      console.log("✅ All plugins loaded successfully.");
    }

    robin.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          console.log("Reconnecting in 5s...");
          setTimeout(connectToWA, 5000);
        } else {
          console.log("Logged out from WhatsApp");
        }
      } else if (connection === "open") {
        console.log("M.R.Gesa connected to WhatsApp ✅");
      }
    });

    robin.ev.on("creds.update", saveCreds);

    // Message handler
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
      const botNumber2 = await jidNormalizedUser(robin.user.id);
      const groupMetadata = isGroup ? await robin.groupMetadata(from).catch(() => {}) : "";
      const groupAdmins = isGroup ? await getGroupAdmins(groupMetadata.participants) : [];
      const reply = (text) => robin.sendMessage(from, { text }, { quoted: mek });
      const isOwner = ownerNumber.includes(senderNumber);

      if (!isCmd) return;

      // Command loader
      const events = require("./command");
      const cmdObj = events.commands.find((c) => c.pattern === command) ||
                     events.commands.find((c) => c.alias?.includes(command));
      if (cmdObj) {
        try {
          cmdObj.function(robin, mek, m, {
            from, body, isCmd, command, args, q, isGroup, sender,
            senderNumber, botNumber2, pushname: mek.pushName || "Unknown", isOwner,
            groupMetadata, groupAdmins, reply,
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    });
  } catch (err) {
    console.error("[WA CONNECT ERROR]", err);
    setTimeout(connectToWA, 5000);
  }
}

connectToWA();
