const axios = require('axios');

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
  return base.data.api;
};

module.exports = {
  config: {
    name: "baby",
    version: "6.9.9",
    credits: "dipto",
    cooldowns: 0,
    hasPermission: 0,
    description: "Better than all sim simi",
    category: "chat",
    usages: `[message] | list | all | msg [text]`,
    usePrefix: true,
    prefix: true
  },

  onStart: async function ({ message, event, args, usersData }) {
    const uid = event.senderID;
    const link = `${await baseApiUrl()}/baby`;
    const input = args.join(" ").toLowerCase();

    if (!args[0]) {
      const ran = [
        "Bolo baby", "hum", "type help baby", "type !baby hi",
        "Hey there!", "How can I help you?", "Type something to chat!",
        "I'm here to chat!", "What's up?", "Say anything to start a chat."
      ];
      return message.reply(ran[Math.floor(Math.random() * ran.length)]);
    }

    if (args[0] === 'list') {
      const res = await axios.get(`${link}?list=all`);
      if (args[1] === 'all') {
        const data = res.data.teacher.teacherList;
        const teachers = await Promise.all(data.map(async (item) => {
          const number = Object.keys(item)[0];
          const value = item[number];
          const name = await usersData.getName(number).catch(() => "unknown");
          return { name, value };
        }));
        teachers.sort((a, b) => b.value - a.value);
        const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
        return message.reply(`👑 Total Teach: ${res.data.length}\n\nList of Teachers:\n${output}`);
      } else {
        return message.reply(`Total Teach: ${res.data.length}`);
      }
    }

    if (args[0] === 'msg' || args[0] === 'message') {
      const q = input.replace("msg ", "").replace("message ", "");
      const res = await axios.get(`${link}?list=${q}`);
      return message.reply(`Message \"${q}\" = ${res.data.data}`);
    }

    const res = await axios.get(`${link}?text=${encodeURIComponent(input)}&senderID=${uid}&font=1`);
    const replyText = res.data.reply;
    return message.reply(replyText, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: uid,
          apiUrl: link,
          lastText: replyText
        });
      }
    });
  },

  onReply: async function ({ message, event, Reply }) {
    if (event.senderID !== Reply.author) return;
    
    const userInput = event.body.toLowerCase();
    const apiUrl = await baseApiUrl();
    const res = await axios.get(`${apiUrl}/baby?text=${encodeURIComponent(userInput)}&senderID=${event.senderID}&font=1`);
    const replyText = res.data.reply;
    return message.reply(replyText, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          apiUrl: apiUrl,
          lastText: replyText
        });
      }
    });
  },

  onChat: async function ({ message, event }) {
    const body = event.body?.toLowerCase() || "";
    const triggers = ["baby", "bby", "bot", "jan", "babu", "janu", "bbu", "bbz", "জান", "জানু", "বেবি", "বেব", "বট", "মাকিমা", "makima"];
    const found = triggers.find(word => body.startsWith(word));
    if (!found) return;

    const content = body.replace(/^[^\s]+\s*/, "");

    if (!content) {
      const replies = [
        "✨ 𝗬𝗲𝘀 😄, 𝗕𝗼𝗹𝗼 𝗕𝗯𝘇 💋",
        "💬 𝗧𝗺𝗿 𝗣𝗼𝗼𝗸𝗶𝗲 𝗸𝗶 𝗰𝗵𝗲𝗸𝗮 𝗱𝗶𝘀𝗲 🥸\n🗣️ “𝗝𝗲 𝗮𝗺𝗮𝗸𝗲 𝗱𝗮𝗸𝗼...” 😼",
        "🐾 𝗕𝗼𝗹𝗼 𝗰𝘂𝘁𝗲𝗲 𝗽𝗮𝗶𝗯 😻",
        "🙄 𝗔𝗺𝗮𝗸𝗲 𝗻𝗮 𝗱𝗲𝗸𝗲...\n🕵️‍♂️ 𝗔𝗺𝗮𝗿 𝗕𝗼𝘀𝘀 𝗧𝗼𝗵𝗶𝗱𝘂𝗹 𝗲𝗿 𝗶𝗻𝗯𝗼𝘅 𝗲 𝗷𝗮𝘄 😒",
        "❌ 𝗥𝗲𝗷𝗲𝗰𝘁𝗲𝗱 😏😎\n🚫 𝗡𝗼 𝗰𝗵𝗮𝗻𝗰𝗲 𝗯𝗮𝗯𝘆!",
        "👑 𝗞𝗮𝘄𝗿𝗲 𝗽𝗮𝘁𝘁𝗮 𝗱𝗶𝗺𝘂 𝗻𝗮 😎\n🛍️ 𝗞𝗮𝗿𝗼𝗻 𝗙𝗮𝗶𝗿 & 𝗟𝗶𝘃𝗲𝗹𝘆 𝗸𝗶𝗻𝗰𝗵𝗶 😏💅",
        "🧠 𝗧𝘂𝗺𝗶 𝘁𝗼 𝘀𝗲𝗶 𝗽𝗮𝗴𝗼𝗹 𝘁𝗮 𝗻𝗮 🤔\n😹 𝗖𝗵𝗶𝗻𝘁𝗲𝗶 𝗽𝗮𝗿𝗰𝗵𝗶!",
        "📵 𝗕𝗲𝘀𝗶 𝗱𝗮𝗸𝗹𝗲 𝗹𝗲𝗮𝘃𝗲 𝗻𝗶𝗺𝗨 ☹\n😴 𝗗𝗼 𝗻𝗼𝘁 𝗱𝗶𝘀𝘁𝘂𝗿𝗯!",
        "🙉 𝗦𝘂𝗻𝗺𝘂 𝗻𝗮 𝘁𝗺𝗶...\n💔 𝗧𝘂𝗺𝗶 𝗮𝗺𝗮𝗸𝗲 𝗳𝗿𝗲𝗺 𝗸𝗼𝗿𝗮𝗶 𝗱𝗲𝗼 𝗻𝗮𝗶 🫤",
        "🫣 𝗔𝗰𝗰𝗵𝗮 𝗵𝗮𝗶𝗻... 𝗠𝗮𝗶𝗻 𝗮𝗻𝗱𝗵𝗮 𝗵𝘂𝘂𝗻 😭\n🕳️ 𝗧𝗼𝗸𝗲 𝗱𝗲𝗸𝗵𝗶 𝗻𝗮𝗶..."
      ];
      return message.reply(replies[Math.floor(Math.random() * replies.length)], (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }
      });
    }

    const apiUrl = await baseApiUrl();
    const res = await axios.get(`${apiUrl}/baby?text=${encodeURIComponent(content)}&senderID=${event.senderID}&font=1`);
    const replyText = res.data.reply;
    return message.reply(replyText, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          apiUrl: apiUrl,
          lastText: replyText
        });
      }
    });
  }
};
