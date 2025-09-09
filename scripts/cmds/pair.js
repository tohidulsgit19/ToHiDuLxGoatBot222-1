const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair3",
    aliases: [],
    version: "1.1",
    author: "Rishad",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with someone randomly",
    longDescription: "",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    try {
      // Ensure cache folder exists
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // Get participants except bot and sender
      const { participantIDs } = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();
      const possiblePartners = participantIDs.filter(id => id !== senderID && id !== botID);

      if (possiblePartners.length === 0) {
        return api.sendMessage("No one else to pair with in this chat.", threadID, messageID);
      }

      // Pick random partner
      const partnerID = possiblePartners[Math.floor(Math.random() * possiblePartners.length)];

      // Get names safely
      const senderData = await usersData.get(senderID);
      const partnerData = await usersData.get(partnerID);
      const senderName = senderData?.name || "You";
      const partnerName = partnerData?.name || "Partner";

      // Prepare mentions
      const mentions = [
        { id: senderID, tag: senderName },
        { id: partnerID, tag: partnerName }
      ];

      // Random love percentage
      const lovePercent = Math.floor(Math.random() * 101);

      // Download all images in parallel
      const [avatar1Res, avatar2Res, gifLoveRes] = await Promise.all([
        axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${partnerID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, { responseType: "arraybuffer" }),
      ]);

      // Write files
      const pathAvatar1 = path.join(cacheDir, "avt.png");
      const pathAvatar2 = path.join(cacheDir, "avt2.png");
      const pathGifLove = path.join(cacheDir, "giflove.gif");

      await Promise.all([
        fs.writeFile(pathAvatar1, Buffer.from(avatar1Res.data)),
        fs.writeFile(pathAvatar2, Buffer.from(avatar2Res.data)),
        fs.writeFile(pathGifLove, Buffer.from(gifLoveRes.data))
      ]);

      // Prepare attachments
      const attachments = [
        fs.createReadStream(pathAvatar1),
        fs.createReadStream(pathGifLove),
        fs.createReadStream(pathAvatar2)
      ];

      // Send message
      await api.sendMessage({
        body: `🥰 Successful pairing! 💌 Wish you two a hundred years of happiness! 💕\nDouble ratio: ${lovePercent}%\n${senderName} 💓 ${partnerName}`,
        mentions,
        attachment: attachments
      }, threadID, () => {
        // Cleanup cache files after sending
        fs.unlink(pathAvatar1).catch(() => {});
        fs.unlink(pathAvatar2).catch(() => {});
        fs.unlink(pathGifLove).catch(() => {});
      }, messageID);

    } catch (error) {
      console.error("Error in pair3 command:", error);
      return api.sendMessage("❌ Something went wrong while pairing.", threadID, messageID);
    }
  }
};
