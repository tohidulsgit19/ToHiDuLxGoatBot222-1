const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "wishcard",
    aliases: ["wc"],
    author: "junjam × AceGun (rewritten by ChatGPT)",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Make a wishcard with avatar and two texts",
    },
  },

  circle: async function (path) {
    const img = await loadImage(path);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toBuffer();
  },

  onStart: async function ({ api, event, args }) {
    const { senderID, threadID, messageID } = event;
    const text = args.join(" ");
    if (!text.includes(" - ")) {
      return api.sendMessage(
        "💢 Format: text1 - text2",
        threadID,
        messageID
      );
    }

    const [text1, text2] = text.split(" - ").map((t) => t.trim());
    const cacheDir = path.join(__dirname, "cache");
    const avatarPath = path.join(cacheDir, `${senderID}_ava.png`);
    const bgPath = path.join(cacheDir, `${senderID}_bg.png`);
    const finalPath = path.join(cacheDir, `${senderID}_card.png`);

    try {
      // Download avatar
      const avatarRes = await axios.get(
        `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(avatarPath, avatarRes.data);

      // Download background image
      const bgRes = await axios.get(
        `https://i.ibb.co/cCpB1sQ/Ph-i-b-a-trung-thu.png`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(bgPath, bgRes.data);

      const avatarCircle = await this.circle(avatarPath);
      const baseImage = await loadImage(bgPath);
      const avatarImg = await loadImage(avatarCircle);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      // Draw base
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(avatarImg, 820, 315, 283, 283); // avatar position and size

      // Text 1
      ctx.font = "bold 70px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(text1, 965, 715);

      // Text 2
      ctx.font = "55px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text2, 965, 800);

      // Export final image
      const imageBuffer = canvas.toBuffer("image/png");
      fs.writeFileSync(finalPath, imageBuffer);

      return api.sendMessage(
        { attachment: fs.createReadStream(finalPath) },
        threadID,
        () => {
          fs.unlinkSync(avatarPath);
          fs.unlinkSync(bgPath);
          fs.unlinkSync(finalPath);
        },
        messageID
      );
    } catch (err) {
      console.error("Wishcard error:", err);
      return api.sendMessage("❌ Could not generate the wishcard.", threadID, messageID);
    }
  },
};
