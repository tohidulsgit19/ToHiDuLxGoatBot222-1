const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "gay",
    version: "1.0",
    author: "@tas33n",
    countDown: 1,
    role: 3,
    shortDescription: "Find the gay in the group",
    longDescription: "",
    category: "box chat",
    guide: "{pn}",
    envConfig: {
      deltaNext: 5
    }
  },

  langs: {
    en: {
      noTag: "You must tag the person you want to call gay"
    }
  },

  onStart: async function ({ event, message, usersData, args, api }) {
    const adminUIDs = ["100092006324917"]; // Protect boss

    let uid;

    const mention = Object.keys(event.mentions);
    if (mention[0]) {
      uid = mention[0];
    } else if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);

        // 🛑 Fallback if participantIDs is missing
        const participants = threadInfo?.participantIDs || [];

        if (!participants.length) {
          return message.reply("❌ Could not fetch group members!");
        }

        const botID = api.getCurrentUserID();

        const eligibleUsers = participants.filter(id =>
          !adminUIDs.includes(id) &&
          id !== botID &&
          id !== event.senderID
        );

        if (!eligibleUsers.length) {
          return message.reply("❌ No eligible users found in this group!");
        }

        uid = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];

      } catch (err) {
        console.error("❌ Error getting thread info:", err);
        return message.reply("❌ Error getting group members!");
      }
    }

    if (adminUIDs.includes(uid)) {
      return message.reply("❌ Boss er sathe gaddari korte parbo na 🥺🥱!");
    }

    try {
      const url = await usersData.getAvatarUrl(uid);
      const image = await new DIG.Gay().getImage(url);

      const path = `${__dirname}/tmp/gay_${uid}.png`;
      fs.writeFileSync(path, Buffer.from(image));

      const userInfo = await usersData.get(uid);
      const userName = userInfo?.name || "Unknown";

      const body = `🏳️‍🌈 Look... I found a gay! 🏳️‍🌈`;

      message.reply({
        body,
        attachment: fs.createReadStream(path),
        mentions: [{ tag: userName, id: uid }]
      }, () => fs.unlinkSync(path));

    } catch (err) {
      console.error("❌ Error in gay command:", err);
      message.reply("❌ Couldn't generate gay image!");
    }
  }
};
