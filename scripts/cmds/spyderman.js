const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "spiderman",
    aliases: [],
    version: "1.0",
    author: "zach (rewritten by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "Spiderman meme with two avatars",
    longDescription: "",
    category: "photo",
    guide: "{pn} @mention"
  },

  onStart: async function ({ event, message }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("⚠️ Mention someone!");

    const id1 = mention.length === 1 ? event.senderID : mention[1];
    const id2 = mention[0];

    const imgPath = await makeImage(id1, id2);
    const bodyText = mention.length === 1 ? "🕸️ it's him" : "🕸️ he is not me";

    return message.reply({
      body: bodyText,
      attachment: fs.createReadStream(imgPath)
    });
  }
};

async function makeImage(uid1, uid2) {
  const bgURL = "https://i.imgur.com/AIizK0f.jpeg";
  const av1 = await loadAvatar(uid1);
  const av2 = await loadAvatar(uid2);

  const canvas = createCanvas(1440, 1080);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(bgURL);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  drawCircleAvatar(ctx, av1, 325, 110, 170);
  drawCircleAvatar(ctx, av2, 1000, 95, 170);

  const filePath = path.join(__dirname, "cache/spiderman.png");
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

async function loadAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return await loadImage(response.data);
}

function drawCircleAvatar(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}
