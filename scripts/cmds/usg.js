const fs = require("fs-extra");
const axios = require("axios");

const messageStore = {}; // messageID -> saved data

module.exports = {
  config: {
    name: "usg",
    version: "2.0",
    author: "Tohidul",
    shortDescription: "Log all unsent messages",
    category: "Utility"
  },

  onStart: async function ({ api }) {
    this.botID = api.getCurrentUserID();
  },

  // Save incoming messages
  onChat: async function ({ event }) {
    if (event.type === "message" && event.messageID) {
      messageStore[event.messageID] = {
        senderID: event.senderID,
        threadID: event.threadID,
        body: event.body || null,
        attachments: event.attachments || [],
        time: Date.now()
      };
    }
  },

  // Detect unsend
  onEvent: async function ({ api, event }) {
    const LOG_GROUP_ID = "9826242237455305"; // Change to your GC ID

    try {
      if (event.type !== "message_unsend") return;

      const botID = this.botID || api.getCurrentUserID();
      if (event.senderID === botID) return; // Skip bot's own unsends

      const savedMsg = messageStore[event.messageID];
      const senderInfo = await api.getUserInfo(event.senderID);
      const senderName = senderInfo[event.senderID]?.name || "Unknown User";

      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "Private Chat";

      let reportMsg = `⚠️ 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱

👤 Sender: ${senderName} (${event.senderID})
💬 In: ${threadName}
📝 Message ID: ${event.messageID}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━\n`;

      const files = [];

      if (savedMsg) {
        if (savedMsg.body) {
          reportMsg += `📝 Content: ${savedMsg.body}\n`;
        }
        if (savedMsg.attachments.length > 0) {
          reportMsg += `📎 Attachments: ${savedMsg.attachments.length} file(s)\n`;

          for (const att of savedMsg.attachments) {
            const url = att.url || att.previewUrl || null;
            if (url) {
              const ext = att.name || att.filename || "file";
              const filePath = `/mnt/data/usg_${Date.now()}_${ext}`;
              const res = await axios.get(url, { responseType: "arraybuffer" });
              fs.writeFileSync(filePath, res.data);
              files.push(fs.createReadStream(filePath));
            }
          }
        }
      } else {
        reportMsg += `ℹ️ Content was deleted before I could log it.`;
      }

      api.sendMessage({ body: reportMsg, attachment: files }, LOG_GROUP_ID);

    } catch (err) {
      console.error("Unsend Logger Error:", err);
    }
  }
};
