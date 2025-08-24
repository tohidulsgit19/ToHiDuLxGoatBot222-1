module.exports = {
  config: {
    name: "addbotids",
    version: "1.0",
    author: "Tohidul",
    countDown: 5,
    role: 1, // Admin only
    description: "Add pre-defined bot UIDs to this group",
    category: "admin",
    guide: "{pn} - Adds all pre-defined bots to current group"
  },

  onStart: async function({ api, event }) {
    // ✅ এখানে UIDs add করো যেগুলো তোমার bot join করবে
    const BOT_UIDS = [
      "100060204532",
      "2205416464646",
      "464682121491"
    ];

    try {
      await api.addUserToGroup(BOT_UIDS, event.threadID);
      return message.reply(`✅ Successfully added bots:\n${BOT_UIDS.join("\n")}`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to add bots. Make sure the UIDs are correct and the bot has permission to add users.");
    }
  }
};
