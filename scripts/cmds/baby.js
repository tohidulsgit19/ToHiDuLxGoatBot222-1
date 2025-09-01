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
    const triggers = ["baby", "bby", "bot", "jan", "babu", "janu", "bbu", "bbz", "জান", "জানু", "বেবি", "বেব", "বট", "মাকিমা", "makima","pookie","pookiee"];
    const found = triggers.find(word => body.startsWith(word));
    if (!found) return;

    const content = body.replace(/^[^\s]+\s*/, "");

    if (!content) {
      const replies = [
        "✨ 𝗬𝗲𝘀 😄, 𝗕𝗼𝗹𝗼 𝗕𝗯𝘇 💋",
        "🤭Bolo Bby Tmi Amake Bhalobasho🙊💋",
        "Haaye main mar hi jaaun💋😩  \n Jo tujhko na paaun 😫🙈",
        "Bolo Xan 💢💥",
        "Tomar Abortomane Ami FF Kheli pio \n Taw Onno Narir Songo Dai Na 💖🙈.!",
        "Jah Ghuma Tor Phn e Charge Nai🤐🤪😝",
        "Bby Aso Palai Jai 🤐💋",
        "Daiko Na Baby Jamai Marbe😩😭.!",
        "🤫😘",
        "I Am single Hee hee hee 😘😆😁"
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
