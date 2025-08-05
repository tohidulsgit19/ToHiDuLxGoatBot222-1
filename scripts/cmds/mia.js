const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "mia",
    aliases: [],
    version: "1.0.1",
    author: "TOHI-BOT-HUB",
    countDown: 5,
    role: 0,
    shortDescription: "Comment on Mia board",
    longDescription: "Draw your custom comment on Mia image board",
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
          if (split) {
            words[1] = `${temp.slice(-1)}${words[1]}`;
          } else {
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

    if (!text) {
      return api.sendMessage("✏️ Enter the comment content to display on the board.", threadID, messageID);
    }

    const imgURL = "https://i.postimg.cc/Jh86TFLn/Pics-Art-08-14-10-45-31.jpg";
    const imgPath = path.join(__dirname, "cache", "mia-board.png");

    try {
      await fs.ensureDir(path.dirname(imgPath));
      const response = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, Buffer.from(response.data));

      const baseImage = await loadImage(imgPath);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000000";
      ctx.textAlign = "start";
      ctx.font = "45px Arial";

      const lines = await this.wrapText(ctx, text, 1160);

      let y = 165;
      for (const line of lines) {
        ctx.fillText(line, 60, y);
        y += 55;
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
      console.error("❌ Error generating Mia board image:", err);
      return api.sendMessage("❌ Couldn't generate the image. Try again later.", threadID, messageID);
    }
  }
};
