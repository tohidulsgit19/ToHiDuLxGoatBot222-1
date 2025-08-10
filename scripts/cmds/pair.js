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
    const { loadImage, createCanvas } = require("canvas");

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

    // Filter candidates
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

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imagePaths = {
      bg: path.join(cacheDir, "pair_bg.png"),
      avt1: path.join(cacheDir, "avt1.png"),
      avt2: path.join(cacheDir, "avt2.png"),
      heart: path.join(cacheDir, "heart.png"),
      output: path.join(cacheDir, "pair_result.png")
    };

    // Avatar downloader
    const getAvatar = async (uid) => {
      const token = api.getAppState()[0]?.accessToken || null;
      const avatarURL = token
        ? `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${token}`
        : `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
      try {
        const res = await axios.get(avatarURL, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
      } catch (e) {
        console.error(`Avatar download failed for ${uid}:`, e.message);
        const fallbackURL = "https://i.postimg.cc/DZzkWv7b/default-avatar.png";
        const fallback = await axios.get(fallbackURL, { responseType: "arraybuffer" });
        return Buffer.from(fallback.data);
      }
    };

    try {
      // Download images
      fs.writeFileSync(imagePaths.avt1, await getAvatar(id1));
      fs.writeFileSync(imagePaths.avt2, await getAvatar(id2));

      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png"
      ];
      const bgURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      fs.writeFileSync(imagePaths.bg, (await axios.get(bgURL, { responseType: "arraybuffer" })).data);

      const heartURL = "https://i.postimg.cc/ZqfVhJYh/heart.png";
      fs.writeFileSync(imagePaths.heart, (await axios.get(heartURL, { responseType: "arraybuffer" })).data);

      // Load images
      const background = await loadImage(imagePaths.bg);
      const avatar1 = await loadImage(imagePaths.avt1);
      const avatar2 = await loadImage(imagePaths.avt2);
      const heartImg = await loadImage(imagePaths.heart);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Draw circular avatar with border
      const drawCircularImage = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 8;
        ctx.shadowColor = "rgba(255,255,255,0.7)";
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawCircularImage(avatar1, 150, 200, 300);
      drawCircularImage(avatar2, canvas.width - 450, 200, 300);

      // Heart in center
      ctx.drawImage(heartImg, (canvas.width / 2) - 100, 250, 200, 200);

      // Love percentage text
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.shadowColor = "red";
      ctx.shadowBlur = 25;
      ctx.fillText(`${rate}%`, canvas.width / 2, 600);
      ctx.shadowBlur = 0;

      // Save final image
      fs.writeFileSync(imagePaths.output, canvas.toBuffer());

      // Send result
      return api.sendMessage({
        body: `💞 ${name1} ❤️ ${name2}\n🧠 প্রেমের সম্ভাবনা: ${rate}%\n💘 শুভ কামনা!`,
        mentions: [{ tag: name1, id: id1 }, { tag: name2, id: id2 }],
        attachment: fs.createReadStream(imagePaths.output)
      }, event.threadID, () => {
        // Cleanup
        for (let key in imagePaths) {
          if (fs.existsSync(imagePaths[key])) fs.unlinkSync(imagePaths[key]);
        }
      });

    } catch (err) {
      console.error("Pair command error:", err);
      return api.sendMessage(`❌ ছবি তৈরিতে সমস্যা হয়েছে।`, event.threadID);
    }
  }
};
