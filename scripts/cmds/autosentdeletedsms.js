
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "..", "cache", "unsentMessages.json");
const DELETE_AFTER = 30 * 60 * 1000; // 30 minutes

// Cache file ensure করা
function ensureCacheFile() {
  const folder = path.dirname(CACHE_FILE);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, "{}");
}

function loadStore() {
  ensureCacheFile();
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (error) {
    console.error("Error loading unsent store:", error);
    return {};
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving unsent store:", error);
  }
}

// বাংলা সময় ফরমেট
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

// Attachment type check
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

// User info get করা
async function getUserInfo(api, userID) {
  try {
    const userInfo = await api.getUserInfo(userID);
    return userInfo[userID]?.name || `User ${userID}`;
  } catch (error) {
    return `User ${userID}`;
  }
}

module.exports = {
  config: {
    name: "autosentdeletedsms",
    version: "4.0",
    author: "Tohidul (Fixed Version)",
    shortDescription: "Fixed unsend message detector",
    longDescription: "Automatically detects and logs unsent messages with attachments",
    category: "utility",
    guide: {
      en: "This command automatically tracks all unsent messages and logs them in the same thread.",
      vi: "Tự động theo dõi và ghi lại các tin nhắn bị thu hồi trong cùng thread."
    }
  },

  // System initialization
  onStart: async function ({ api }) {
    ensureCacheFile();
    
    // Old messages clean করা (প্রতি 60 সেকেন্ডে)
    setInterval(() => {
      const store = loadStore();
      let changed = false;
      const now = Date.now();
      
      for (const id in store) {
        if (now - store[id].timestamp > DELETE_AFTER) {
          delete store[id];
          changed = true;
        }
      }
      
      if (changed) {
        saveStore(store);
        console.log(`🧹 পুরানো unsend রেকর্ড পরিষ্কার করা হয়েছে`);
      }
    }, 60000);

    console.log("✅ Auto Unsend Detector সিস্টেম চালু হয়েছে!");
  },

  // সব মেসেজ save করা
  onChat: async function ({ event, api }) {
    if (!event || !event.messageID || event.type !== "message") return;
    
    const store = loadStore();
    
    // User info get করা
    let senderName = "Unknown User";
    try {
      senderName = await getUserInfo(api, event.senderID);
    } catch (error) {
      console.log("Error getting user info:", error.message);
    }

    // Message data store করা
    store[event.messageID] = {
      senderID: event.senderID,
      senderName: senderName,
      threadID: event.threadID,
      body: event.body || "",
      attachments: event.attachments || [],
      mentions: event.mentions || {},
      timestamp: Date.now(),
      messageReply: event.messageReply || null,
      isGroup: event.isGroup || false
    };
    
    saveStore(store);
  },

  // Unsend detect করা - Main handler
  handleEvent: async function ({ api, event }) {
    // শুধুমাত্র message_unsend event handle করা
    if (event.type !== "message_unsend") return;

    console.log(`🚨 Unsend detected: ${event.messageID}`);

    const store = loadStore();
    const savedMsg = store[event.messageID];
    
    // Message check করা
    if (!savedMsg) {
      console.log(`⚠️ No saved message found for: ${event.messageID}`);
      return;
    }

    // Time check করা
    if (Date.now() - savedMsg.timestamp > DELETE_AFTER) {
      console.log(`⚠️ Message too old: ${event.messageID}`);
      delete store[event.messageID];
      saveStore(store);
      return;
    }

    try {
      // Report message তৈরি করা
      let reportMsg = `🚨 𝗨𝗻𝘀𝗲𝗻𝗱 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱 🚨\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportMsg += `👤 প্রেরক: ${savedMsg.senderName}\n`;
      reportMsg += `🆔 ইউজার আইডি: ${savedMsg.senderID}\n`;
      reportMsg += `🕒 সময়: ${formatTime(new Date())}\n`;
      reportMsg += `📨 মেসেজ আইডি: ${event.messageID}\n`;
      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      // Message content add করা
      if (savedMsg.body && savedMsg.body.trim()) {
        reportMsg += `📝 মেসেজ:\n"${savedMsg.body}"\n\n`;
      }

      // Mentions add করা
      if (savedMsg.mentions && Object.keys(savedMsg.mentions).length > 0) {
        reportMsg += `👥 উল্লেখিত ব্যক্তিরা:\n`;
        for (const [uid, name] of Object.entries(savedMsg.mentions)) {
          reportMsg += `• ${name.replace('@', '')} (${uid})\n`;
        }
        reportMsg += `\n`;
      }

      // Reply info add করা  
      if (savedMsg.messageReply && savedMsg.messageReply.body) {
        reportMsg += `↩️ রিপ্লাই করা মেসেজ: "${savedMsg.messageReply.body}"\n\n`;
      }

      // Attachments handle করা
      const attachmentFiles = [];
      if (savedMsg.attachments && savedMsg.attachments.length > 0) {
        reportMsg += `📎 সংযুক্তি: ${savedMsg.attachments.length}টি\n`;
        
        for (let i = 0; i < Math.min(savedMsg.attachments.length, 5); i++) {
          const att = savedMsg.attachments[i];
          const attType = getAttachmentType(att);
          reportMsg += `${i + 1}. ${attType}\n`;
          
          const url = att.url || att.previewUrl || att.largePreview;
          if (url) {
            try {
              const response = await axios.get(url, { 
                responseType: "arraybuffer",
                timeout: 15000,
                maxContentLength: 50 * 1024 * 1024, // 50MB limit
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              const ext = path.extname(url).toLowerCase() || '.jpg';
              const fileName = `unsend_${Date.now()}_${i}${ext}`;
              const filePath = path.join(__dirname, "cache", fileName);
              
              await fs.writeFile(filePath, response.data);
              attachmentFiles.push(fs.createReadStream(filePath));
              
            } catch (downloadError) {
              console.error(`Attachment ${i} download error:`, downloadError.message);
              reportMsg += `  ❌ ডাউনলোড ব্যর্থ\n`;
            }
          }
        }
        reportMsg += `\n`;
      }

      reportMsg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportMsg += `⚡ Fixed Unsend Detector\n`;
      reportMsg += `🛡️ সব মেসেজ ট্র্যাক করা হচ্ছে!`;

      // Message options prepare করা
      const messageOptions = {
        body: reportMsg
      };

      if (attachmentFiles.length > 0) {
        messageOptions.attachment = attachmentFiles;
      }

      // Same thread এ report পাঠানো
      api.sendMessage(messageOptions, savedMsg.threadID, (error, info) => {
        if (error) {
          console.error("Report পাঠাতে ত্রুটি:", error.message);
          
          // Fallback: Simple text message
          const fallbackMsg = `🚨 Unsend Detected!\n👤 ${savedMsg.senderName} (${savedMsg.senderID})\n📝 "${savedMsg.body || 'Media message'}"`;
          api.sendMessage(fallbackMsg, savedMsg.threadID);
        } else {
          console.log(`✅ Unsend report পাঠানো হয়েছে: ${event.messageID}`);
        }
        
        // Files cleanup করা
        attachmentFiles.forEach(file => {
          try {
            if (file.path && fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error("File cleanup error:", cleanupError.message);
          }
        });
      });

      // Store থেকে remove করা
      delete store[event.messageID];
      saveStore(store);

    } catch (error) {
      console.error("HandleEvent এ ত্রুটি:", error.message);
      
      // Emergency fallback message
      try {
        const fallbackMsg = `🚨 Unsend Alert!\n👤 ${savedMsg.senderName || 'Unknown'}\n📝 "${savedMsg.body || 'Content not available'}"`;
        api.sendMessage(fallbackMsg, savedMsg.threadID);
        
        // Clean up store
        delete store[event.messageID];
        saveStore(store);
        
      } catch (fallbackError) {
        console.error("Fallback message error:", fallbackError.message);
      }
    }
  }
};
