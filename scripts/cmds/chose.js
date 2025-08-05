module.exports = {
  config: {
    name: "choose",
    version: "1.0",
    author: "tohidul",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "The bot chooses from options"
    },
    longDescription: {
      en: "Helps you randomly choose between multiple options separated by '-'"
    },
    category: "games",
    guide: {
      en: "choose option1 - option2 - option3"
    }
  },

  langs: {
    en: {
      many: "❌ Please provide at least two options separated by '-'"
    }
  },

  onStart: async function ({ message, args, getLang }) {
    const options = args.join(" ").split("-").map(opt => opt.trim()).filter(Boolean);

    if (options.length < 2) return message.reply(getLang("many"));

    const selected = options[Math.floor(Math.random() * options.length)];
    return message.reply(`✅ I choose: **${selected}**`);
  }
};
