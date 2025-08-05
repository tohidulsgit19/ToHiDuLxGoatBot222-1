const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "arrest",
    aliases: ["arrest"],
    version: "2.0",
    author: "milan + xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: "arrest someone with pic",
    longDescription: "",
    category: "image",
    guide: {
      en: "{pn} @tag",
      vi: "{pn} @tag"
    }
  },

  onStart: async function ({ event, message, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return message.reply("🚨 Tag someone to arrest!");

    const one = mention.length === 1 ? event.senderID : mention[1];
    const two = mention[0];

    try {
      const pathImg = await makeArrestImage(one, two);
      return message.reply({
        body: "🫵🏼 You are under arrest!",
        attachment: fs.createReadStream(pathImg)
      });
    } catch (err) {
      console.error(err);
      return message.reply("❌ Couldn't create arrest image.");
    }
  }
};

async function makeArrestImage(uid1, uid2) {
  // Get avatars
  const [av1, av2] = await Promise.all([
    loadAvatar(uid1),
    loadAvatar(uid2)
  ]);

  // Load background
  const bg = await loadImage("https://i.imgur.com/ep1gG3r.png");
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bg, 0, 0);

  // Draw avatars as circles
  drawCircleImage(ctx, av1, 375, 9, 100);
  drawCircleImage(ctx, av2, 160, 92, 100);

  // Save to cache
  const outputPath = path.join(__dirname, "cache", `arrest_${uid1}_${uid2}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

async function loadAvatar(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return await loadImage(res.data);
}

function drawCircleImage(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}
