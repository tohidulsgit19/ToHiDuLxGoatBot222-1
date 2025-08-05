const axios = require('axios');
const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const { loadImage, createCanvas } = require('canvas');

// word-wrap helper
const wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (ctx.measureText(text).width < maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);
    const words = text.split(' ');
    const lines = [];
    let line = '';
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
      if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
      else {
        lines.push(line.trim());
        line = '';
      }
      if (words.length === 0) lines.push(line.trim());
    }
    return resolve(lines);
  });
};

// fallback download function (if axios fails)
const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`Failed with code ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
};

module.exports = {
  config: {
    name: "elon",
    version: "1.2",
    role: 0,
    author: "TOHIDUL",
    shortDescription: "ইলনের পোস্টে লেখা বসাও",
    category: "fun",
    guide: {
      en: "{pn} [text]",
      bn: "{pn} [তোমার লেখা] — ইলনের ফেসবুক পোস্টে নিজের কথা বসাও"
    },
    countDown: 5,
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const text = args.join(" ");
    if (!text) return api.sendMessage("🔤 লেখাটা দাও যা ইলনের পোস্টে বসাতে চাও!", threadID, messageID);

    const assetsPath = path.join(__dirname, 'assets');
    const imgPath = path.join(assetsPath, 'elon.png');

    // Make sure assets folder exists
    if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

    // Download image only if not exists
    if (!fs.existsSync(imgPath)) {
      const url = "https://i.imgur.com/GGmRov3.png";
      try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, res.data);
      } catch (err) {
        try {
          await downloadImage(url, imgPath);
        } catch (e) {
          return api.sendMessage("❌ ইমেজ নামাতে পারছি না। পরে আবার চেষ্টা করো!", threadID, messageID);
        }
      }
    }

    // Start drawing
    const baseImage = await loadImage(imgPath);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    let fontSize = 32;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";

    while (ctx.measureText(text).width > 1100) {
      fontSize--;
      ctx.font = `${fontSize}px Arial`;
    }

    const lines = await wrapText(ctx, text, 1160);
    ctx.fillText(lines.join('\n'), 40, 115);

    const outputPath = path.join(assetsPath, `elon_${senderID}.png`);
    fs.writeFileSync(outputPath, canvas.toBuffer());

    return api.sendMessage(
      { attachment: fs.createReadStream(outputPath) },
      threadID,
      () => fs.unlinkSync(outputPath),
      messageID
    );
  }
};
