const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "crush",
    aliases: [],
    version: "2.0",
    author: "AceGun + xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: "🥰 Send love image with avatar",
    longDescription: "Generates a love-themed image with your crush’s avatar",
    category: "love",
    guide: "{pn} @tag"
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);
    if (!mention.length) return message.reply("💔 Tag your crush!");

    const uid = mention[0];
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
      // Load images
      const avatar = await loadImage(avatarUrl);
      const bg = await loadImage("https://i.imgur.com/BnWiVXT.jpg"); // romantic bg

      // Create canvas
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext("2d");

      // Draw bg
      ctx.drawImage(bg, 0, 0, 512, 512);

      // Draw avatar in circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(156, 276, 86.5, 0, Math.PI * 2, true); // Circle for avatar
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 70, 186, 173, 173);
      ctx.restore();

      // Save
      const outputPath = path.join(__dirname, "cache", `crush_${uid}.png`);
      await fs.ensureDir(path.dirname(outputPath));
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outputPath, buffer);

      // Reply with image
      message.reply({
        body: "❤️‍🔥 Is that true... your crush? 😳",
        attachment: fs.createReadStream(outputPath)
      }, () => fs.unlinkSync(outputPath));

    } catch (err) {
      console.error("❌ Error in crush command:", err);
      message.reply("😔 Couldn't make the image.");
    }
  }
};
