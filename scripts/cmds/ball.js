const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ball",
    aliases: ["geda"],
    version: "2.0",
    author: "Otineeeeyyyy (converted to GoatBot v2 by xemon)",
    countDown: 5,
    role: 0,
    shortDescription: "Geda maar tag kore",
    longDescription: "Tag someone to hit them with a football meme",
    category: "fun",
    guide: "{pn} @mention"
  },

  onStart: async function ({ api, event, usersData }) {
    const mention = Object.keys(event.mentions);
    if (mention.length === 0) return api.sendMessage("😾 কাউকে mention করো যাকে গেদা মারবা!", event.threadID);

    const one = event.senderID;
    const two = mention[0];

    const name1 = (await usersData.getName(one)) || "User 1";
    const name2 = (await usersData.getName(two)) || "User 2";

    const avtURL1 = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avtURL2 = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const bgURL = "https://i.ibb.co/6Jz7yvX/image.jpg";

    const pathImg = __dirname + `/cache/ball_result_${Date.now()}.png`;

    try {
      const [bgData, avt1Data, avt2Data] = await Promise.all([
        axios.get(bgURL, { responseType: "arraybuffer" }),
        axios.get(avtURL1, { responseType: "arraybuffer" }),
        axios.get(avtURL2, { responseType: "arraybuffer" })
      ]);

      const bg = await loadImage(bgData.data);
      const avt1 = await loadImage(avt1Data.data);
      const avt2 = await loadImage(avt2Data.data);

      const canvas = createCanvas(1080, 1320);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0, 1080, 1320);

      // Circular crop function
      function drawCircleImage(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // Place avatars
      drawCircleImage(avt1, 200, 320, 170);
      drawCircleImage(avt2, 610, 70, 170);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathImg, buffer);

      return api.sendMessage({
        body: `😹 ${name1} just kicked ${name2}'s geda!`,
        mentions: [
          { tag: name1, id: one },
          { tag: name2, id: two }
        ],
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, () => fs.unlinkSync(pathImg));

    } catch (err) {
      console.error("Ball command error:", err);
      return api.sendMessage("❌ গেদা মারার কমান্ডে সমস্যা হয়েছে!", event.threadID);
    }
  }
};
