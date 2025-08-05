const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "sed",
    aliases: ["fun"],
    version: "2.0",
    author: "Tohidul",
    countDown: 5,
    role: 2,
    shortDescription: "Make a funny sed image",
    longDescription: "Generates a fun image with two Facebook avatars",
    category: "fun",
    guide: "{pn} @mention"
  },

  onStart: async function ({ message, event, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("Please mention someone!");

    const id1 = mention.length === 1 ? event.senderID : mention[1];
    const id2 = mention[0];

    try {
      const pathImg = await makeImage(id1, id2);
      message.reply({
        body: "tbh we both enjoyed🫣🥹",
        attachment: fs.createReadStream(pathImg)
      }, () => fs.unlinkSync(pathImg));
    } catch (e) {
      message.reply("❌ Image generate korte somossa hoise...");
      console.error(e);
    }
  }
};

async function makeImage(uid1, uid2) {
  const bgURL = "https://i.imgur.com/16HRsN6.jpg";
  const imgPath = path.join(__dirname, "tmp", `sed_${uid1}_${uid2}.png`);

  const [bg, av1, av2] = await Promise.all([
    loadImage(bgURL),
    loadImage(`https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`),
    loadImage(`https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
  ]);

  const canvas = createCanvas(1080, 1350);
  const ctx = canvas.getContext("2d");

  // draw background
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // draw circle avatar helper
  function drawCircleAvatar(image, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }

  // draw avatars
  drawCircleAvatar(av1, 790, 420, 140);
  drawCircleAvatar(av2, 300, 320, 250);

  await fs.ensureDir(path.dirname(imgPath));
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(imgPath, buffer);
  return imgPath;
}
