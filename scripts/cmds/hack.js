const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hack",
    author: "jun (remade by xemon)",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: { en: "Generate hacking meme with avatar" },
    guide: { en: "{pn} or {pn} @mention" }
  },

  wrapText: async (ctx, text, maxWidth) => {
    if (!text) return ["Unknown"];
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let word of words) {
      const testLine = line + word + " ";
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  },

  onStart: async function ({ event, api, usersData }) {
    try {
      const id = Object.keys(event.mentions)[0] || event.senderID;

      // Try to get name from usersData
      let name = await usersData.getName(id);

      // Fallback to api.getUserInfo if name is null
      if (!name) {
        const info = await api.getUserInfo(id);
        name = info?.[id]?.name || "Unknown";
      }

      const avatarUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const backgroundUrl = "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ";

      const cache = path.join(__dirname, "cache");
      fs.ensureDirSync(cache);

      const pathAvatar = path.join(cache, `hack_avt_${id}.png`);
      const pathBg = path.join(cache, "hack_bg.png");
      const pathResult = path.join(cache, `hack_result_${Date.now()}.png`);

      const [avtRes, bgRes] = await Promise.all([
        axios.get(avatarUrl, { responseType: "arraybuffer" }),
        axios.get(backgroundUrl, { responseType: "arraybuffer" })
      ]);

      fs.writeFileSync(pathAvatar, avtRes.data);
      fs.writeFileSync(pathBg, bgRes.data);

      const avatar = await loadImage(pathAvatar);
      const bg = await loadImage(pathBg);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(avatar, 83, 437, 100, 100);

      ctx.font = "400 23px Arial";
      ctx.fillStyle = "#1878F3";
      ctx.textAlign = "start";

      const lines = await this.wrapText(ctx, name, 1160);
      lines.forEach((line, i) => {
        ctx.fillText(line, 200, 497 + i * 30);
      });

      fs.writeFileSync(pathResult, canvas.toBuffer("image/png"));

      fs.removeSync(pathAvatar);
      fs.removeSync(pathBg);

      return api.sendMessage({
        body: "💻 ✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮 𝙃𝙖𝙘𝙠𝙚𝙙 𝙏𝙝𝙞𝙨 𝙐𝙨𝙚𝙧! My Lord, Please Check Your Inbox.",
        attachment: fs.createReadStream(pathResult)
      }, event.threadID, () => fs.unlinkSync(pathResult), event.messageID);

    } catch (err) {
      console.error("[HACK CMD ERROR]", err);
      return api.sendMessage("❌ হ্যাকিং করতে গিয়ে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।", event.threadID);
    }
  }
};
