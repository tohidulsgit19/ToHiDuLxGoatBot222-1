const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "confess",
    version: "1.0",
    author: "SiAM",
    countDown: 6,
    role: 0,
    shortDescription: "Confession edit - use /help confess to see usage",
    longDescription: "Creates a confession image using one or two tagged users' avatars",
    category: "edit",
    guide: {
      en: "{pn} @tag | {pn} @tag1 @tag2"
    }
  },

  onStart: async function({ api, args, message, event }) {
    const p = global.utils.getPrefix(event.threadID);

    const mentions = Object.keys(event.mentions || {});
    let uid1, uid2;

    if (mentions.length === 2) {
      uid1 = mentions[0];
      uid2 = mentions[1];
    } else if (mentions.length === 1) {
      uid1 = event.senderID;
      uid2 = mentions[0];
    } else {
      return message.reply(
        `⚠️ This command only works with mentions.\n\nUsage:\n${p}confess @tag\nor\n${p}confess @tag1 @tag2\n\n- Single tag: sender is boy, tagged user is girl.\n- Double tag: first tag is boy, second tag is girl.\n\nType '${p}help confess' for more info.`
      );
    }

    const avatarUrl1 = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatarUrl2 = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const templateUrl = "https://i.imgur.com/P7sBv2p.png";

    const processingMsg = await message.reply("Processing your confession...💗");

    try {
      const [avatar1, avatar2, template] = await Promise.all([
        loadImage(avatarUrl1),
        loadImage(avatarUrl2),
        loadImage(templateUrl),
      ]);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(template, 0, 0);

      function drawCircleAvatar(ctx, img, x, y, size, rotation = 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (rotation !== 0) {
          ctx.translate(x + size / 2, y + size / 2);
          ctx.rotate(rotation);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
        } else {
          ctx.drawImage(img, x, y, size, size);
        }

        ctx.restore();
      }

      drawCircleAvatar(ctx, avatar1, 450, 187, 180, (-20 * Math.PI) / 180);
      drawCircleAvatar(ctx, avatar2, 970, 270, 145);

      const outputPath = path.join(__dirname, `${uid1}_${uid2}_confess.png`);
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(outputPath, buffer);

      const userInfo1 = await api.getUserInfo(uid1);
      const userInfo2 = await api.getUserInfo(uid2);
      const userName1 = userInfo1[uid1].name; // FULL name
      const userName2 = userInfo2[uid2].name; // FULL name

      await message.reply(
        {
          body: `I love you ${userName2}💗\n${userName1} and ${userName2} are now a perfect couple 😍`,
          attachment: fs.createReadStream(outputPath),
        },
        () => fs.unlinkSync(outputPath)
      );

      await message.unsend(processingMsg.messageID);
    } catch (error) {
      console.error(error);
      return message.reply("❌ There was an error processing the image.");
    }
  },
};
