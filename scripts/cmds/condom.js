const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "condom",
    aliases: ["condom"],
    version: "2.0",
    author: "Tohidul",
    countDown: 5,
    role: 3,
    shortDescription: "Make fun of tagged users",
    longDescription: "Create a condom meme with the tagged user's avatar using Canvas",
    category: "fun",
    guide: ""
  },

  onStart: async function ({ event, message }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) {
      return message.reply("❗ Please tag someone to use this command.");
    }

    const targetID = mention[0];
    try {
      const imagePath = await createCondomMeme(targetID);
      await message.reply({
        body: "🍌 Oops! Condom Fail Detected! 😆",
        attachment: fs.createReadStream(imagePath)
      });

      // Auto-delete after send
      setTimeout(() => fs.unlinkSync(imagePath), 60 * 1000); // 1 minute

    } catch (err) {
      console.error("Canvas Error:", err);
      message.reply("❌ Couldn't generate the meme. Something went wrong.");
    }
  }
};

async function createCondomMeme(uid) {
  const width = 512;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load template
  const templateURL = "https://i.imgur.com/cLEixM0.jpg";
  const templateImg = await loadImage(templateURL);
  ctx.drawImage(templateImg, 0, 0, width, height);

  // Load avatar
  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const avatarImg = await loadImage(avatarURL);
  ctx.drawImage(avatarImg, 256, 258, 263, 263); // Adjust position/size as needed

  // Save image
  const outputPath = path.join(__dirname, `condom_${uid}.png`);
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  // Wait for stream to finish
  await new Promise(resolve => out.on("finish", resolve));
  return outputPath;
}
