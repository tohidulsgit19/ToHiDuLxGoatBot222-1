const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "usgStore.json");
const DELETE_AFTER = 2 * 60 * 1000; // 2 minutes

// Ensure cache exists
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
}

function loadStore() {
  ensureCacheFile();
  return JSON.parse(fs.readFileSync(CACHE_FILE));
}

function saveStore(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "usg",
    version: "3.2",
    author: "Tohidul",
    shortDescription: "Log unsent messages within 2 minutes",
    category: "utility"
  },

  // Startup cleaner
  onStart: async function () {
    ensureCacheFile();
    setInterval(() => {
      const store = loadStore();
      let changed = false;
      for (const id in store) {
        if (Date.now() - store[id].time > DELETE_AFTER) {
          delete store[id];
          changed = true;
        }
      }
      if (changed) saveStore(store);
    }, 30000);
  },

  // Save all messages
  onChat: async function ({ event }) {
    if (event.type !== "message" || !event.messageID) return;
    const store = loadStore();
    store[event.messageID] = {
      senderID: event.senderID,
      threadID: event.threadID,
      body: event.body || null,
      attachments: event.attachments || [],
      time: Date.now()
    };
    saveStore(store);
  },

  // Detect unsend
  handleEvent: async function ({ api, event }) {
    const LOG_GROUP_ID = "9826242237455305"; // Change with your group ID
    if (event.type !== "message_unsend") return;

    const store = loadStore();
    const savedMsg = store[event.messageID];
    if (!savedMsg || Date.now() - savedMsg.time > DELETE_AFTER) return;

    const senderInfo = await api.getUserInfo(event.senderID);
    const senderName = senderInfo[event.senderID]?.name || "Unknown User";
    const threadInfo = await api.getThreadInfo(savedMsg.threadID);
    const threadName = threadInfo.threadName || "Private Chat";

    let reportMsg = `⚠️ 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱

👤 Sender: ${senderName} (${event.senderID})
💬 In: ${threadName}
📝 Message ID: ${event.messageID}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━\n`;

    const files = [];

    if (savedMsg.body) reportMsg += `📝 Content: ${savedMsg.body}\n`;
    if (savedMsg.attachments.length > 0) {
      reportMsg += `📎 Attachments: ${savedMsg.attachments.length} file(s)\n`;

      for (const att of savedMsg.attachments) {
        const url = att.url || att.previewUrl;
        if (url) {
          const ext = path.extname(url) || ".dat";
          const filePath = path.join(__dirname, "..", "cache", `usg_${Date.now()}${ext}`);
          try {
            const res = await axios.get(url, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, res.data);
            files.push(fs.createReadStream(filePath));
          } catch (e) {
            console.error("Download error:", e);
          }
        }
      }
    }

    api.sendMessage({ body: reportMsg, attachment: files }, LOG_GROUP_ID, () => {
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch {}
      });
    });

    delete store[event.messageID];
    saveStore(store);
  }
};
