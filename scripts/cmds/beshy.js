module.exports = {
  config: {
    name: "addemoji",
    version: "1.0",
    author: "tohidul",
    role: 0,
    category: "fun",
    shortDescription: "🤸‍♂️ beshy beshy 🤸‍♂️",
    longDescription: "তোমার লেখাকে beshy স্টাইলে 🤸‍♂️ সাজিয়ে দেয়",
    guide: {
      en: "{pn} [text] — প্রতিটি শব্দের পরে 🤸‍♂️ যোগ করবে"
    }
  },

  onStart: async function ({ api, event, args }) {
    if (args.length === 0) return api.sendMessage("তুমি কিছু লেখো তো আগে 😒", event.threadID, event.messageID);
    const message = args.map(word => word + '🤸‍♂️').join(' ');
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
