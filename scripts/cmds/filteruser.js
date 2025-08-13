function sleep(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
	config: {
		name: "filteruser",
		version: "2.0",
		author: "NTKhang | Remake by Tohidul",
		countDown: 5,
		role: 1,
		description: {
			vi: "Lọc thành viên nhóm theo số tin nhắn hoặc bị khóa acc",
			en: "Filter group members by number of messages or locked account"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} [<số tin nhắn> | die]",
			en: "   {pn} [<number of messages> | die]"
		}
	},

	langs: {
		vi: {
			needAdmin: "⚠️ | Vui lòng thêm bot làm quản trị viên của box để sử dụng lệnh này",
			confirm: "⚠️ | Bạn có chắc chắn muốn xóa thành viên nhóm có số tin nhắn nhỏ hơn %1 không? (yes/no)",
			kickByBlock: "✅ | Đã xóa thành công %1 thành viên bị khóa acc",
			kickByMsg: "✅ | Đã xóa thành công %1 thành viên có số tin nhắn nhỏ hơn %2",
			kickError: "❌ | Đã xảy ra lỗi không thể kick %1 thành viên:\n%2",
			noBlock: "✅ | Không có thành viên nào bị khóa acc",
			noMsg: "✅ | Không có thành viên nào có số tin nhắn nhỏ hơn %1",
			cancel: "❌ | Đã hủy thao tác."
		},
		en: {
			needAdmin: "⚠️ | Please add the bot as a group admin to use this command",
			confirm: "⚠️ | Are you sure you want to delete group members with less than %1 messages? (yes/no)",
			kickByBlock: "✅ | Successfully removed %1 locked accounts",
			kickByMsg: "✅ | Successfully removed %1 members with less than %2 messages",
			kickError: "❌ | Could not remove %1 members:\n%2",
			noBlock: "✅ | No locked accounts found",
			noMsg: "✅ | No members with less than %1 messages",
			cancel: "❌ | Action cancelled."
		}
	},

	onStart: async function ({ api, args, threadsData, message, event, getLang }) {
		const threadData = await threadsData.get(event.threadID);
		if (!threadData.adminIDs.includes(api.getCurrentUserID()))
			return message.reply(getLang("needAdmin"));

		// Kick by message count
		if (!isNaN(args[0])) {
			const minMsg = Number(args[0]);
			message.reply(getLang("confirm", minMsg), (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					author: event.senderID,
					minimum: minMsg,
					type: "kickByMsg",
					threadID: event.threadID
				});
			});
		}
		// Kick by locked account
		else if (args[0] === "die") {
			message.reply("⚠️ | Are you sure you want to remove all locked accounts? (yes/no)", (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					author: event.senderID,
					type: "kickByBlock",
					threadID: event.threadID
				});
			});
		}
		else {
			message.SyntaxError();
		}
	},

	onReply: async function ({ api, event, Reply, threadsData, message, getLang }) {
		if (event.senderID !== Reply.author) return;
		const userAnswer = event.body.trim().toLowerCase();
		const threadData = await threadsData.get(event.threadID);

		if (userAnswer !== "yes") {
			return message.reply(getLang("cancel"));
		}

		// --- Kick by message count ---
		if (Reply.type === "kickByMsg") {
			const { minimum } = Reply;
			const botID = api.getCurrentUserID();
			const membersCountLess = threadData.members.filter(member =>
				member.count < minimum &&
				member.inGroup &&
				member.userID !== botID &&
				!threadData.adminIDs.includes(member.userID)
			);

			const errors = [];
			const success = [];

			for (const member of membersCountLess) {
				try {
					await api.removeUserFromGroup(member.userID, event.threadID);
					success.push(member.userID);
				} catch (e) {
					errors.push(member.name);
				}
				await sleep(700);
			}

			let msg = "";
			if (success.length > 0)
				msg += `${getLang("kickByMsg", success.length, minimum)}\n`;
			if (errors.length > 0)
				msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (!success.length && !errors.length)
				msg += getLang("noMsg", minimum);

			message.reply(msg);
		}

		// --- Kick by locked accounts ---
		else if (Reply.type === "kickByBlock") {
			const threadInfo = await api.getThreadInfo(event.threadID);
			const membersBlocked = threadInfo.userInfo.filter(user => user.type !== "User");
			const errors = [];
			const success = [];

			for (const user of membersBlocked) {
				if (user.type !== "User" && !threadInfo.adminIDs.includes(user.id)) {
					try {
						await api.removeUserFromGroup(user.id, event.threadID);
						success.push(user.id);
					} catch (e) {
						errors.push(user.name);
					}
					await sleep(700);
				}
			}

			let msg = "";
			if (success.length > 0)
				msg += `${getLang("kickByBlock", success.length)}\n`;
			if (errors.length > 0)
				msg += `${getLang("kickError", errors.length, errors.join("\n"))}\n`;
			if (!success.length && !errors.length)
				msg += getLang("noBlock");

			message.reply(msg);
		}
	}
};
