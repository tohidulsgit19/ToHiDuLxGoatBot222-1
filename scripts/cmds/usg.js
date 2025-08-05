const messageStore = {}; // messageID -> content

module.exports = {
  config: {
    name: "usg",
    version: "1.0",
    author: "xnil6x",
    shortDescription: "Log unsent messages (excluding bot)",
    category: "Utility"
  },

  onStart: async function({ api }) {
    // Get bot ID for comparison
    this.botID = api.getCurrentUserID();
  },

  onChat: async function({ api, event }) {
    const LOG_GROUP_ID = "9826242237455305";

    try {
      // Save incoming messages (non-unsend)
      if (event.body && event.messageID) {
        messageStore[event.messageID] = {
          body: event.body,
          senderID: event.senderID,
          threadID: event.threadID,
          time: new Date()
        };
      }

      // Handle unsend
      if (event.type === "message_unsend") {
        const botID = this.botID || api.getCurrentUserID();

        // Skip logging if bot unsent the message
        if (event.senderID === botID) return;

        const savedMsg = messageStore[event.messageID];
        const senderInfo = await api.getUserInfo(event.senderID);
        const senderName = senderInfo[event.senderID]?.name || "Unknown User";

        const threadInfo = await api.getThreadInfo(event.threadID);
        const threadName = threadInfo.threadName || "Private Chat";

        let reportMsg = `⚠️ Message Unsend Detected

━━━━━━━━━━━━━━━━━━
👤 Sender: ${senderName} (${event.senderID})
💬 In: ${threadName}
📝 Message ID: ${event.messageID}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━\n`;

        if (savedMsg) {
          reportMsg += `🗑️ Deleted Content: ${savedMsg.body}`;
        } else {
          reportMsg += `ℹ️ Content was deleted before I could log it.`;
        }

        api.sendMessage(reportMsg, LOG_GROUP_ID);
      }
    } catch (error) {
      console.error("Unsend Logger Error:", error);
    }
  }
};
