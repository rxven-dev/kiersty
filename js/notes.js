// Letters Configuration
const letters = {
    'miss-you': {
        title: "My pretty babyy 💌",
        content: "Hey Babyyy,\n\nHii ii miss you so much!\n\npakiss babyy. <3!",
        unlockDate: "2026-08-03"
    },
    'stressed': {
        title: "When You Are Stressed 🌸",
        content: "Take a deep breath in... and let it out. 🌿\n\nYou are working so hard, and I am endlessly proud of you. Don't forget to take a quick break, drink a glass of water, and give yourself credit for everything you do.\n\nYou've got this, my love!",
        unlockDate: "2026-08-31"
    },
    'need-smile': {
        title: "When You Need a Smile ✨",
        content: "Just a quick reminder:\n\n1. You have the prettiest smile in the entire world.\n2. You make my life a million times brighter.\n3. I am so ridiculously lucky to have you.\n\nNow put a smile on that cute face!",
        unlockDate: "2026-08-31" 
    }
};

// -------------------------------------------------------------
// BACKEND CONFIGURATION
// -------------------------------------------------------------
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://your-backend-url.onrender.com"; // <-- Update this to your deployed Render URL if hosted!

let currentLetterId = null;
let liveSyncTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    updateCardLockStatus();
});

// Helper: Convert YYYY-MM-DD string to Date object at local midnight
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function updateCardLockStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.keys(letters).forEach(id => {
        const letter = letters[id];
        const badge = document.getElementById(`badge-${id}`);
        const dateText = document.getElementById(`date-${id}`);

        const unlockDateObj = parseDate(letter.unlockDate);

        if (today.getTime() >= unlockDateObj.getTime()) {
            if (badge) {
                badge.innerText = "🔓 Unlocked";
                badge.classList.add("unlocked");
            }
            if (dateText) {
                dateText.innerText = "Available Now 💕";
            }
        } else {
            if (badge) {
                badge.innerText = "🔒 Locked";
                badge.classList.remove("unlocked");
            }
            if (dateText) {
                dateText.innerText = `Available: ${letter.unlockDate}`;
            }
        }
    });
}

function openEnvelope(id) {
    const letter = letters[id];
    if (!letter) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unlockDateObj = parseDate(letter.unlockDate);

    if (today.getTime() < unlockDateObj.getTime()) {
        showToast(`This letter is locked until ${letter.unlockDate}! 🔒`, "error");
        return;
    }

    currentLetterId = id;

    const titleEl = document.getElementById("letterTitle");
    const bodyEl = document.getElementById("letterBody");

    if (titleEl) titleEl.innerText = letter.title;
    if (bodyEl) bodyEl.innerText = letter.content;

    // Load initial MongoDB data
    loadReactions();
    loadSavedComments();

    const modal = document.getElementById("envelopeModal") || document.getElementById("letterModal");
    if (modal) {
        modal.classList.add("active");
    }

    // Start 3-second polling timer for cross-device sync
    if (liveSyncTimer) clearInterval(liveSyncTimer);
    liveSyncTimer = setInterval(() => {
        if (currentLetterId) {
            loadReactions();
            loadSavedComments();
        }
    }, 3000);
}

function openLetter(id) {
    openEnvelope(id);
}

function closeEnvelope() {
    const modal = document.getElementById("envelopeModal") || document.getElementById("letterModal");
    if (modal) {
        modal.classList.remove("active");
    }
    currentLetterId = null;

    // Stop timer on modal close
    if (liveSyncTimer) {
        clearInterval(liveSyncTimer);
        liveSyncTimer = null;
    }
}

function closeLetterModal() {
    closeEnvelope();
}

// =============================================================
// REACTION FUNCTIONS (MongoDB API)
// =============================================================
async function reactToLetter(emoji) {
    if (!currentLetterId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/reactions/${currentLetterId}`);
        const data = await res.json();

        let counts = data.counts || { "❤️": 0, "👍": 0, "👎": 0 };
        let userVotes = data.userVotes || { "❤️": false, "👍": false, "👎": false };

        if (userVotes[emoji]) {
            counts[emoji] = Math.max(0, (counts[emoji] || 0) - 1);
            userVotes[emoji] = false;
            showToast(`Removed reaction ${emoji}`, "error");
        } else {
            counts[emoji] = (counts[emoji] || 0) + 1;
            userVotes[emoji] = true;
            showToast(`Reacted ${emoji} 💕`, "success");
        }

        await fetch(`${API_BASE_URL}/api/reactions/${currentLetterId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ counts, userVotes })
        });

        loadReactions();
    } catch (err) {
        console.error("Error toggling reaction:", err);
        showToast("Server connection error ❌", "error");
    }
}

async function loadReactions() {
    if (!currentLetterId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/reactions/${currentLetterId}`);
        const data = await res.json();

        const counts = data.counts || { "❤️": 0, "👍": 0, "👎": 0 };
        const userVotes = data.userVotes || { "❤️": false, "👍": false, "👎": false };

        const countHeart = document.getElementById("count-heart");
        const countLike = document.getElementById("count-like");
        const countDislike = document.getElementById("count-dislike");

        if (countHeart) countHeart.innerText = counts["❤️"] || 0;
        if (countLike) countLike.innerText = counts["👍"] || 0;
        if (countDislike) countDislike.innerText = counts["👎"] || 0;

        const btnHeart = document.querySelector(".react-btn[onclick*='❤️']");
        const btnLike = document.querySelector(".react-btn[onclick*='👍']");
        const btnDislike = document.querySelector(".react-btn[onclick*='👎']");

        if (btnHeart) btnHeart.classList.toggle("active", !!userVotes["❤️"]);
        if (btnLike) btnLike.classList.toggle("active", !!userVotes["👍"]);
        if (btnDislike) btnDislike.classList.toggle("active", !!userVotes["👎"]);
    } catch (err) {
        console.error("Error loading reactions:", err);
    }
}

// =============================================================
// COMMENT / REPLY FUNCTIONS (MongoDB API)
// =============================================================
async function sendReply() {
    if (!currentLetterId) return;

    const input = document.getElementById("replyInput");
    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        showToast("Please enter a reply first! ✍️", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                letterId: currentLetterId,
                text: text,
                author: "Babyy 💕"
            })
        });

        if (response.ok) {
            input.value = "";
            showToast("Reply sent! 💕", "success");
            loadSavedComments();
        } else {
            showToast("Failed to send reply ❌", "error");
        }
    } catch (err) {
        console.error("Error sending reply:", err);
        showToast("Server connection error ❌", "error");
    }
}

async function loadSavedComments() {
    if (!currentLetterId) return;

    const container = document.getElementById("commentsListContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${currentLetterId}`);
        const comments = await res.json();

        container.innerHTML = "";

        if (!comments || comments.length === 0) {
            container.innerHTML = `<p class="no-replies">No replies yet. Be the first to leave one! 🌸</p>`;
            return;
        }

        comments.forEach((comment) => {
            const item = document.createElement("div");
            item.className = "comment-item";
            item.innerHTML = `
                <span>${escapeHtml(comment.text)}</span>
                <div class="comment-actions">
                    <button class="action-btn" onclick="deleteComment('${comment._id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}

async function deleteComment(id) {
    if (!id) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast("Reply deleted 💕", "success");
            loadSavedComments();
        } else {
            showToast("Failed to delete reply ❌", "error");
        }
    } catch (err) {
        console.error("Error deleting comment:", err);
        showToast("Server error ❌", "error");
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}