module.exports = {
  config: {
    name: "beauty",
    version: "1.3",
    author: "Samir | Modified by ChatGPT",
    role: 0,
    category: "fun",
    shortDescription: "কার কতটুকু সুন্দর তা দেখাও",
    longDescription: "র‍্যান্ডমভাবে সৌন্দর্য রেটিং মাপো বাংলা মজার স্টাইলে",
    guide: {
      en: "{pn} [@mention] — নিজে অথবা অন্য কাউকে রেটিং দাও 😍"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const mention = Object.keys(event.mentions || {})[0] || event.senderID;
    const name = event.mentions?.[mention] || await usersData.getName(mention);
    const percentage = Math.floor(Math.random() * 101); // 0–100%

    let message;

    if (percentage === 100) {
      message =
        `💘 ${name}, তুমি ১০০% সুন্দর!!\n` +
        `Cuteness Overload detected! 💥\n` +
        `রূপের এমন ঝলক যে সার্ভার হ্যাং! 🤯\n` +
        `তোমারে দেখলে Cupid-ও প্রেমে পড়ে! 😍`;
    } else if (percentage >= 80) {
      message = `🔥 ${name}, রূপের আগুন! তুমি ${percentage}% সুন্দর! 😍`;
    } else if (percentage >= 50) {
      message = `😌 ${name}, Not bad! তুমি ${percentage}% সুন্দর! 😉`;
    } else if (percentage >= 20) {
      message = `😅 ${name}, ${percentage}% সুন্দর... আরেকটু যত্ন নাও ভাই 🧴`;
    } else {
      message = `🫣 ${name}, ${percentage}% সুন্দর?! আয়না আজ ভুল দেখালো নাকি? 🤡`;
    }

    return api.sendMessage({
      body: message,
      mentions: mention !== event.senderID ? [{
        tag: name,
        id: mention
      }] : []
    }, event.threadID, event.messageID);
  }
};
