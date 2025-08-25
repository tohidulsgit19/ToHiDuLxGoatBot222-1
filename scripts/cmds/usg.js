
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "usgStore.json");
const DELETE_AFTER = 5 * 60 * 1000; // 5 minutes
const LOG_GROUP_ID = "9826242237455305"; // Change with your group ID

// Ensure cache exists
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
}

function loadStore() {
  ensureCacheFile();
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE));
  } catch (error) {
    console.error("Error loading usg store:", error);
    return {};
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving usg store:", error);
  }
}

// Format time in Bengali
function formatTime(date) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Dhaka'
  };
  return new Intl.DateTimeFormat('bn-BD', options).format(date);
}

// Get attachment type in Bengali
function getAttachmentType(attachment) {
  const type = attachment.type || 'unknown';
  switch (type) {
    case 'photo': return '📸 ছবি';
    case 'video': return '🎥 ভিডিও';
    case 'audio': return '🎵 অডিও';
    case 'file': return '📄 ফাইল';
    case 'sticker': return '😀 স্টিকার';
    case 'animated_image': return '🎭 GIF';
    default: return '📎 সংযুক্তি';
  }
}

module.exports = {
  config: {
    name: "usg",
    version: "4.0",
    author: "Tohidul (Enhanced)",
    shortDescription: "উন্নত আনসেন্ড মেসেজ ডিটেক্টর",
    longDescription: "উন্নত বৈশিষ্ট্য সহ আনসেন্ড মেসেজ ট্র্যাক করুন",
    category: "utility",
    guide: {
      en: "This command automatically tracks unsent messages and logs them to the specified group.",
      vi: "Lệnh này tự động theo dõi tin nhắn bị thu hồi và ghi log vào nhóm được chỉ định."
    }
  },

  // Startup cleaner and initialization
  onStart: async function ({ api }) {
    ensureCacheFile();
    
    // Clean old messages every 30 seconds
    setInterval(() => {
      const store = loadStore();
      let changed = false;
      const now = Date.now();
      
      for (const id in store) {
        if (now - store[id].time > DELETE_AFTER) {
          delete store[id];
          changed = true;
        }
      }
      
      if (changed) {
        saveStore(store);
        console.log(`🧹 Cleaned ${Object.keys(store).length} old unsend records`);
      }
    }, 30000);

    console.log("✅ USG (Unsend Guard) system activated!");
    return api.sendMessage("🛡️ আনসেন্ড গার্ড সিস্টেম চালু হয়েছে!", LOG_GROUP_ID);
  },

  // Save all messages
  onChat: async function ({ event, api }) {
    if (event.type !== "message" || !event.messageID) return;
    
    const store = loadStore();
    
    // Get additional info for better tracking
    let senderName = "Unknown User";
    try {
      const userInfo = await api.getUserInfo(event.senderID);
      senderName = userInfo[event.senderID]?.name || "Unknown User";
    } catch (error) {
      // Ignore error, use default name
    }

    store[event.messageID] = {
      senderID: event.senderID,
      senderName: senderName,
      threadID: event.threadID,
      body: event.body || null,
      attachments: event.attachments || [],
      mentions: event.mentions || {},
      time: Date.now(),
      messageReply: event.messageReply || null,
      type: event.type
    };
    
    saveStore(store);
  },

  // Detect unsend and log
  handleEvent: async function ({ api, event }) {
    if (event.type !== "message_unsend") return;

    const store = loadStore();
    const savedMsg = store[event.messageID];
    
    // Check if message exists and is within time limit
    if (!savedMsg || Date.now() - savedMsg.time > DELETE_AFTER) {
      console.log(`⚠️ Unsend detected but message not found or too old: ${event.messageID}`);
      return;
    }

    try {
      // Get thread info
      let threadName = "Private Chat";
      let threadType = "🔒 ব্যক্তিগত";
      
      try {
        const threadInfo = await api.getThreadInfo(savedMsg.threadID);
        threadName = threadInfo.threadName || `Group ${savedMsg.threadID}`;
        threadType = threadInfo.isGroup ? "👥 গ্রুপ" : "🔒 ব্যক্তিগত";
      } catch (error) {
        console.log("Could not get thread info:", error.message);
      }

      // Create report message
      let reportMsg = `🚨 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱 🚨
━━━━━━━━━━━━━━━━━━━━━━━━
👤 প্রেরক: ${savedMsg.senderName}
🆔 ইউজার আইডি: ${event.senderID}
${threadType}: ${threadName}
📍 থ্রেড আইডি: ${savedMsg.threadID}
🕒 সময়: ${formatTime(new Date())}
📨 মেসেজ আইডি: ${event.messageID}
━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Add message content
      if (savedMsg.body) {
        reportMsg += `📝 মেসেজ:\n"${savedMsg.body}"\n\n`;
      }

      // Add mentions if any
      if (savedMsg.mentions && Object.keys(savedMsg.mentions).length > 0) {
        reportMsg += `👥 উল্লেখিত ব্যক্তিরা:\n`;
        for (const [uid, name] of Object.entries(savedMsg.mentions)) {
          reportMsg += `• ${name.replace('@', '')} (${uid})\n`;
        }
        reportMsg += `\n`;
      }

      // Add reply info if any
      if (savedMsg.messageReply) {
        reportMsg += `↩️ রিপ্লাই করা মেসেজ: "${savedMsg.messageReply.body || 'Media/Attachment'}"\n\n`;
      }

      // Handle attachments
      const files = [];
      if (savedMsg.attachments && savedMsg.attachments.length > 0) {
        reportMsg += `📎 সংযুক্তি: ${savedMsg.attachments.length}টি ফাইল\n`;
        
        for (let i = 0; i < savedMsg.attachments.length; i++) {
          const att = savedMsg.attachments[i];
          const attType = getAttachmentType(att);
          reportMsg += `${i + 1}. ${attType}\n`;
          
          const url = att.url || att.previewUrl || att.largePreview;
          if (url) {
            try {
              const response = await axios.get(url, { 
                responseType: "arraybuffer",
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              const ext = path.extname(url) || (att.type === 'photo' ? '.jpg' : '.dat');
              const fileName = `usg_${Date.now()}_${i}${ext}`;
              const filePath = path.join(__dirname, "..", "cache", fileName);
              
              fs.writeFileSync(filePath, response.data);
              files.push(fs.createReadStream(filePath));
              
            } catch (downloadError) {
              console.error(`Error downloading attachment ${i}:`, downloadError.message);
              reportMsg += `  ❌ ডাউনলোড ব্যর্থ\n`;
            }
          }
        }
        reportMsg += `\n`;
      }

      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━
⚡ GoatBot-V2 Unsend Guard
🛡️ কোনো মেসেজই গোপন থাকবে না!`;

      // Send the report
      api.sendMessage({ 
        body: reportMsg, 
        attachment: files.length > 0 ? files : undefined 
      }, LOG_GROUP_ID, (error, info) => {
        if (error) {
          console.error("Error sending unsend report:", error);
        } else {
          console.log(`✅ Unsend report sent for message: ${event.messageID}`);
        }
        
        // Clean up files
        files.forEach(file => {
          try {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
          }
        });
      });

      // Remove from store
      delete store[event.messageID];
      saveStore(store);

    } catch (error) {
      console.error("Error in handleEvent:", error);
    }
  }
};
