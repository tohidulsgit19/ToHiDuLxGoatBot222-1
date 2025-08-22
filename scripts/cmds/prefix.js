const fs = require("fs-extra");
const { utils } = global;

// quote-card style formatter
function formatInfo(botName, systemPrefix, boxPrefix, ownerLink) {
  return [
    `『 🤖 ${botName} 』`,
    `❏ System = ${systemPrefix}`,
    `❏ Box = ${boxPrefix}`,
    `❏ Owner = ${ownerLink}`
  ].join("\n");
}

module.exports = {
  config: {
    name: "prefix",
    version: "2.1",
    author: "NTKhang • Remade by TOHIDUL ",
    countDown: 5,
    role: 0,
    description: "Change bot prefix per-thread or globally (admin only). Styled outputs.",
    category: "config",

    // এখানে সরাসরি ownerLink বসাও 👇
    ownerLink: "m.me/mdtohidulislam063",

    guide: {
      en:
        "   {pn} <new prefix> : change prefix for this chat\n"
        + "   {pn} <new prefix> -g : change system prefix (admin only)\n"
        + "   {pn} reset : reset this chat prefix to default\n"
        + "   Type 'prefix' to view current prefixes (styled)"
    }
  },

  langs: {
    en: {
      confirmGlobal: "Please react to confirm changing the system prefix.",
      confirmThisThread: "Please react to confirm changing the prefix in this chat.",
      onlyAdmin: "Only bot admins can change the system prefix.",
      successGlobal: "System prefix changed successfully.",
      successThisThread: "This chat prefix changed successfully.",
      resetDone: "This chat prefix has been reset to default."
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    const cfg = global.GoatBot?.config || {};
    const botName = cfg.botName || "Bot";
    const systemPrefix = cfg.prefix;
    const currentBoxPrefix = utils.getPrefix(event.threadID);
    const ownerLink = this.config.ownerLink;

    if (!args[0]) {
      const card = formatInfo(botName, systemPrefix, currentBoxPrefix, ownerLink);
      return message.reply(card);
    }

    if (args[0].toLowerCase() === "reset") {
      await threadsData.set(event.threadID, null, "data.prefix");
      const card = formatInfo(botName, systemPrefix, utils.getPrefix(event.threadID), ownerLink);
      return message.reply(`${card}\n\n✔️ ${getLang("resetDone")}`);
    }

    const newPrefix = args[0];
    const isGlobal = args[1] === "-g";

    if (isGlobal && role < 2) {
      const card = formatInfo(botName, systemPrefix, currentBoxPrefix, ownerLink);
      return message.reply(`${card}\n\n⚠️ ${getLang("onlyAdmin")}`);
    }

    const confirmText = isGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread");
    const card = formatInfo(botName, systemPrefix, currentBoxPrefix, ownerLink);

    const formSet = {
      commandName,
      author: event.senderID,
      newPrefix,
      setGlobal: isGlobal
    };

    return message.reply(`${card}\n\n❓ ${confirmText}`, (err, info) => {
      if (err) return;
      formSet.messageID = info.messageID;
      global.GoatBot.onReaction.set(info.messageID, formSet);
    });
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal } = Reaction;
    if (event.userID !== author) return;

    const cfg = global.GoatBot?.config || {};
    const botName = cfg.botName || "Bot";
    const ownerLink = this.config.ownerLink;

    if (setGlobal) {
      global.GoatBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
      const card = formatInfo(botName, global.GoatBot.config.prefix, utils.getPrefix(event.threadID), ownerLink);
      return message.reply(`${card}\n\n✅ ${getLang("successGlobal")}`);
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      const card = formatInfo(botName, global.GoatBot.config.prefix, utils.getPrefix(event.threadID), ownerLink);
      return message.reply(`${card}\n\n✅ ${getLang("successThisThread")}`);
    }
  },

  onChat: async function ({ event, message }) {
    if (event.body && event.body.trim().toLowerCase() === "prefix") {
      const cfg = global.GoatBot?.config || {};
      const botName = cfg.botName || "Bot";
      const ownerLink = this.config.ownerLink;
      const systemPrefix = cfg.prefix;
      const boxPrefix = utils.getPrefix(event.threadID);
      const card = formatInfo(botName, systemPrefix, boxPrefix, ownerLink);
      return () => message.reply(card);
    }
  }
};
