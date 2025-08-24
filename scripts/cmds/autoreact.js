module.exports = {
  config: {
    name: "autoreact",
    version: "3.0",
    author: "Tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "Auto reacts to keywords, phrases, or emojis",
    longDescription: "Automatically reacts to specific words, phrases, or emojis in chat messages.",
    category: "auto",
  },

  onStart: async function () {
    console.log("[autoreact] Module loaded ✅");
  },

  onChat: async function ({ event, api }) {
    if (!event.body) return;
    const msg = event.body.toLowerCase();

    // Keyword / phrase / emoji → reaction emoji mapping
    const reactions = {
      "iloveyou": "💗",
      "love": "💗",
      "good night": "💤",
      "good morning": "🌞",
      "good afternoon": "🌤️",
      "good evening": "🌆",
      "assalamualaikum": "🤲",
      "tohidul": "💗",
      "soitan": "😡",
      "fuck": "🤬",
      "gay": "🏳️‍🌈",
      "happy": "😆",
      "lol": "😂",
      "😂": "😂",
      "🤣": "🤣",
      "😢": "😢",
      "😭": "😭",
      "😆": "😆",
      "😎": "😎",
      "wow": "😲",
      "amazing": "🤩",
      "congrats": "🎉",
      "🎉": "🎉",
      "sad": "😔",
      "angry": "😡",
      "❤": "❤",
      "❤️": "❤️",
      "🔥": "🔥",
      "100": "💯",
      "💯": "💯"
    };

    // React only to the first matched keyword per message
    for (const [keyword, emoji] of Object.entries(reactions)) {
      if (msg.includes(keyword)) {
        try {
          await api.setMessageReaction(emoji, event.messageID, () => {}, true);
        } catch (err) {
          console.error("[autoreact] Reaction failed:", err);
        }
        break;
      }
    }
  }
};
