const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair2",
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

  onStart: async function ({
    api,
    args,
    message,
    event,
    threadsData,
    usersData,
  }) {
    const { loadImage, createCanvas } = require("canvas");
    let pathImg = path.join(__dirname, "assets", "background.png");
    let pathAvt1 = path.join(__dirname, "assets", "any.png");
    let pathAvt2 = path.join(__dirname, "assets", "avatar.png");

    try {
      var id1 = event.senderID;
      var name1 = await usersData.getName(id1);
      if (!name1) {
        // fallback for name1 too
        const info1 = await api.getUserInfo(id1);
        name1 = info1[id1]?.name || "You";
      }

      var ThreadInfo = await api.getThreadInfo(event.threadID);
      var all = ThreadInfo.userInfo;

      let gender1;
      for (let c of all) {
        if (c.id == id1) {
          gender1 = c.gender;
          break;
        }
      }

      const botID = api.getCurrentUserID();
      let candidates = [];

      if (gender1 === "FEMALE") {
        candidates = all.filter(
          (u) => u.gender === "MALE" && u.id !== id1 && u.id !== botID
        );
      } else if (gender1 === "MALE") {
        candidates = all.filter(
          (u) => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID
        );
      } else {
        candidates = all.filter((u) => u.id !== id1 && u.id !== botID);
      }

      if (candidates.length === 0)
        return api.sendMessage(
          "No suitable partner found in this group.",
          event.threadID,
          event.messageID
        );

      var randomPartner = candidates[Math.floor(Math.random() * candidates.length)];
      var id2 = randomPartner.id;

      var name2 = await usersData.getName(id2);
      if (!name2) {
        try {
          const info2 = await api.getUserInfo(id2);
          name2 = info2[id2]?.name || "Unknown Partner 🤷";
        } catch {
          name2 = "Unknown Partner 🤷";
        }
      }

      var rd1 = Math.floor(Math.random() * 100) + 1;
      var cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      var rd2 = cc[Math.floor(Math.random() * cc.length)];
      var percentages = [
        rd1,
        rd1,
        rd1,
        rd1,
        rd1,
        rd2,
        rd1,
        rd1,
        rd1,
        rd1,
      ];
      var tile = percentages[Math.floor(Math.random() * percentages.length)];

      var background = [
        "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg",
      ];

      // Download avatars & background
      let getAvt1 = await axios.get(
        `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(pathAvt1, Buffer.from(getAvt1.data), "utf-8");

      let getAvt2 = await axios.get(
        `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(pathAvt2, Buffer.from(getAvt2.data), "utf-8");

      let getBg = await axios.get(background[0], {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(pathImg, Buffer.from(getBg.data), "utf-8");

      // Load images
      let baseImage = await loadImage(pathImg);
      let baseAvt1 = await loadImage(pathAvt1);
      let baseAvt2 = await loadImage(pathAvt2);

      // Create canvas and draw
      let canvas = createCanvas(baseImage.width, baseImage.height);
      let ctx = canvas.getContext("2d");
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 111, 175, 330, 330);
      ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

      // Save final image
      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);

      // Cleanup avatars
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);

      // Send message with mention and image
      return api.sendMessage(
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
    } catch (error) {
      console.error("Error in pair2 command:", error);
      return api.sendMessage(
        "❌ Sorry, something went wrong while generating the pair.",
        event.threadID,
        event.messageID
      );
    }
  },
};
