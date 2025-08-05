module.exports = {
  config: {
    name: "clown",
    aliases: ["clown"],
    version: "1.1",
    author: "Tohidul",
    shortDescription: "Add a clown face effect on someone’s avatar",
    longDescription: "Fetches a user avatar and applies a ‘clown’ filter using PopCat API",
    category: "fun",
    guide: "{pn} @mention or reply"
  },

  async onStart({ api, event, usersData }) {
    try {
      const mention = Object.keys(event.mentions);
      let targetId;

      if (mention.length > 0) {
        targetId = mention[0];
      } else if (event.type === "message_reply") {
        targetId = event.messageReply.senderID;
      } else {
        return api.sendMessage("❌ Please mention someone or reply to their message.", event.threadID, event.messageID);
      }

      const avatarURL = await usersData.getAvatarUrl(targetId);
      const gifURL = `https://api.popcat.xyz/clown?image=${encodeURIComponent(avatarURL)}`;

      const response = await global.utils.getStreamFromURL(gifURL);

      api.sendMessage(
        {
          body: "Haha 🤡",
          attachment: response
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error("Error in clown command:", err);
      api.sendMessage("⚠️ Something went wrong. Please try again.", event.threadID, event.messageID);
    }
  }
};
