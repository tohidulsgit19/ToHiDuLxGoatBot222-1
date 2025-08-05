const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");
const { findUid } = global.utils;

module.exports = {
  config: {
    name: "avoid",
    version: "2.0",
    author: "SiAM (Canvas Remake by xemon)",
    countDown: 5,
    role: 0,
    shortDescription: "Scammer alert meme",
    longDescription: "Generate a meme to warn against a person",
    category: "fun",
    guide: {
      en: "{pn} [@mention | UID | fb link]"
    }
  },

  onStart: async function ({ message, event, args }) {
    let uid = null;
    const input = args.join(" ");

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (/^\d+$/.test(input)) {
      uid = input;
    } else if (input.includes("facebook.com")) {
      try {
        uid = await findUid(input);
      } catch (e) {
        console.error(e);
        return message.reply("❌ ফেসবুক লিংক থেকে UID বের করা যায়নি।");
      }
    }

    if (!uid) {
      return message.reply("⚠️ দয়া করে কাউকে @mention করুন, UID দিন অথবা ফেসবুক লিংক দিন।");
    }

    try {
      const profilePicURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const templateURL = "https://i.ibb.co/QQC1fzq/Picsart-23-04-13-12-35-19-485.png";
      const textImageURL = "https://i.ibb.co/zrYF6fM/Picsart-23-04-13-11-24-31-876.png";

      const [profileBuffer, templateBuffer, textBuffer] = await Promise.all([
        axios.get(profilePicURL, { responseType: "arraybuffer" }).then(res => res.data),
        axios.get(templateURL, { responseType: "arraybuffer" }).then(res => res.data),
        axios.get(textImageURL, { responseType: "arraybuffer" }).then(res => res.data)
      ]);

      const profilePic = await loadImage(profileBuffer);
      const template = await loadImage(templateBuffer);
      const textImg = await loadImage(textBuffer);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      // Draw template
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

      // Resize and draw profile image centered
      const pWidth = template.width;
      const pHeight = profilePic.height * (pWidth / profilePic.width);
      const y = Math.max((template.height - pHeight) / 2 + 115, 0);
      ctx.drawImage(profilePic, 0, y, pWidth, pHeight);

      // Draw text image
      ctx.drawImage(textImg, 0, 1650, canvas.width, textImg.height * (canvas.width / textImg.width));

      const filePath = `${__dirname}/cache/avoid_${uid}.png`;
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      await message.reply({
        body: "🚨 Avoid this scammer in Bangladesh!",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ ছবি বানাতে সমস্যা হয়েছে!");
    }
  }
};
