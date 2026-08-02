// Add or edit your custom letters and set their unlock dates (YYYY-MM-DD format)!
const letters = {
    'miss-you': {
        title: "When You Miss Me 💖",
        content: "Hey beautiful,\n\nWhenever you feel lonely or miss me, just close your eyes for a second. Remember that no matter where we are, you are always the first and last thing on my mind.\n\nI'm always sending you a big warm hug. I love you so much!",
        unlockDate: "2026-08-31"
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

// Checks current date vs unlock date for all cards
function updateCardLockStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date portion only

    Object.keys(letters).forEach(id => {
        const letter = letters[id];
        const card = document.querySelector(`[onclick="openEnvelope('${id}')"]`);
        if (!card) return;

        const unlockDate = new Date(letter.unlockDate + "T00:00:00");
        const statusText = card.querySelector(".card-status");

        if (today < unlockDate) {
            card.classList.add("locked");
            if (statusText) {
                const formattedDate = unlockDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                statusText.innerHTML = `<i class="fa-solid fa-lock"></i> Opens on ${formattedDate}`;
            }
        } else {
            card.classList.remove("locked");
            if (statusText) {
                statusText.innerHTML = `<i class="fa-solid fa-envelope-open"></i> Click to open`;
            }
        }
    });
}

function openEnvelope(letterId) {
    const letter = letters[letterId];
    if (!letter) return;

    // Date Verification
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unlockDate = new Date(letter.unlockDate + "T00:00:00");

    if (today < unlockDate) {
        const formattedDate = unlockDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        showLockAlert(`This letter is locked until ${formattedDate}! mwehehehe 💖`);
        return;
    }

    currentLetterId = letterId;
    const modal = document.getElementById("envelopeModal");
    const wrapper = document.getElementById("envelopeWrapper");

    // Set letter content
    document.getElementById("letterTitle").innerText = letter.title;
    document.getElementById("letterBody").innerText = letter.content;
    document.getElementById("replyStatus").innerText = "";
    document.getElementById("replyInput").value = "";

    // Load active reaction & comment history
    loadSavedReaction();
    loadSavedComments();

    modal.style.display = "flex";
    
    // Trigger animation
    setTimeout(() => {
        wrapper.querySelector(".envelope").classList.add("open");
    }, 100);
}

function showLockAlert(msg) {
    let alertBox = document.getElementById("lockAlertModal");
    if (!alertBox) {
        alertBox = document.createElement("div");
        alertBox.id = "lockAlertModal";
        alertBox.className = "lock-alert-modal";
        document.body.appendChild(alertBox);
    }
    
    alertBox.innerHTML = `
        <div class="lock-alert-content">
            <span class="lock-alert-icon">🔒</span>
            <p>${msg}</p>
            <button onclick="closeLockAlert()">Okay 💕</button>
        </div>
    `;
    alertBox.style.display = "flex";
}

function closeLockAlert() {
    const alertBox = document.getElementById("lockAlertModal");
    if (alertBox) alertBox.style.display = "none";
}

function closeEnvelope() {
    const wrapper = document.getElementById("envelopeWrapper");
    const modal = document.getElementById("envelopeModal");

    wrapper.querySelector(".envelope").classList.remove("open");
    setTimeout(() => {
        modal.style.display = "none";
    }, 400);
}

/* ==========================================
   Reaction Logic (Heart, Like, Dislike + Undo)
   ========================================== */
function reactToLetter(selectedEmoji) {
    const feedback = document.getElementById("reactionFeedback");
    const savedReactions = JSON.parse(localStorage.getItem("letterReactions") || "{}");
    const previousReaction = savedReactions[currentLetterId];

    if (previousReaction === selectedEmoji) {
        delete savedReactions[currentLetterId];
        localStorage.setItem("letterReactions", JSON.stringify(savedReactions));
        feedback.innerText = "Reaction removed";
    } else {
        savedReactions[currentLetterId] = selectedEmoji;
        localStorage.setItem("letterReactions", JSON.stringify(savedReactions));
        
        if (selectedEmoji === '👎') {
            feedback.innerText = "You disliked this? 🥺 Sending hugs anyway!";
        } else {
            feedback.innerText = `You reacted ${selectedEmoji}`;
        }
    }

    loadSavedReaction();
}

function loadSavedReaction() {
    const savedReactions = JSON.parse(localStorage.getItem("letterReactions") || "{}");
    const currentReaction = savedReactions[currentLetterId];
    const buttons = document.querySelectorAll(".react-btn");

    buttons.forEach(btn => {
        btn.classList.remove("active");
        if (currentReaction && btn.innerText.includes(currentReaction)) {
            btn.classList.add("active");
        }
    });

    const feedback = document.getElementById("reactionFeedback");
    if (currentReaction) {
        feedback.innerText = `Current reaction: ${currentReaction}`;
    } else {
        feedback.innerText = "";
    }
}

/* ==========================================
   Comment & Reply Logic (Multiple Comments)
   ========================================== */
function sendReply() {
    const replyText = document.getElementById("replyInput").value.trim();
    const status = document.getElementById("replyStatus");

    if (!replyText) {
        status.style.color = "#e04a6c";
        status.innerText = "Please type a short message first!";
        return;
    }

    const savedComments = JSON.parse(localStorage.getItem("letterComments") || "{}");
    if (!savedComments[currentLetterId]) {
        savedComments[currentLetterId] = [];
    }

    const newComment = {
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    savedComments[currentLetterId].push(newComment);
    localStorage.setItem("letterComments", JSON.stringify(savedComments));

    status.style.color = "#48bb78";
    status.innerText = "Comment added! 💕";
    document.getElementById("replyInput").value = "";

    loadSavedComments();
}

function loadSavedComments() {
    const savedComments = JSON.parse(localStorage.getItem("letterComments") || "{}");
    const commentsList = savedComments[currentLetterId] || [];
    let commentsContainer = document.getElementById("commentsListContainer");

    if (!commentsContainer) {
        commentsContainer = document.createElement("div");
        commentsContainer.id = "commentsListContainer";
        commentsContainer.className = "comments-list-container";
        
        const replyBox = document.querySelector(".reply-container");
        replyBox.parentNode.insertBefore(commentsContainer, replyBox);
    }

    if (commentsList.length === 0) {
        commentsContainer.innerHTML = "";
        return;
    }

    commentsContainer.innerHTML = `
        <h4 class="comments-title">Her Comments 💬</h4>
        <div class="comments-feed">
            ${commentsList.map(c => `
                <div class="comment-bubble">
                    <p class="comment-text">${c.text}</p>
                    <span class="comment-time">${c.time}</span>
                </div>
            `).join('')}
        </div>
    `;
}