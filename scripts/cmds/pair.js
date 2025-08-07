const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "Tohidul",
    role: 0,
    shortDescription: "💘 কারো সাথে র‍্যান্ডম জোড়া লাগাও",
    longDescription: "র‍্যান্ডমভাবে গ্রুপের এক সদস্যের সাথে তোমার প্রেমের সম্ভাবনা দেখায়।",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const id1 = event.senderID;
    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const botID = api.getCurrentUserID();

    let name1 = await usersData.getName(id1) || "User 1";
    let gender1 = "UNKNOWN";

    for (let u of allUsers) {
      if (u.id === id1) {
        gender1 = u.gender || "UNKNOWN";
        name1 = u.name || name1;
        break;
      }
    }

    // Filter matching candidates
    let candidates = allUsers.filter(u => u.id !== id1 && u.id !== botID && !u.isGroup);
    if (gender1 === "FEMALE") candidates = candidates.filter(u => u.gender === "MALE");
    else if (gender1 === "MALE") candidates = candidates.filter(u => u.gender === "FEMALE");

    if (candidates.length === 0) {
      return api.sendMessage("😢 কাউকে খুঁজে পাওয়া যায়নি তোমার জন্য!", event.threadID);
    }

    const match = candidates[Math.floor(Math.random() * candidates.length)];
    const id2 = match.id;
    const name2 = await usersData.getName(id2) || match.name || "User 2";

    // Random love percentage
    const rateOptions = [`${Math.floor(Math.random() * 100) + 1}`, "99.99", "0.01", "100", "69", "101"];
    const rate = rateOptions[Math.floor(Math.random() * rateOptions.length)];

    const imagePaths = {
      bg: path.join(__dirname, "cache", "pair_bg.png"),
      avt1: path.join(__dirname, "cache", "avt1.png"),
      avt2: path.join(__dirname, "cache", "avt2.png"),
      output: path.join(__dirname, "cache", "pair_result.png")
    };

    // Load images
    try {
      const { loadImage, createCanvas } = require("canvas");

      // Download avatars (fallback if token fails)
      const getAvatar = async (id) => {
        try {
          const url = `https://graph.facebook.com/${id}/picture?width=512&height=512`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          return Buffer.from(res.data);
        } catch {
          return null;
        }
      };

      const avt1 = await getAvatar(id1);
      const avt2 = await getAvatar(id2);

      if (!avt1 || !avt2) throw new Error("Failed to load avatar");

      fs.writeFileSync(imagePaths.avt1, avt1);
      fs.writeFileSync(imagePaths.avt2, avt2);

      // Random background
      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png"
      ];
      const bgURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      const bgImg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(imagePaths.bg, bgImg);

      // Create canvas
      const background = await loadImage(imagePaths.bg);
      const avatar1 = await loadImage(imagePaths.avt1);
      const avatar2 = await loadImage(imagePaths.avt2);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(avatar1, 100, 150, 300, 300);  // left avatar
      ctx.drawImage(avatar2, 900, 150, 300, 300);  // right avatar

      const finalBuffer = canvas.toBuffer();
      fs.writeFileSync(imagePaths.output, finalBuffer);

      // Clean up
      fs.unlinkSync(imagePaths.avt1);
      fs.unlinkSync(imagePaths.avt2);
      fs.unlinkSync(imagePaths.bg);

      // Send result
      return api.sendMessage({
        body: `💞 ${name1} ❤️ ${name2}\n🧠 প্রেমের সম্ভাবনা: ${rate}%\n💘 শুভ কামনা!`,
        mentions: [{ tag: name1, id: id1 }, { tag: name2, id: id2 }],
        attachment: fs.createReadStream(imagePaths.output)
      }, event.threadID, () => {
        fs.unlinkSync(imagePaths.output);
      });

    } catch (err) {
      console.log("Canvas error or fallback:", err.message);

      // Text fallback if image creation fails
      return api.sendMessage({
        body: `💞 ${name1} ❤️ ${name2}\n🧠 প্রেমের সম্ভাবনা: ${rate}%\n💘 শুভ কামনা!`,
        mentions: [{ tag: name1, id: id1 }, { tag: name2, id: id2 }]
      }, event.threadID);
    }
  }
};
