const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}",
    },
  },

  onStart: async function ({ api, event, usersData }) {
    const pathAssets = path.join(__dirname, "assets");
    await fs.ensureDir(pathAssets);
    const pathImg = path.join(pathAssets, "background.png");
    const pathAvt1 = path.join(pathAssets, "avatar1.png");
    const pathAvt2 = path.join(pathAssets, "avatar2.png");

    try {
      // Get sender info
      const id1 = event.senderID;
      let name1 = await usersData.getName(id1);
      if (!name1) {
        const info1 = await api.getUserInfo(id1);
        name1 = info1[id1]?.name || "You";
      }

      // Get thread info once
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allMembers = threadInfo.userInfo;

      // Get sender gender from thread info
      const senderData = allMembers.find((mem) => mem.id === id1);
      const gender1 = senderData?.gender || null;

      // Bot ID for exclusion
      const botID = api.getCurrentUserID();

      // Filter candidates based on gender
      let candidates;
      if (gender1 === "FEMALE") {
        candidates = allMembers.filter(
          (u) => u.gender === "MALE" && u.id !== id1 && u.id !== botID
        );
      } else if (gender1 === "MALE") {
        candidates = allMembers.filter(
          (u) => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID
        );
      } else {
        candidates = allMembers.filter((u) => u.id !== id1 && u.id !== botID);
      }

      if (!candidates.length) {
        return api.sendMessage(
          "No suitable partner found in this group.",
          event.threadID,
          event.messageID
        );
      }

      // Pick random partner
      const partner = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = partner.id;

      // Get partner name safely
      let name2 = await usersData.getName(id2);
      if (!name2) {
        try {
          const info2 = await api.getUserInfo(id2);
          name2 = info2[id2]?.name || "Unknown Partner 🤷";
        } catch {
          name2 = "Unknown Partner 🤷";
        }
      }

      // Random percentage generation with some chance of weird values
      const rd1 = Math.floor(Math.random() * 100) + 1;
      const cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      const percentages = [
        rd1, rd1, rd1, rd1, rd1,
        cc[Math.floor(Math.random() * cc.length)],
        rd1, rd1, rd1, rd1,
      ];
      const tile = percentages[Math.floor(Math.random() * percentages.length)];

      // Background image link stays the same
      const backgroundURL = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg";

      // Download all images in parallel (avatars + bg)
      const [avt1Res, avt2Res, bgRes] = await Promise.all([
        axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" }),
        axios.get(backgroundURL, { responseType: "arraybuffer" }),
      ]);

      await Promise.all([
        fs.writeFile(pathAvt1, Buffer.from(avt1Res.data)),
        fs.writeFile(pathAvt2, Buffer.from(avt2Res.data)),
        fs.writeFile(pathImg, Buffer.from(bgRes.data)),
      ]);

      // Load images
      const [baseImage, baseAvt1, baseAvt2] = await Promise.all([
        loadImage(pathImg),
        loadImage(pathAvt1),
        loadImage(pathAvt2),
      ]);

      // Create canvas & draw images
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 111, 175, 330, 330);
      ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

      // Save final image buffer to background.png
      const finalBuffer = canvas.toBuffer();
      await fs.writeFile(pathImg, finalBuffer);

      // Send message with mention and attachment
      await api.sendMessage(
        {
          body: `『💗』Congratulations ${name1}『💗』\n『❤️』Looks like your destiny brought you together with ${name2}『❤️』\n『🔗』Your link percentage is ${tile}%『🔗』`,
          mentions: [
            { tag: name2, id: id2 },
            { tag: name1, id: id1 },
          ],
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => fs.unlinkSync(pathImg),
        event.messageID
      );

      // Cleanup avatars after sending
      await Promise.all([fs.remove(pathAvt1), fs.remove(pathAvt2)]);
    } catch (error) {
      console.error("Error in pair command:", error);
      return api.sendMessage(
        "❌ Sorry, something went wrong while generating the pair.",
        event.threadID,
        event.messageID
      );
    }
  },
};
