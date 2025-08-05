const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "kiss",
    version: "1.0",
    author: "you",
    countDown: 5,
    role: 0,
    shortDescription: "Send a kiss image to someone",
    category: "image",
    guide: {
      en: "{pn} @tag",
    },
  },

  onStart: async function ({ api, event, message, args }) {
    try {
      const mentions = event.mentions;
      if (!mentions || Object.keys(mentions).length === 0)
        return message.reply("Please tag someone to send kiss image.");

      const senderID = event.senderID;
      const taggedID = Object.keys(mentions)[0];

      // Fetch avatar URLs
      const avatarSender = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatarTagged = `https://graph.facebook.com/${taggedID}/picture?width=512&height=512`;

      // Use some public API for kiss image generation or fallback image generation:
      // Here example using nekobot API for kiss gif
      const apiURL = `https://nekos.life/api/v2/img/kiss`;

      const res = await axios.get(apiURL);
      const imageUrl = res.data.url;

      // Download image buffer
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(imageResponse.data, "binary");

      // Save temporary file
      const pathSave = `${__dirname}/tmp/kiss_${senderID}_${taggedID}.gif`;
      await fs.writeFile(pathSave, buffer);

      // Compose message
      const bodyMessage = `💋 ${mentions[taggedID]} you got a kiss from ${mentions[senderID] || "someone"}!`;

      // Send message with attachment
      await message.reply({
        body: bodyMessage,
        attachment: fs.createReadStream(pathSave),
      });

      // Clean up temp file
      await fs.unlink(pathSave);
    } catch (error) {
      console.error(error);
      return message.reply("Oops! Something went wrong while sending the kiss.");
    }
  },
};
