const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports = {
  config: {
    name: "slap",
    version: "1.0",
    author: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    countDown: 5,
    role: 0,
    shortDescription: "Slap someone with image",
    longDescription: "Slap a tagged user using anime slap image",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    }
  },

  onStart: async function ({ api, event }) {
    const mention = Object.keys(event.mentions);
    const threadID = event.threadID;
    const messageID = event.messageID;

    // ✅ Boss Protection UIDs
    const PROTECTED_UIDS = ["100092006324917"]; // Add more if needed

    if (!mention.length) {
      return api.sendMessage("⚠️ Please tag someone to slap!", threadID, messageID);
    }

    const taggedUID = mention[0];
    const taggedName = event.mentions[taggedUID];

    // ✅ Boss Protection check
    if (PROTECTED_UIDS.includes(taggedUID)) {
      return api.sendMessage(
        ` 😿 Ai em cholly 😿\n oita amar abba 😗`,
        threadID,
        messageID
      );
    }

    try {
      const res = await axios.get("https://api.waifu.pics/sfw/slap");
      const imageUrl = res.data.url;
      const ext = path.extname(imageUrl);
      const filePath = path.join(__dirname, "cache", `slap${ext}`);

      // Download image
      const download = (url, dest, cb) => request(url).pipe(fs.createWriteStream(dest)).on("close", cb);
      download(imageUrl, filePath, () => {
        api.sendMessage(
          {
            body: `👋 Slapped! ${taggedName}\n\n*sorry, thought there's mosquito!*`,
            mentions: [{
              tag: taggedName,
              id: taggedUID
            }],
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => fs.unlinkSync(filePath),
          messageID
        );
        api.setMessageReaction("✅", messageID, () => {}, true);
      });
    } catch (err) {
      api.sendMessage("❌ Failed to slap. Please try again later.", threadID, messageID);
      api.setMessageReaction("😓", messageID, () => {}, true);
    }
  }
};
