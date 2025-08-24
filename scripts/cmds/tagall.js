module.exports = {
  config: {
    name: "tag",
    version: "1.0",
    author: "Modified by Tohidul",
    countDown: 5,
    role: 1,
    description: "Reply করলে ওই ইউজার mention হবে, না দিলে সবার mention হবে",
    category: "box chat",
    guide: {
      en: "{pn} [reply/empty]\n\nReply করলে ওই ইউজার mention হবে\nনা দিলে সবার mention হবে"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const { participantIDs, messageReply } = event;

    // ✅ যদি রিপ্লাই থাকে → ওই ইউজার mention
    if (messageReply) {
      const sender = messageReply.senderID;
      const name = messageReply.body?.split(" ").slice(0, 3).join(" ") || "this user";

      return message.reply({
        body: `📌 Mentioned: ${name}`,
        mentions: [{ tag: name, id: sender }]
      });
    }

    // ✅ যদি রিপ্লাই না থাকে → সবার mention
    const mentions = [];
    let body = args.join(" ") || "@all";
    let bodyLength = body.length;
    let i = 0;

    for (const uid of participantIDs) {
      let fromIndex = 0;
      if (bodyLength < participantIDs.length) {
        body += body[bodyLength - 1];
        bodyLength++;
      }
      if (body.slice(0, i).lastIndexOf(body[i]) != -1)
        fromIndex = i;

      mentions.push({
        tag: body[i],
        id: uid,
        fromIndex
      });
      i++;
    }

    return message.reply({ body, mentions });
  }
};
