const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "chad",
    aliases: ["gigachad"],
    version: "2.1",
    author: "MILAN (Canvas Rewrite by Shamsuzzaman)",
    countDown: 5,
    role: 0,
    shortDescription: "Tag someone to put their face on Giga Chad's body",
    longDescription: "Generates a meme where tagged user's face replaces Giga Chad's head",
    category: "image",
    guide: {
      en: "{pn} @tag",
    },
  },

  onStart: async function ({ event, message }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("⚠️ Please mention someone.");

    const uid = mention[0];
    const imgPath = await generateChad(uid);

    return message.reply({
      body: "😎 Giga Chad face uploaded!",
      attachment: fs.createReadStream(imgPath),
    });
  },
};

async function generateChad(uid) {
  const bgURL = "https://i.postimg.cc/5y4vNVG9/desktop-wallpaper-giga-chad-ideas-chad-memes-muscle-men-thumbnail.jpg";
  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const [bgImg, avatar] = await Promise.all([
    loadImage(bgURL),
    loadImage(avatarURL)
  ]);

  const canvas = createCanvas(1080, 1350);
  const ctx = canvas.getContext("2d");

  // Draw the background image
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Replace Chad's face with tagged user's avatar
  // 🔍 Fine-tuned face position based on background
  const faceX = 500;  // Adjust X coordinate
  const faceY = 160;  // Adjust Y coordinate
  const faceSize = 210;

  drawCircularImage(ctx, avatar, faceX, faceY, faceSize / 2);

  // Save output
  const outPath = path.join(__dirname, "cache/chad_result.png");
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}

function drawCircularImage(ctx, image, x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, radius * 2, radius * 2);
  ctx.restore();
}
