const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    version: "3.3",
    author: "Tohidul (Fixed by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "💘 র‍্যান্ডম জোড়া লাগাও",
    longDescription: "তোমার সাথে গ্রুপের বিপরীত লিঙ্গের একজনের প্রেমের সম্ভাবনা দেখায়।",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const senderID = event.senderID;
    const threadID = event.threadID;

    try {
      // Thread info
      const threadInfo = await api.getThreadInfo(threadID);
      const allUsers = threadInfo.userInfo;
      const botID = api.getCurrentUserID();

      // Sender info
      let senderName = await usersData.getName(senderID) || "User 1";
      let senderGender = "UNKNOWN";
      const senderInfo = allUsers.find(u => u.id === senderID);
      if (senderInfo) senderGender = senderInfo.gender || "UNKNOWN";

      // Candidate filter (opposite gender)
      let candidates = allUsers.filter(
        u => u.id !== senderID && u.id !== botID && !u.isGroup
      );
      if (senderGender === "FEMALE") {
        candidates = candidates.filter(u => u.gender === "MALE");
      } else if (senderGender === "MALE") {
        candidates = candidates.filter(u => u.gender === "FEMALE");
      }

      if (candidates.length === 0) {
        return api.sendMessage("😢 বিপরীত লিঙ্গের কাউকে খুঁজে পাওয়া যায়নি!", threadID);
      }

      const match = candidates[Math.floor(Math.random() * candidates.length)];
      const matchID = match.id;
      const matchName = await usersData.getName(matchID) || match.name || "User 2";

      // Random love %
      const loveRate = Math.floor(Math.random() * 101);

      // Cache paths
      const cacheDir = path.join(__dirname, "..", "cache");
      fs.ensureDirSync(cacheDir);
      const paths = {
        bg: path.join(cacheDir, "pair_bg.png"),
        avatar1: path.join(cacheDir, "avt1.png"),
        avatar2: path.join(cacheDir, "avt2.png"),
        output: path.join(cacheDir, `pair_${Date.now()}.png`)
      };

      // HD avatar fetch
      const fetchAvatar = async (uid) => {
        try {
          const res = await axios.get(
            `https://graph.facebook.com/v17.0/${uid}/picture?width=1024&height=1024&redirect=false&access_token=6628568379%7C7f7b4b6a9d06d6e0a234dd5d77df06fb`
          );
          const url = res.data.data.url;
          const img = await axios.get(url, { responseType: "arraybuffer" });
          return Buffer.from(img.data);
        } catch {
          const fallback = await axios.get(
            "https://i.postimg.cc/DZzkWv7b/default-avatar.png",
            { responseType: "arraybuffer" }
          );
          return Buffer.from(fallback.data);
        }
      };

      // Save avatars
      fs.writeFileSync(paths.avatar1, await fetchAvatar(senderID));
      fs.writeFileSync(paths.avatar2, await fetchAvatar(matchID));

      // Random background
      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png"
      ];
      const bgURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      fs.writeFileSync(paths.bg, (await axios.get(bgURL, { responseType: "arraybuffer" })).data);

      // Load images
      const bg = await loadImage(paths.bg);
      const avatar1 = await loadImage(paths.avatar1);
      const avatar2 = await loadImage(paths.avatar2);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Draw circular avatars
      const drawCircle = (img, x, y, size) => {
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
        ctx.lineWidth = 6;
        ctx.shadowColor = "rgba(255,255,255,0.7)";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawCircle(avatar1, 150, 200, 300);
      drawCircle(avatar2, canvas.width - 450, 200, 300);

      // Love percentage text
      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.shadowColor = "red";
      ctx.shadowBlur = 25;
      ctx.fillText(`${loveRate}%`, canvas.width / 2, 600);
      ctx.shadowBlur = 0;

      // Save output
      fs.writeFileSync(paths.output, canvas.toBuffer());

      // Send
      return api.sendMessage({
        body: `💞 ${senderName} ❤️ ${matchName}\n🧠 প্রেমের সম্ভাবনা: ${loveRate}%\n💘 শুভ কামনা!`,
        mentions: [
          { tag: senderName, id: senderID },
          { tag: matchName, id: matchID }
        ],
        attachment: fs.createReadStream(paths.output)
      }, threadID, () => {
        Object.values(paths).forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
      });

    } catch (err) {
      console.error("[pair.js] Error:", err);
      return api.sendMessage("❌ ছবি তৈরিতে সমস্যা হয়েছে।", threadID);
    }
  }
};
