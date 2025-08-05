const axios = require("axios");
const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "marry",
    aliases: ["bibaho", "biye"],
    version: "1.1",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: "বিয়ে করো কারো সাথে",
    longDescription: "প্রেমিক বা প্রেমিকাকে mention করে বিয়ে করো!",
    category: "love",
    guide: "{pn} @mention"
  },

  onStart: async function ({ message, event, args, api }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0)
      return message.reply("👰 কার সাথে বিয়ে করবে তা mention করো!");

    const one = event.senderID;
    const two = mention[0];

    const senderInfo = await api.getUserInfo(one);
    const receiverInfo = await api.getUserInfo(two);

    const senderName = senderInfo[one]?.name || "Someone";
    const receiverName = receiverInfo[two]?.name || "Someone";

    const imgPath = await makeMarryImage(one, two);
    return message.reply({
      body: `💍 বিয়েটা হয়েই গেলো মনে হয়! 👰‍♀️🤵\n💖 ${senderName} ❤️ ${receiverName}`,
      attachment: fs.createReadStream(imgPath)
    }, () => fs.unlinkSync(imgPath));
  }
};

async function makeMarryImage(uid1, uid2) {
  const path = __dirname + `/cache/marry_result_${uid1}_${uid2}.png`;

  const bgURL = "https://i.postimg.cc/XN1TcH3L/tumblr-mm9nfpt7w-H1s490t5o1-1280.jpg";
  const avatar1URL = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const avatar2URL = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const [bgImg, av1Img, av2Img] = await Promise.all([
    loadImage(bgURL),
    loadImage(avatar1URL),
    loadImage(avatar2URL)
  ]);

  const canvas = createCanvas(1024, 684);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, 1024, 684);

  // Helper to draw circular avatar
  function drawCircleImage(img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  }

  drawCircleImage(av1Img, 204, 160, 85);
  drawCircleImage(av2Img, 315, 105, 80);

  const buffer = canvas.toBuffer();
  fs.writeFileSync(path, buffer);
  return path;
}
