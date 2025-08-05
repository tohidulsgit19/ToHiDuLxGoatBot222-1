const axios = require('axios');

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`);
    return base.data.api;
};

module.exports = {
  config: {
    name: "teach",
    role: 3,
    version: "7.0.0",
    credits: "TOHI-BOT-HUB",
    cooldown: 10,
    description: "Enhanced version of teach bot with new features",
    category: "teach",
    usage: "teach [message] - [reply1], [reply2], [reply3]...",
  },

  onStart: async function ({ api, event, args }) {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    const getUserName = async (userID) => {
      try {
        const userInfo = await api.getUserInfo([userID]);
        return userInfo[userID]?.name || "unknown";
      } catch (e) {
        return "unknown";
      }
    };

    if (!args[0]) {
      return api.sendMessage(`📚 𝗧𝗘𝗔𝗖𝗛 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗨𝗦𝗔𝗚𝗘 📚\n\n🔹 teach [message] - [reply1], [reply2]...\n🔹 teach amar [message] - [reply1], [reply2]...\n🔹 teach react [message] - [😄], [😂]...\n🔹 teach remove [message]\n🔹 teach list\n🔹 teach stats`, event.threadID);
    }

    if (args[0] === 'stats') {
      return api.sendMessage(`📊 𝗧𝗘𝗔𝗖𝗛𝗜𝗡𝗚 𝗦𝗧𝗔𝗧𝗦 📊\n\n👤 UID: ${uid}`, event.threadID);
    }

    if (args[0] === 'list') {
      try {
        const res = await axios.get(`${link}?list=all`);
        return api.sendMessage(`📋 𝗧𝗘𝗔𝗖𝗛𝗜𝗡𝗚 𝗟𝗜𝗦𝗧 📋\n\n🔢 Total Teaches: ${res.data.length || 0}`, event.threadID);
      } catch (err) {
        return api.sendMessage(`❌ Couldn't fetch list.`, event.threadID);
      }
    }

    if (args[0] === 'remove') {
      const message = args.slice(1).join(" ");
      if (!message) return api.sendMessage(`⚠️ Provide message to remove`, event.threadID);

      try {
        const res = await axios.get(`${link}?remove=${encodeURIComponent(message)}&senderID=${uid}`);
        return api.sendMessage(`✅ ${res.data.message}`, event.threadID);
      } catch {
        return api.sendMessage(`❌ Error removing teaching.`, event.threadID);
      }
    }

    if (dipto.includes(' - ') && args[0] !== 'remove' && args[0] !== 'list' && args[0] !== 'stats') {
      const [msg, reply] = dipto.split(' - ');
      if (!reply) return api.sendMessage(`⚠️ Invalid format. Use: teach [message] - [reply1], [reply2]`, event.threadID);

      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(reply)}&senderID=${uid}`);
      const name = await getUserName(res.data.teacher);

      return api.sendMessage(`✅ 𝗧𝗘𝗔𝗖𝗛𝗜𝗡𝗚 𝗔𝗗𝗗𝗘𝗗 ✅\n\n📝 Message: ${msg}\n💬 Replies: ${reply}\n👤 Teacher: ${name}\n📚 Total: ${res.data.teachs}`, event.threadID);
    }

    if (args[0] === 'amar' && dipto.includes(' - ')) {
      const [cmd, reply] = dipto.split(' - ');
      const msg = cmd.replace('amar ', '');

      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&reply=${encodeURIComponent(reply)}&senderID=${uid}&key=intro`);
      return api.sendMessage(`✅ 𝗣𝗘𝗥𝗦𝗢𝗡𝗔𝗟 𝗧𝗘𝗔𝗖𝗛𝗜𝗡𝗚 ✅\n\n📝 Message: ${msg}\n💬 Replies: ${reply}`, event.threadID);
    }

    if (args[0] === 'react' && dipto.includes(' - ')) {
      const [cmd, react] = dipto.split(' - ');
      const msg = cmd.replace('react ', '');

      const res = await axios.get(`${link}?teach=${encodeURIComponent(msg)}&react=${encodeURIComponent(react)}`);
      return api.sendMessage(`✅ 𝗥𝗘𝗔𝗖𝗧𝗜𝗢𝗡 𝗧𝗘𝗔𝗖𝗛𝗜𝗡𝗚 ✅\n\n📝 Message: ${msg}\n😄 Reactions: ${react}`, event.threadID);
    }

    return api.sendMessage(`⚠️ Invalid teach format. Use 'teach' to see usage.`, event.threadID);
  }
};
