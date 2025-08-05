const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "datetime",
    version: "1.4",
    author: "kae",
    countdown: 5,
    role: 0,
    shortDescription: "বাংলাদেশের সময় ও তারিখ দেখায়",
    longDescription: "",
    category: "misc",
    guide: "{prefix}{name}",
    envConfig: {}
  },

  onStart: async function({ message, args }) {
    const bdTime = moment.tz("Asia/Dhaka").format("h:mm:ss A");
    const bdDate = moment.tz("Asia/Dhaka").format("dddd, DD MMMM YYYY");

    const reply = `
🌟 আজকের বাংলাদেশ সময় 🌟

━━━━━━━━━━━━━━━━━━━
📅 তারিখ: ${bdDate}
⏰ সময়: ${bdTime}
━━━━━━━━━━━━━━━━━━━

আসো, আজকের দিনটা কাটাই রঙিন 😊💙
    `;

    message.reply(reply.trim());
  },
  onEvent: async function() {}
};
