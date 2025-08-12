const fs = require("fs-extra");
const axios = require("axios");

const messageStore = {}; // messageID -> { data }

module.exports = {
  config: {
    name: "usg",
    version: "1.1",
    author: "Tohidul",
    shortDescription: "Log all unsent messages",
    category: "Utility"
  },

  onStart: async function({ api }) {
    this.botID = api.getCurrentUserID();
  },

  onChat: async function({ api, event }) {
    const LOG_GROUP_ID = "9826242237455305"; // your log GC ID

    try {
      // Store messages with all info
      if (event.type === "message" && event.messageID) {
        messageStore[event.messageID] = {
          senderID: event.senderID,
          threadID: event.threadID,
          time: Date.now(),
          body: event.body || null,
          attachments: event.attachments || []
        };
      }

      // Handle unsend
      if (event.type === "message_unsend") {
        const botID = this.botID || api.getCurrentUserID();
        if (event.senderID === botID) return; // skip bot's own unsends

        const savedMsg = messageStore[event.messageID];
        const senderInfo = await api.getUserInfo(event.senderID);
        const senderName = senderInfo[event.senderID]?.name || "Unknown User";

        const threadInfo = await api.getThreadInfo(event.threadID);
        const threadName = threadInfo.threadName || "Private Chat";

        let reportMsg = `⚠️ 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱

👤 𝗦𝗲𝗻𝗱𝗲𝗿: ${senderName} (${event.senderID})
💬 𝗜𝗻: ${threadName}
📝 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗜𝗗: ${event.messageID}
⏰ 𝗧𝗶𝗺𝗲: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━\n`;

        const files = [];

        if (savedMsg) {
          if (savedMsg.body) {
            reportMsg += `📝 𝗖𝗼𝗻𝘁𝗲𝗻𝘁: ${savedMsg.body}\n`;
          }
          if (savedMsg.attachments.length > 0) {
            reportMsg += `📎 𝗔𝘁𝘁𝗮𝗰𝗵𝗺𝗲𝗻𝘁𝘀: ${savedMsg.attachments.length} file(s)\n`;

            for (const att of savedMsg.attachments) {
              const filePath = `/mnt/data/usg_${Date.now()}_${att.name || att.filename || "file"}`;
              const url = att.url || att.previewUrl || null;
              if (url) {
                const res = await axios.get(url, { responseType: "arraybuffer" });
                fs.writeFileSync(filePath, res.data);
                files.push(fs.createReadStream(filePath));
              }
            }
          }
        } else {
          reportMsg += `ℹ️ Content was deleted before I could log it.`;
        }

        api.sendMessage(
          { body: reportMsg, attachment: files },
          LOG_GROUP_ID
        );
      }
    } catch (err) {
      console.error("Unsend Logger Error:", err);
    }
  }
};
