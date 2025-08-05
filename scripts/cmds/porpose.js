const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "propose",
    aliases: ["proposal"],
    version: "1.1",
    author: "Kivv × AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "@mention someone to propose",
    longDescription: "",
    category: "fun",
    guide: "{pn} mention/tag",
  },

  onStart: async function ({ message, event, args, api }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) {
      return message.reply("Please mention someone");
    }

    // যেহেতু সাধারণত ১ জন mention থাকে, তাই সে ইউজার
    const one = event.senderID;
    const two = mention[0];

    const imagePath = await makeProposeImage(one, two);
    message.reply(
      {
        body: "「 Please be mine😍❤️ 」",
        attachment: fs.createReadStream(imagePath),
      },
      () => fs.unlinkSync(imagePath)
    );
  },
};

async function makeProposeImage(id1, id2) {
  const path = __dirname + `/cache/propose_${id1}_${id2}.png`;

  // ব্যাকগ্রাউন্ড ইমেজ URL
  const bgURL = "https://i.ibb.co/RNBjSJk/image.jpg";

  // ইউজারদের FB প্রোফাইল ছবি URL
  const avatar1URL = `https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const avatar2URL = `https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  // ইমেজ গুলো লোড কর
  const [bgImg, av1, av2] = await Promise.all([
    loadImage(bgURL),
    loadImage(await getImageBuffer(avatar1URL)),
    loadImage(await getImageBuffer(avatar2URL)),
  ]);

  // ক্যানভাস তৈরি কর
  const canvas = createCanvas(760, 506);
  const ctx = canvas.getContext("2d");

  // ব্যাকগ্রাউন্ড
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Avatar গুলো গোলাকারে crop করার জন্য mask তৈরি
  function drawCircleAvatar(ctx, img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  }

  // ইউজার ১ এর এভাতার
  drawCircleAvatar(ctx, av1, 210, 65, 90);
  // ইউজার ২ এর এভাতার
  drawCircleAvatar(ctx, av2, 458, 105, 90);

  // চূড়ান্ত ইমেজ তৈরি
  const buffer = canvas.toBuffer("image/png");
  await fs.outputFile(path, buffer);

  return path;
}

async function getImageBuffer(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "utf-8");
}
