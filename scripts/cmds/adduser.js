const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "adduser",
		version: "2.0",
		author: "NTKhang | Modified by Tas33n",
		countDown: 5,
		role: 1,
		description: {
			vi: "Thêm thành viên vào nhóm bằng cách reply",
			en: "Add a member to the group by replying"
		},
		category: "box chat",
		guide: {
			en: "   {pn} [reply to user you want to add]"
		}
	},

	langs: {
		en: {
			alreadyInGroup: "User is already in the group.",
			successAdd: "✅ Successfully added user to the group.",
			failedAdd: "❌ Failed to add user. They may have locked privacy settings or blocked the bot.",
			noReply: "❌ Please reply to someone's message to add them."
		}
	},

	onStart: async function ({ api, event, threadsData, getLang, message }) {
		const botID = api.getCurrentUserID();
		const threadInfo = await threadsData.get(event.threadID);
		const { members, adminIDs, approvalMode } = threadInfo;

		const replyMsg = event.messageReply;
		if (!replyMsg || !replyMsg.senderID)
			return message.reply(getLang("noReply"));

		const uid = replyMsg.senderID;

		// Check if user already in group
		if (members.some(m => m.userID == uid && m.inGroup))
			return message.reply(getLang("alreadyInGroup"));

		try {
			await api.addUserToGroup(uid, event.threadID);

			if (approvalMode && !adminIDs.includes(botID))
				return message.reply("✅ User added to approval list (waiting for admin approval).");

			return message.reply(getLang("successAdd"));
		} catch (err) {
			return message.reply(getLang("failedAdd"));
		}
	}
};
