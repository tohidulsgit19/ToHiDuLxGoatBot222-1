const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "obama",
    aliases: ["ob"],
    version: "1.1.0",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "Obama writes your message",
    longDescription: "Generate an image of Obama holding a board with your text",
    category: "fun",
    guide: {
      en: "{pn} your text"
    }
  },

  wrapText: async (ctx, text, maxWidth) => {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);

      const words = text.split(" ");
      const lines = [];
      let line = "";

      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }

        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
          line += `${words.shift()} `;
        } else {
          lines.push(line.trim());
          line = "";
        }

        if (words.length === 0) lines.push(line.trim());
      }

      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, args }) {
    const text = args.join(" ").trim();
    const { threadID, messageID } = event;

    if (!text) return api.sendMessage("✏️ Enter the comment you want Obama to write.", threadID, messageID);

    const imgURL = "https://i.postimg.cc/VLzQYRtk/obama.png";
    const imgPath = path.join(__dirname, "cache", "obama.png");

    try {
      await fs.ensureDir(path.dirname(imgPath));

      // Download image correctly
      const response = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, response.data);

      const baseImg = await loadImage(imgPath);
      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.font = "30px Arial";
      ctx.textAlign = "start";

      const lines = await this.wrapText(ctx, text, 600);

      let y = 105;
      for (const line of lines) {
        ctx.fillText(line, 40, y);
        y += 25;
      }

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(imgPath, buffer);

      return api.sendMessage(
        { attachment: fs.createReadStream(imgPath) },
        threadID,
        () => fs.unlinkSync(imgPath),
        messageID
      );
    } catch (err) {
      console.error("❌ Obama Image Error:", err);
      if (err.response && err.response.status === 429) {
        return api.sendMessage("🚫 Imgur is rate-limiting. Try again later.", threadID, messageID);
      }
      return api.sendMessage("❌ Couldn't generate the Obama image.", threadID, messageID);
    }
  }
};
