const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoami", "whoishe", "whoisshe", "stalk"],
    version: "3.0",
    author: "Tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "Spy on any user's info",
    longDescription: "View stylish profile and stat breakdown of any user",
    category: "information"
  },

  onStart: async function ({ event, message, api, args, usersData }) {
    let uid = args[0];

    if (!uid) {
      uid = Object.keys(event.mentions)[0] ||
            (event.type === "message_reply" ? event.messageReply.senderID : event.senderID);
    } else {
      if (!/^\d+$/.test(uid)) {
        const match = uid.match(/profile\.php\?id=(\d+)/);
        if (match) uid = match[1];
      }
    }

    try {
      const [userInfo, avatarUrl, userData, allUsers] = await Promise.all([
        api.getUserInfo(uid),
        usersData.getAvatarUrl(uid),
        usersData.get(uid),
        usersData.getAll()
      ]);

      const info = userInfo[uid];
      const data = userData || {};
      const all = allUsers || [];

      const gender = {
        1: "♀️ Female",
        2: "♂️ Male",
        undefined: "🌈 Custom"
      };

      const formatNumber = num => {
        if (!num || isNaN(num)) return "0";
        const units = ["", "K", "M", "B", "T"];
        let unit = 0;
        while (num >= 1000 && unit < units.length - 1) {
          num /= 1000;
          unit++;
        }
        return num.toFixed(1).replace(/\.0$/, "") + units[unit];
      };

      const getRank = (id, key) => {
        const sorted = [...all].sort((a, b) => (b[key] || 0) - (a[key] || 0));
        const rank = sorted.findIndex(u => u.userID == id);
        return rank >= 0 ? rank + 1 : "N/A";
      };

      const createSection = (title, items) => {
        let section = `╭── 🎯 ${title} ──\n`;
        items.forEach(([label, val]) => {
          section += `│ ${label.padEnd(12)}: ${val}\n`;
        });
        section += `╰─────────────────────`;
        return section;
      };

      const profileSection = createSection("PROFILE", [
        ["🎭 Name", info.name],
        ["🧬 Gender", gender[info.gender]],
        ["🆔 UID", uid],
        ["🏷️ Username", info.vanity || "None"],
        ["👑 Status", info.type?.toUpperCase() || "User"],
        ["🎂 Birthday", info.isBirthday || "Private"],
        ["💫 Nickname", info.alternateName || "None"],
        ["🤖 Bot Friend", info.isFriend ? "✅ Yes" : "❌ No"]
      ]);

      const statsSection = createSection("STATISTICS", [
        ["💰 Money", `$${formatNumber(data.money || 0)}`],
        ["⭐ EXP", formatNumber(data.exp || 0)],
        ["🏆 EXP Rank", `#${getRank(uid, "exp")}/${all.length}`],
        ["💎 Wealth Rank", `#${getRank(uid, "money")}/${all.length}`]
      ]);

      const profileLink = info.profileUrl ? `🌐 Profile: ${info.profileUrl.replace("www.facebook", "fb")}` : "";

      await message.reply({
        body: `${profileSection}\n\n${statsSection}\n\n${profileLink}`,
        attachment: await global.utils.getStreamFromURL(avatarUrl)
      });

    } catch (err) {
      console.error("Spy error:", err);
      return message.reply("⚠️ Couldn't spy this user. Maybe they vanished from the matrix.");
    }
  }
};
