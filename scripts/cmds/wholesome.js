const axios = require("axios");
const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "wholesome",
    aliases: ["ws"],
    version: "1.0",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "wholesome",
    longDescription: "wholesome avatar for crush/lover",
    category: "fun",
    guide: ""
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) {
      return message.reply("You must mention someone!");
    }

    const userId = mention[0];

    try {
      const imagePath = await createWholesomeImage(userId);
      await message.reply({
        body: "「 Is that true? 🥰❤️ 」",
        attachment: fs.createReadStream(imagePath),
      });
      fs.unlinkSync(imagePath); // Delete temp file after sending
    } catch (error) {
      console.error("Error in wholesome command:", error);
      await message.reply("An error occurred while creating the image.");
    }
  }
};

async function getAvatar(userId) {
  // Fetch user profile pic as buffer
  const url = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return await loadImage(response.data);
}

async function createWholesomeImage(userId) {
  // Load background from URL directly
  const bgUrl = "https://i.postimg.cc/LsM8qdLf/Bn-Wi-VXT-Imgur.jpg";
  const bgResponse = await axios.get(bgUrl, { responseType: "arraybuffer" });
  const background = await loadImage(bgResponse.data);

  // Load user avatar
  const avatar = await getAvatar(userId);

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Draw circular avatar
  const avatarSize = 225;
  const avatarX = 110;
  const avatarY = 275;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Save to file
  const outputPath = path.join(__dirname, "wholesome.png");
  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}
