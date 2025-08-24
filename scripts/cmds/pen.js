module.exports = {
  config: {
    name: "pen",
    version: "2.0",
    author: "FixedByChatGPT",
    countDown: 5,
    role: 2,
    shortDescription: "Manage pending group requests",
    longDescription: "Approve or reject pending group requests in spam list or unapproved groups",
    category: "admin",
    guide: "{pn} - view pending list\n{pn} approve <numbers> - approve selected groups\n{pn} cancel <numbers> - reject selected groups"
  },

  langs: {
    en: {
      invalidNumber: "⚠️ | Invalid Input\n» %1 is not a valid number. Please enter numbers only.",
      cancelSuccess: "❌ | Request Denied\n» Successfully rejected %1 group request(s).",
      approveSuccess: "✅ | Request Approved\n» Successfully approved %1 group(s).",
      cantGetPendingList: "⚠️ | Error\n» Failed to retrieve pending list. Please try again later.",
      returnListPending: "📋 | Pending Groups (%1)\n%2\nReply with:\n✅ '{pn} approve <numbers>'\n❌ '{pn} cancel <numbers>'",
      returnListClean: "ℹ️ | No Pending Groups\n» There are currently no groups in the pending list.",
      noSelection: "⚠️ | Missing Input\n» Please specify which groups to process. Example: '{pn} approve 1 2 3'",
      instruction: "📝 | Instructions\n1. View pending groups with '{pn}'\n2. Approve with '{pn} approve <numbers>'\n3. Reject with '{pn} cancel <numbers>'"
    }
  },

  onStart: async function({ api, event, getLang, commandName, args }) {
    const { threadID, messageID, senderID } = event;

    if (args[0]?.toLowerCase() === 'help') {
      return api.sendMessage(getLang("instruction").replace(/{pn}/g, commandName), threadID, messageID);
    }

    try {
      // Fetch pending + spam groups
      const [spam, pending] = await Promise.all([
        api.getThreadList(100, null, ["OTHER"]).catch(() => []),
        api.getThreadList(100, null, ["PENDING"]).catch(() => [])
      ]);

      let list = [...spam, ...pending].filter(t => t.isGroup && t.isSubscribed);

      if (list.length === 0) {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }

      // Map index for selection
      list = list.map((group, index) => ({ ...group, displayIndex: index + 1 }));

      // Create message
      const msg = list.map(g =>
        `#${g.displayIndex} • ${g.name || "Unnamed Group"} (${g.participantIDs.length} members)`
      ).join("\n");

      const replyMsg = await api.sendMessage(
        getLang("returnListPending", list.length, msg).replace(/{pn}/g, commandName),
        threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: senderID,
              pending: list
            });
          }
        },
        messageID
      );

      // Auto cleanup after 5 mins
      setTimeout(() => {
        if (replyMsg?.messageID) global.GoatBot.onReply.delete(replyMsg.messageID);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error(error);
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  },

  onReply: async function({ api, event, Reply, getLang, commandName }) {
    if (!Reply) return;
    if (String(event.senderID) !== String(Reply.author)) return;

    const { body, threadID, messageID } = event;
    const args = body.trim().split(/\s+/);
    const action = args[0]?.toLowerCase();

    if (!action || !["approve", "cancel"].includes(action)) {
      return api.sendMessage(getLang("noSelection").replace(/{pn}/g, commandName), threadID, messageID);
    }

    const numbers = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));
    if (numbers.length === 0) {
      return api.sendMessage(getLang("invalidNumber", "empty selection"), threadID, messageID);
    }

    const invalid = numbers.filter(n => n <= 0 || n > Reply.pending.length);
    if (invalid.length > 0) {
      return api.sendMessage(getLang("invalidNumber", invalid.join(", ")), threadID, messageID);
    }

    const selected = numbers.map(n => Reply.pending[n - 1]);
    let successCount = 0;

    for (const group of selected) {
      try {
        if (action === "approve") {
          await api.sendMessage("✅ | Group approved by admin.", group.threadID);
        } else {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to process group ${group.threadID}:`, err);
      }
    }

    const msg = action === "approve"
      ? getLang("approveSuccess", successCount)
      : getLang("cancelSuccess", successCount);

    api.sendMessage(msg, threadID, messageID);

    if (Reply.messageID) global.GoatBot.onReply.delete(Reply.messageID);
  }
};
