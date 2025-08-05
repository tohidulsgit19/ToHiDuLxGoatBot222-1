
module.exports = {
	config: {
		name: "viprules",
		aliases: ["viphelp", "vipinfo"],
		version: "1.0",
		author: "Admin",
		countDown: 5,
		role: 0,
		description: {
			en: "Show VIP system rules and requirements"
		},
		category: "info",
		guide: {
			en: "{pn}: Show VIP system information"
		}
	},

	langs: {
		en: {
			vipRules: `🔐 **VIP SYSTEM RULES** 🔐

💎 **HOW TO BECOME VIP:**
• Reach Level 35 through gaining experience
• Use commands and stay active to gain EXP
• Once you reach Level 35, you automatically become VIP!

⭐ **VIP BENEFITS:**
• Access to exclusive VIP commands (Role 3)
• Special privileges and features
• VIP-only content and tools

📊 **ROLE HIERARCHY:**
Level 0: 👥 Standard User - Basic commands
Level 1: ⚔️ Group Admin - Group management  
Level 2: 🤖 Bot Admin - Bot configuration
Level 3: 💎 VIP User - Premium commands (Level 35+)
Level 4: 👑 System Developer - Full control

💡 **TIPS:**
• Use '.rank' to check your current level and EXP
• Use '.vip check' to see your VIP status
• Stay active and use commands to gain experience
• Each command usage gives you EXP points

🎯 **LEVEL 35 REQUIREMENT:**
• Keep using bot commands to gain EXP
• Participate in chat activities
• Use daily commands for bonus EXP
• Be patient and consistent!`
		}
	},

	onStart: async function ({ message, getLang }) {
		return message.reply(getLang("vipRules"));
	}
};
