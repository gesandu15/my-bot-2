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
const axios = require("axios");
const qrcode = require("qrcode-terminal");
const config = require("./config");
const { sms, downloadMediaMessage } = require("./lib/msg");
const { getBuffer, getGroupAdmins } = require("./lib/functions");
const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

const ownerNumber = config.OWNER_NUM;

//===================SESSION-AUTH============================
const { File } = require("megajs");

async function downloadSession(sessId) {
    const filer = File.fromURL(`https://mega.nz/file/${sessId}`);
    return new Promise((resolve, reject) => {
        filer.download((err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    });
}

(async () => {
    if(!fs.existsSync(__dirname + "/auth_info_baileys/creds.json")) {
        if(!config.SESSION_ID) {
            console.log("Please add your session to SESSION_ID env !!");
            process.exit(1);
        }
        try {
            const data = await downloadSession(config.SESSION_ID);
            fs.writeFileSync(__dirname + "/auth_info_baileys/creds.json", data);
            console.log("Session downloaded ✅");
        } catch(err) {
            console.log("Session download error:", err);
            process.exit(1);
        }
    }
})();

//===================CONNECT TO WA============================
async function connectToWA() {
    // MongoDB connect
    const connectDB = require("./lib/mongodb");
    connectDB();

    const { readEnv } = require("./lib/database");
    const envConfig = await readEnv();
    const prefix = envConfig.PREFIX;

    console.log("Connecting M.R.Gesa...");

    const { state, saveCreds } = await useMultiFileAuthState(__dirname + "/auth_info_baileys/");
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: true,
        browser: Browsers.macOS("Firefox"),
        syncFullHistory: true,
        auth: state,
        version,
    });

    robin.ev.on("creds.update", saveCreds);

    robin.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === "close") {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if(connection === "open") {
            console.log("Installing plugins...");
            const path = require("path");
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if(path.extname(plugin).toLowerCase() === ".js") {
                    require("./plugins/" + plugin);
                }
            });
            console.log("M.R.Gesa installed successful ✅");
            console.log("M.R.Gesa connected to WhatsApp ✅");

            // Startup message to owner
            const msgOwner = "M.R.Gesa connected successfully ✅";
            const msgUser = "Hello, bot started successfully";

            robin.sendMessage(ownerNumber + "@s.whatsapp.net", {
                image: { url: "https://github.com/gesandu1111/ugjv/blob/main/Create%20a%20branding%20ba.png?raw=true" },
                caption: msgOwner,
            });
        }
    });

    //===================MESSAGE HANDLER============================
    robin.ev.on("messages.upsert", async (mek) => {
        mek = mek.messages[0];
        if(!mek.message) return;

        mek.message = getContentType(mek.message) === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;

        if(mek.key && mek.key.remoteJid === "status@broadcast") return;

        const m = sms(robin, mek);
        const type = getContentType(mek.message);
        const from = mek.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const sender = mek.key.fromMe ? robin.user.id.split(":")[0] + "@s.whatsapp.net" : mek.key.participant || mek.key.remoteJid;
        const senderNumber = sender.split("@")[0];
        const botNumber = robin.user.id.split(":")[0];
        const pushname = mek.pushName || "Unknown";
        const isOwner = config.OWNER_NUM.includes(senderNumber) || botNumber.includes(senderNumber);

        const reply = (text) => robin.sendMessage(from, { text }, { quoted: mek });

        // Command handling
        const body = type === "conversation" ? mek.message.conversation : "";
        if(body.startsWith(prefix)) {
            const command = body.slice(prefix.length).trim().split(" ")[0].toLowerCase();
            const args = body.slice(prefix.length).trim().split(" ").slice(1);

            if(command === "send") {
                // Example: send PDF from files folder
                const filePath = "./files/sample.pdf";
                if(fs.existsSync(filePath)) {
                    await robin.sendMessage(from, {
                        document: fs.readFileSync(filePath),
                        fileName: "sample.pdf",
                        mimetype: "application/pdf",
                    });
                    console.log("File sent ✅");
                } else {
                    reply("File not found!");
                }
            }

            if(command === "restart") {
                reply("Restarting bot...");
                process.exit(0); // PM2 will restart
            }
        }
    });

    //===================SEND FILE FROM URL FUNCTION============================
    robin.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let res = await axios.head(url);
        let mime = res.headers["content-type"];
        if(mime.split("/")[0] === "image") {
            return robin.sendMessage(jid, { image: await getBuffer(url), caption, ...options }, { quoted, ...options });
        }
        if(mime.split("/")[0] === "video") {
            return robin.sendMessage(jid, { video: await getBuffer(url), caption, mimetype: "video/mp4", ...options }, { quoted, ...options });
        }
        if(mime.split("/")[0] === "audio") {
            return robin.sendMessage(jid, { audio: await getBuffer(url), caption, mimetype: "audio/mpeg", ...options }, { quoted, ...options });
        }
        if(mime === "application/pdf") {
            return robin.sendMessage(jid, { document: await getBuffer(url), mimetype: "application/pdf", caption, ...options }, { quoted, ...options });
        }
    };
}

//===================EXPRESS SERVER============================
app.get("/", (req, res) => res.send("Hey, M.R.Gesa started ✅"));
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

//===================START BOT============================
setTimeout(() => {
    connectToWA();
}, 4000);
