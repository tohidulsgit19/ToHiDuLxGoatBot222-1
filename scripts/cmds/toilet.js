const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");

module.exports = {
  config: {
    name: "toilet",
    version: "2.2",
    author: "TOHI-BOT-HUB | Edited by ChatGPT",
    countDown: 5,
    role: 0, // সবাই চালাতে পারবে
    shortDescription: "Send someone to toilet (except boss)",
    category: "fun",
    guide: {
      en: "{pn} @mention | reply"
    }
  },

  onStart: async function({ event, api, usersData }) {
    const OWNER_UIDS = ["100092006324917"]; // Boss IDs
    const senderID = event.senderID;

    // নির্ধারণ টার্গেট: mention বা reply
    let targetID = senderID;
    if (event.messageReply && event.messageReply.senderID) {
      targetID = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }

    // যদি টার্গেট OWNER, তাহলে কাজ বন্ধ এবং মেসেজ
    if (OWNER_UIDS.includes(targetID)) {
      return api.sendMessage(
        "😹👑 Boss কে Toilet এ পাঠানো যাবে না!",
        event.threadID,
        event.messageID
      );
    }

    const targetName = await usersData.getName(targetID);
    const msg = await api.sendMessage("🚽 Toilet তৈরি হচ্ছে... 💩", event.threadID);

    try {
      // Canvas ও background সেটআপ
      const canvas = Canvas.createCanvas(500, 670);
      const ctx = canvas.getContext("2d");
      try {
        const bg = await Canvas.loadImage("https://i.imgur.com/Kn7KpAr.jpg");
        ctx.drawImage(bg, 0, 0, 500, 670);
      } catch {
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, 500, 670);
      }

      // Avatar ডাউনলোড
      let avatarBuffer;
      const urls = [
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512`,
        `https://graph.facebook.com/${targetID}/picture?type=large`
      ];
      for (const u of urls) {
        try {
          const res = await axios.get(u, {
            responseType: "arraybuffer",
            timeout: 8000
          });
          avatarBuffer = res.data;
          break;
        } catch {}
      }

      if (avatarBuffer) {
        const av = Canvas.createCanvas(512, 512);
        const ac = av.getContext("2d");
        const image = await Canvas.loadImage(avatarBuffer);
        ac.beginPath();
        ac.arc(256, 256, 256, 0, Math.PI * 2);
        ac.closePath();
        ac.clip();
        ac.drawImage(image, 0, 0, 512, 512);
        ctx.drawImage(av, 135, 350, 205, 205);
      }

      const imgPath = path.join(__dirname, "cache", `toilet_${Date.now()}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      const texts = [
        `🚽💩 ${targetName} এখন Toilet-এ বসে আছে!`,
        `🚽 ${targetName} টয়লেটে পাঠানো হয়েছ!\n💩`
      ];

      api.unsendMessage(msg.messageID);
      await api.sendMessage(
        {
          body: texts[Math.floor(Math.random() * texts.length)],
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );

    } catch (err) {
      api.unsendMessage(msg.messageID);
      return api.sendMessage(`❌ Toilet command error:\n${err.message}`, event.threadID, event.messageID);
    }
  }
};
