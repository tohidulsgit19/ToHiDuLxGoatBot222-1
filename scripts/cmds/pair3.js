module.exports = {
  config: {
    name: "pair2",
    version: "2.0",
    author: "Tohidul (Monospace name fix)",
    shortDescription: {
      en: "Pair with a random girl 😗",
      vi: ""
    },
    category: "love",
    guide: "{prefix}pair2"
  },

  // Helper to convert normal string to monospace unicode letters
  toMonospace: function(text) {
    const monospaceStart = 0x1D670; // Mathematical monospace capital A start
    const lowerStart = 0x1D68A; // Mathematical monospace small a start
    let result = "";

    for (const char of text) {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // A-Z
        result += String.fromCodePoint(monospaceStart + (code - 65));
      } else if (code >= 97 && code <= 122) {
        // a-z
        result += String.fromCodePoint(lowerStart + (code - 97));
      } else if (code === 32) {
        result += " "; // space stays space
      } else {
        // For other chars, keep as is
        result += char;
      }
    }
    return result;
  },

  onStart: async function({ event, threadsData, message, usersData }) {
    const uidI = event.senderID;

    // Get names with fallback
    let name1 = await usersData.getName(uidI);
    if (!name1 || typeof name1 !== "string") name1 = "Unknown User";

    const threadData = await threadsData.get(event.threadID);
    const members = threadData.members.filter(member => member.gender === "FEMALE" && member.inGroup);

    if (!members.length) return message.reply("😕 Group e kono meye nai je pairing kora jai...");

    const randomMember = members[Math.floor(Math.random() * members.length)];

    let name2 = await usersData.getName(randomMember.userID);
    if (!name2 || typeof name2 !== "string") name2 = "Unknown Girl";

    const lovePercent = Math.floor(Math.random() * 36) + 65;
    const compatPercent = Math.floor(Math.random() * 36) + 65;

    // convert names to monospace font
    const monoName1 = this.toMonospace(name1);
    const monoName2 = this.toMonospace(name2);

    const textMessage = 
`💞 𝙇𝙤𝙫𝙚 𝙈𝙖𝙩𝙘𝙝 𝙎𝙥𝙤𝙩𝙩𝙚𝙙 💘

🥰 𝙉𝙚𝙬 𝙘𝙪𝙩𝙚 𝙥𝙖𝙞𝙧 𝙞𝙨 𝙝𝙚𝙧𝙚!
💑 ${monoName1} ❤️ ${monoName2}

🔢 𝙇𝙤𝙫𝙚 𝙋𝙚𝙧𝙘𝙚𝙣𝙩: ${lovePercent}% 💓
🎯 𝘾𝙤𝙢𝙥𝙖𝙩𝙞𝙗𝙞𝙡𝙞𝙩𝙮: ${compatPercent}% 🌈

🫶 𝘾𝙤𝙣𝙜𝙧𝙖𝙩𝙨! 𝙎𝙤𝙢𝙚 𝙡𝙤𝙫𝙚 𝙨𝙩𝙤𝙧𝙞𝙚𝙨 𝙗𝙚𝙜𝙞𝙣 𝙡𝙞𝙠𝙚 𝙩𝙝𝙞𝙨... ✨`;

    return message.reply(textMessage);
  }
};
