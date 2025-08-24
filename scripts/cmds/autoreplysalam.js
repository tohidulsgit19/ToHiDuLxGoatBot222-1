module.exports = {
  config: {
    name: "autoreplysalam",
    version: "1.0",
    author: "Tohidul",
    countDown: 5,
    role: 0,
    shortDescription: "Auto-reply to Salam messages",
    longDescription: "Automatically replies 'Waalaikumussalam' when someone says Salam or Assalamualaikum.",
    category: "auto",
  },

 onChat: async function ({ event, api }) {
    if (!event.body) return;
    const msg = event.body.toLowerCase();

    // যদি কেউ salam বা assalamualaikum লিখে
    if (msg.includes("salam") || msg.includes("assalamualaikum")) {
      try {
        await api.sendMessage("Waalaikumussalam 🤲", event.threadID, event.messageID);
      } catch (err) {
        console.error("[autoreplysalam] Reply failed:", err);
      }
    }
  }
};
