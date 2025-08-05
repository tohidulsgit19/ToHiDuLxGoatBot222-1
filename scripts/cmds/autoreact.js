module.exports = {
  config: {
    name: "autoreact",
    version: "1.0",
    author: "tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "Auto reaction bot",
    longDescription: "Automatically reacts to certain words",
    category: "auto",
  },

  onStart: async function () { },

  onChat: async function ({ event, api }) {
    if (!event.body) return; // Skip if no message body
    const msg = event.body.toLowerCase();

    const react = (emoji) => api.setMessageReaction(emoji, event.messageID, () => {}, true);

    if (msg.includes("iloveyou")) return react("💗");
    if (msg.includes("good night")) return react("💗");
    if (msg.includes("good morning")) return react("😆");
    if (msg.includes("fuck")) return react("🤬");
    if (msg.includes("tohidul")) return react("💗");
    if (msg.includes("assalamualaikum")) return react("💗");
    if (msg.includes("😢")) return react("😢");
    if (msg.includes("😆")) return react("😆");
    if (msg.includes("😂")) return react("😆");
    if (msg.includes("🤣")) return react("😆");
    if (msg.includes("soitan")) return react("😡");
    if (msg.includes("good afternoon")) return react("❤");
    if (msg.includes("good evening")) return react("❤");
    if (msg.includes("gay")) return react("😡");
  }
};
