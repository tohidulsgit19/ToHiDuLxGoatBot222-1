const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair3",
    version: "1.0",
    author: "tohidul",
    shortDescription: {
      en: "Pair with a random girl 😗",
      vi: ""
    },
    category: "love",
    guide: "{prefix}pair3"
  },

  onStart: async function({ event, threadsData, message, usersData }) {
    const uidI = event.senderID;
    const avatarUrl1 = await usersData.getAvatarUrl(uidI);
    const name1 = await usersData.getName(uidI);
    const threadData = await threadsData.get(event.threadID);
    const members = threadData.members.filter(member => member.gender === "FEMALE" && member.inGroup);

    if (!members.length) return message.reply("😕 Group e kono meye nai je pairing kora jai...");

    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];
    const name2 = await usersData.getName(randomMember.userID);
    const avatarUrl2 = await usersData.getAvatarUrl(randomMember.userID);
    const lovePercent = Math.floor(Math.random() * 36) + 65;
    const compatPercent = Math.floor(Math.random() * 36) + 65;

    return message.reply({
      body: 
`💞 𝙇𝙤𝙫𝙚 𝙈𝙖𝙩𝙘𝙝 𝙎𝙥𝙤𝙩𝙩𝙚𝙙 💘

🥰 𝙉𝙚𝙬 𝙘𝙪𝙩𝙚 𝙥𝙖𝙞𝙧 𝙞𝙨 𝙝𝙚𝙧𝙚!
💑 ${name1} ❤️ ${name2}

🔢 𝙇𝙤𝙫𝙚 𝙋𝙚𝙧𝙘𝙚𝙣𝙩: ${lovePercent}% 💓
🎯 𝘾𝙤𝙢𝙥𝙖𝙩𝙞𝙗𝙞𝙡𝙞𝙩𝙮: ${compatPercent}% 🌈

🫶 𝘾𝙤𝙣𝙜𝙧𝙖𝙩𝙨! 𝙎𝙤𝙢𝙚 𝙡𝙤𝙫𝙚 𝙨𝙩𝙤𝙧𝙞𝙚𝙨 𝙗𝙚𝙜𝙞𝙣 𝙡𝙞𝙠𝙚 𝙩𝙝𝙞𝙨... ✨`,
      attachment: [
        await getStreamFromURL(avatarUrl1),
        await getStreamFromURL(avatarUrl2)
      ]
    });
  }
};
