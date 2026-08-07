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

let currentLetterId = null;

document.addEventListener("DOMContentLoaded", () => {
    updateCardLockStatus();
});

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateCardLockStatus() {
    const todayStr = getTodayString();

    Object.keys(letters).forEach(id => {
        const letter = letters[id];
        const badge = document.getElementById(`badge-${id}`);
        const dateText = document.getElementById(`date-${id}`);

        if (todayStr >= letter.unlockDate) {
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

    const todayStr = getTodayString();
    if (todayStr < letter.unlockDate) {
        showToast(`This letter is locked until ${letter.unlockDate}! 🔒`, "error");
        return;
    }

    currentLetterId = id;
    document.getElementById("letterTitle").innerText = letter.title;
    document.getElementById("letterBody").innerText = letter.content;

    loadReactions();
    loadSavedComments();

    document.getElementById("envelopeModal").classList.add("active");
}

function closeEnvelope() {
    document.getElementById("envelopeModal").classList.remove("active");
    currentLetterId = null;
}

// Reactions Management
// Reactions Management with Toggle Support (One vote per user per reaction)
function reactToLetter(emoji) {
    if (!currentLetterId) return;

    // Retrieve storage structures
    const countKey = `reactions_${currentLetterId}`;
    const userVoteKey = `user_voted_${currentLetterId}`;

    const counts = JSON.parse(localStorage.getItem(countKey) || '{"❤️": 0, "👍": 0, "👎": 0}');
    const userVotes = JSON.parse(localStorage.getItem(userVoteKey) || '{"❤️": false, "👍": false, "👎": false}');

    if (userVotes[emoji]) {
        // Undo reaction: Decrease count and mark as unvoted
        counts[emoji] = Math.max(0, (counts[emoji] || 0) - 1);
        userVotes[emoji] = false;
        showToast(`Removed reaction ${emoji}`, "error");
    } else {
        // Add reaction: Increase count and mark as voted
        counts[emoji] = (counts[emoji] || 0) + 1;
        userVotes[emoji] = true;
        showToast(`Reacted ${emoji} 💕`, "success");
    }

    // Save back to localStorage
    localStorage.setItem(countKey, JSON.stringify(counts));
    localStorage.setItem(userVoteKey, JSON.stringify(userVotes));

    // Update UI display & button active states
    loadReactions();
}

function loadReactions() {
    if (!currentLetterId) return;

    const countKey = `reactions_${currentLetterId}`;
    const userVoteKey = `user_voted_${currentLetterId}`;

    const counts = JSON.parse(localStorage.getItem(countKey) || '{"❤️": 0, "👍": 0, "👎": 0}');
    const userVotes = JSON.parse(localStorage.getItem(userVoteKey) || '{"❤️": false, "👍": false, "👎": false}');

    // Update numbers
    document.getElementById("count-heart").innerText = counts["❤️"] || 0;
    document.getElementById("count-like").innerText = counts["👍"] || 0;
    document.getElementById("count-dislike").innerText = counts["👎"] || 0;

    // Toggle visually active class on buttons
    const btnHeart = document.getElementById("btn-react-heart");
    const btnLike = document.getElementById("btn-react-like");
    const btnDislike = document.getElementById("btn-react-dislike");

    if (btnHeart) btnHeart.classList.toggle("active", !!userVotes["❤️"]);
    if (btnLike) btnLike.classList.toggle("active", !!userVotes["👍"]);
    if (btnDislike) btnDislike.classList.toggle("active", !!userVotes["👎"]);
}

// Comments / Replies Management
function sendReply() {
    if (!currentLetterId) return;

    const input = document.getElementById("replyInput");
    const text = input.value.trim();

    if (!text) {
        showToast("Please enter a reply first! ✍️", "error");
        return;
    }

    const key = `comments_${currentLetterId}`;
    const comments = JSON.parse(localStorage.getItem(key) || '[]');
    comments.push({ text: text, date: new Date().toLocaleDateString() });

    localStorage.setItem(key, JSON.stringify(comments));
    input.value = "";

    showToast("Reply saved! 💕", "success");
    loadSavedComments();
}

function loadSavedComments() {
    if (!currentLetterId) return;

    const container = document.getElementById("commentsListContainer");
    const key = `comments_${currentLetterId}`;
    const comments = JSON.parse(localStorage.getItem(key) || '[]');

    container.innerHTML = "";

    comments.forEach((comment, index) => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <span>${escapeHtml(comment.text)}</span>
            <div class="comment-actions">
                <button class="action-btn" onclick="deleteComment(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
}

function deleteComment(index) {
    if (!currentLetterId) return;

    const key = `comments_${currentLetterId}`;
    let comments = JSON.parse(localStorage.getItem(key) || '[]');

    comments.splice(index, 1);
    localStorage.setItem(key, JSON.stringify(comments));

    showToast("Reply deleted 💕", "success");
    loadSavedComments();
}

function escapeHtml(str) {
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