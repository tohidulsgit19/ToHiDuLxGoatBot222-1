module.exports = {
  config: {
    name: "rps",
    version: "2.0",
    author: "Tohidul",
    shortDescription: "✊ Play Rock Paper Scissors with emoji style",
    longDescription: "Challenge the bot in a stylish game of ✊✋✌️",
    category: "fun",
    guide: {
      en: "{pn} <✊|✋|✌️> — Play Rock, Paper or Scissors"
    }
  },

  onStart: async function ({ message, args }) {
    const choices = ["✊", "✋", "✌️"];
    const userChoice = args[0];

    if (!userChoice || !choices.includes(userChoice)) {
      return message.reply("⚠️ Please choose: ✊ (rock), ✋ (paper), or ✌️ (scissors)");
    }

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    // Result text formatting
    const display = `🫵 You: ${userChoice}  🤖 Bot: ${botChoice}`;
    let result = "";

    if (userChoice === botChoice) {
      result = "⚖️ It's a tie! Try again maybe?";
    } else if (
      (userChoice === "✊" && botChoice === "✌️") ||
      (userChoice === "✋" && botChoice === "✊") ||
      (userChoice === "✌️" && botChoice === "✋")
    ) {
      result = "🎉 Victory! You're a champ!";
    } else {
      result = "😈 I win! Better luck next time!";
    }

    return message.reply(`╔═════[ 🎮 RPS ]═════╗\n${display}\n\n${result}\n╚═════════════════╝`);
  }
};
