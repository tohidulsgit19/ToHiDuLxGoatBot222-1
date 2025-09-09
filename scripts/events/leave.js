const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "1.4",
		author: "NTKhang (Styled by YOU)",
		category: "events"
	},

	langs: {
		vi: {
			session1: "🌅 sÁnG",
			session2: "🌞 tRuA",
			session3: "🌇 cHiềU",
			session4: "🌙 tỐi",
			leaveType1: "đã tự rời 👣",
			leaveType2: "đã bị đuổi ❌",
			defaultLeaveMessage: "😢 𝓑ạ𝓷 {userName} {type} 𝓴𝓱ỏ𝓲 𝓷𝓱ó𝓶 {boxName} 𝓿à𝓸 𝓫𝓾ổ𝓲 {session} ⏰"
		},
		en: {
			session1: "🌅 𝓶𝓸𝓻𝓷𝓲𝓷𝓰",
			session2: "🌞 𝓷𝓸𝓸𝓷",
			session3: "🌇 𝓪𝓯𝓽𝓮𝓻𝓷𝓸𝓸𝓷",
			session4: "🌙 𝓮𝓿𝓮𝓷𝓲𝓷𝓰",
			leaveType1: "👣 𝓵𝓮𝓯𝓽",
			leaveType2: "❌ 𝔀𝓪𝓼 𝓴𝓲𝓬𝓴𝓮𝓭 𝓯𝓻𝓸𝓶",
			defaultLeaveMessage: "😢 {userName} {type} 𝓽𝓱𝓮 𝓰𝓻𝓸𝓾𝓹 ({boxName}) this {session} ⏰"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);
				if (!threadData.settings.sendLeaveMessage)
					return;

				const { leftParticipantFbId } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				const hours = getTime("HH");
				const threadName = threadData.threadName;
				const userName = await usersData.getName(leftParticipantFbId);

				let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;

				const form = {
					mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
						tag: userName,
						id: leftParticipantFbId
					}] : null
				};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(/\{session\}/g,
						hours <= 10 ? getLang("session1") :
							hours <= 12 ? getLang("session2") :
								hours <= 18 ? getLang("session3") :
									getLang("session4")
					);

				form.body = leaveMessage;

				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				if (threadData.data.leaveAttachment) {
					const files = threadData.data.leaveAttachment;
					const attachments = files.reduce((acc, file) => {
						acc.push(drive.getFile(file, "stream"));
						return acc;
					}, []);
					form.attachment = (await Promise.allSettled(attachments))
						.filter(({ status }) => status == "fulfilled")
						.map(({ value }) => value);
				}

				message.send(form);
			};
	}
};
