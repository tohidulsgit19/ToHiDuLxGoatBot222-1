const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "marry2",
    aliases: ["m"],
    version: "1.1",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "get a wife",
    longDescription: "",
    category: "marry",
    guide: "{pn}",
  },

  onStart: async function ({ message, event, args }) {
    const mention = Object.keys(event.mentions);
    if (mention.length == 0) {
      return message.reply("Please mention someone");
    } else if (mention.length == 1) {
      const one = event.senderID,
        two = mention[0];
      bal(one, two).then((pathImg) => {
        message.reply({
          body: "「 Love you Babe🥰❤️ 」",
          attachment: fs.createReadStream(pathImg),
        });
      });
    } else {
      const one = mention[1],
        two = mention[0];
      bal(one, two).then((pathImg) => {
        message.reply({
          body: "「 Love you Babe🥰❤️ 」",
          attachment: fs.createReadStream(pathImg),
        });
      });
    }
  },
};

async function createCircleImage(image, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(image, 0, 0, size, size);

  return canvas;
}

async function bal(one, two) {
  const dirCache = path.resolve(__dirname, "cache");
  if (!fs.existsSync(dirCache)) {
    fs.mkdirSync(dirCache, { recursive: true });
  }
  const outputPath = path.resolve(dirCache, `marry2_${one}_${two}.png`);

  // Background image
  const bgUrl = "https://i.ibb.co/5TwSHpP/Guardian-Place-full-1484178.jpg";
  const background = await loadImage(bgUrl);

  // Avatars
  const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const avatarOne = await loadImage(urlOne);
  const avatarTwo = await loadImage(urlTwo);

  // Create circular avatars
  const circleOneCanvas = await createCircleImage(avatarOne, 75);
  const circleTwoCanvas = await createCircleImage(avatarTwo, 80);

  // Create canvas same size as bg
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.drawImage(background, 0, 0, background.width, background.height);

  // Draw avatars at given positions
  ctx.drawImage(circleOneCanvas, 262, 0, 75, 75);
  ctx.drawImage(circleTwoCanvas, 350, 69, 80, 80);

  // Save image
  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}
