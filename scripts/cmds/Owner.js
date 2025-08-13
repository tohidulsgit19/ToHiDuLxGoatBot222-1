const fs = require("fs-extra"); const path = require("path"); const moment = require("moment-timezone");

module.exports = { config: { name: "owner", aliases: ["admin", "creator", "author"], version: "1.1.0", author: "Tohidul", countDown: 5, role: 0, shortDescription: "Show Bot Owner info in a stylish card", longDescription: "Displays the bot owner's profile, social links, and current Dhaka time with an optional image attachment and auto unsend.", category: "info", guide: { en: "{pn} — show owner info\n{pn} links — show only social links", bn: "{pn} — ওনার সম্পর্কে তথ্য দেখাবে\n{pn} links — শুধু সোশ্যাল লিংক দেখাবে" }, usePrefix: true },

// ====== EDIT THESE TO YOUR LIKING ====== ownerCard: { name: "𝙏 𝙊 𝙃 𝙄 𝘿 𝙐 𝙇 ッ", gender: "Male", relation: "Single", age: "18+", religion: "Islam", education: "Inter 2nd Year", address: "Thakurgaon, Bangladesh", socials: { tiktok: "-----------", telegram: "https://t.me/NFTTOHIDUL19", facebook: "https://www.facebook.com/profile.php?id=100092006324917" }, // Put an image named 'owner.png' in the same folder under ./cache/ imageRelative: path.join("cache", "owner.png"), // Auto unsend after N seconds (0 = don't unsend) autoUnsendSeconds: 120 },

onStart: async function ({ message, api, event, args }) { try { const now = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A"); const { name, gender, relation, age, religion, education, address, socials, imageRelative, autoUnsendSeconds } = this.ownerCard;

const header = "╭─────〔 👑 𝗕𝗢𝗧 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 👑 〕─────╮";
  const bodyLines = [
    `┃ 🏷️ 𝗡𝗮𝗺𝗲       : ${name}`,
    `┃ 👨‍💼 𝗚𝗲𝗻𝗱𝗲𝗿     : ${gender}`,
    `┃ 💖 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻   : ${relation}`,
    `┃ 🎂 𝗔𝗴𝗲         : ${age}`,
    `┃ 🕌 𝗥𝗲𝗹𝗶𝗴𝗶𝗼𝗻    : ${religion}`,
    `┃ 🎓 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗼𝗻  : ${education}`,
    `┃ 🏠 𝗔𝗱𝗱𝗿𝗲𝘀𝘀    : ${address}`
  ];

  const linksBlock = [
    "┣━━━〔 🌐 𝗦𝗢𝗖𝗜𝗔𝗟 𝗟𝗜𝗡𝗞𝗦 〕━━━┫",
    `┃ 🎭 TikTok    : ${socials.tiktok}`,
    `┃ ✈️ Telegram  : ${socials.telegram}`,
    `┃ 🌍 Facebook  : ${socials.facebook}`
  ];

  const timeBlock = [
    "┣━━━〔 ⏰ 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 𝗧𝗜𝗠𝗘 〕━━━┫",
    `┃ 🕒 ${now}`
  ];

  const footer = "╰──────────────────────────────╯\n💌 𝑪𝒓𝒆𝒂𝒕𝒆𝒅 𝒃𝒚 𝑻𝑶𝑯𝑰𝑫𝑼𝑳";

  const showOnlyLinks = args[0] && args[0].toLowerCase() === "links";

  const content = showOnlyLinks
    ? ["〔 🌐 𝗦𝗢𝗖𝗜𝗔𝗟 𝗟𝗜𝗡𝗞𝗦 〕", linksBlock.slice(1).join("\n")].join("\n")
    : [header, "┃", ...bodyLines, "┃", ...linksBlock, ...timeBlock, footer].join("\n");

  // Try attaching image if exists
  const imagePath = path.join(__dirname, imageRelative);
  const hasImage = fs.existsSync(imagePath);

  const msgPayload = hasImage
    ? { body: content, attachment: fs.createReadStream(imagePath) }
    : { body: content + (!hasImage ? "\n\n[ℹ️] Put an image at ./cache/owner.png to show a photo." : "") };

  const sent = await message.reply(msgPayload);

  // Auto unsend if enabled
  if (autoUnsendSeconds && Number(autoUnsendSeconds) > 0) {
    setTimeout(() => {
      api.unsendMessage(sent.messageID);
    }, Number(autoUnsendSeconds) * 1000);
  }
} catch (err) {
  console.error("owner.js error:", err);
  return message.reply("❌ একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
}

} };

