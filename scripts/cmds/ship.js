const { resolve } = require("path");
const { existsSync, mkdirSync } = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ship",
    author: "Otineeeeeyyyyyyy",
    countDown: 5,
    role: 0,
    category: "love",
    shortDescription: {
      en: "",
    },
  },

  onLoad: async function () {
    const { downloadFile } = global.utils;
    const dirMaterial = __dirname + "/cache/canvas/";
    const path = resolve(__dirname, "cache/canvas", "pairing.jpg");
    if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });
    if (!existsSync(path))
      await downloadFile(
        "https://i.pinimg.com/736x/15/fa/9d/15fa9d71cdd07486bb6f728dae2fb264.jpg",
        path
      );
  },

  circleCrop: function (ctx, x, y, size, img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  },

  makeImage: async function ({ one, two }) {
    const __root = resolve(__dirname, "cache", "canvas");
    const bgPath = __root + "/pairing.jpg";
    const pathImg = __root + `/pairing_${one}_${two}.png`;

    // Load background
    const bgImg = await loadImage(bgPath);

    // Download avatars as buffers
    const [avatarOneBuffer, avatarTwoBuffer] = await Promise.all([
      axios
        .get(
          `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
        .then((res) => Buffer.from(res.data, "utf-8")),
      axios
        .get(
          `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
        .then((res) => Buffer.from(res.data, "utf-8")),
    ]);

    // Load avatars as images
    const [avatarOne, avatarTwo] = await Promise.all([
      loadImage(avatarOneBuffer),
      loadImage(avatarTwoBuffer),
    ]);

    // Create canvas and context
    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    // Draw circular cropped avatars
    this.circleCrop(ctx, 355, 100, 85, avatarOne);
    this.circleCrop(ctx, 250, 140, 75, avatarTwo);

    // Save final image
    const buffer = canvas.toBuffer("image/png");
    await fs.outputFile(pathImg, buffer);

    return pathImg;
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID, senderID } = event;
    const tl = [
      "21%",
      "67%",
      "19%",
      "37%",
      "17%",
      "96%",
      "52%",
      "62%",
      "76%",
      "83%",
      "100%",
      "99%",
      "0%",
      "48%",
    ];
    const tle = tl[Math.floor(Math.random() * tl.length)];

    // Get sender name
    const dataSender = await api.getUserInfo(senderID);
    const nameSender = dataSender[senderID]?.name || "User";

    // Get thread info and pick random participant excluding sender & bot
    const threadInfo = await api.getThreadInfo(threadID);
    const allParticipants = threadInfo.userInfo;
    const botID = api.getCurrentUserID();

    const candidates = allParticipants
      .filter((u) => u.id !== senderID && u.id !== botID)
      .map((u) => u.id);

    if (candidates.length === 0)
      return api.sendMessage("No one to pair with!", threadID, messageID);

    const id2 = candidates[Math.floor(Math.random() * candidates.length)];
    const dataSecond = await api.getUserInfo(id2);
    const nameSecond = dataSecond[id2]?.name || "User";

    // Prepare mention array
    const mentions = [
      { id: senderID, tag: nameSender },
      { id: id2, tag: nameSecond },
    ];

    // Generate image
    const pathImg = await this.makeImage({ one: senderID, two: id2 });

    // Send message with image & mentions
    return api.sendMessage(
      {
        body: `💘 ${nameSender} paired with ${nameSecond} 💘\n\nTag: ${mentions
          .map((m) => `@${m.tag}`)
          .join(" ")}`,
        mentions,
        attachment: fs.createReadStream(pathImg),
      },
      threadID,
      () => fs.unlinkSync(pathImg),
      messageID
    );
  },
};
