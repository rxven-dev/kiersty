// Add or edit your custom letters and set their unlock dates (YYYY-MM-DD format)!
const letters = {
    'miss-you': {
        title: "When You Miss Me 💖",
        content: "Hey beautiful,\n\nWhenever you feel lonely or miss me, just close your eyes for a second. Remember that no matter where we are, you are always the first and last thing on my mind.\n\nI'm always sending you a big warm hug. I love you so much!",
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
const API_BASE = ""; // Relative URL if served from the same server, or set to e.g. "http://localhost:5000"

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

async function openEnvelope(letterId) {
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

    // Load reactions and comments from MongoDB
    await loadSavedReaction();
    await loadSavedComments();

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
   Reaction Logic (MongoDB Connected)
   ========================================== */
async function reactToLetter(selectedEmoji) {
    const feedback = document.getElementById("reactionFeedback");
    
    try {
        const res = await fetch(`${API_BASE}/api/reactions/${currentLetterId}`);
        const currentData = res.ok ? await res.json() : null;
        let newEmoji = selectedEmoji;

        // Toggle reaction off if clicking the same one again
        if (currentData && currentData.emoji === selectedEmoji) {
            newEmoji = "";
        }

        const saveRes = await fetch(`${API_BASE}/api/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letterId: currentLetterId, emoji: newEmoji })
        });

        if (saveRes.ok) {
            if (!newEmoji) {
                feedback.innerText = "Reaction removed";
            } else if (newEmoji === '👎') {
                feedback.innerText = "You disliked this? 🥺 Sending hugs anyway!";
            } else {
                feedback.innerText = `You reacted ${newEmoji}`;
            }
            await loadSavedReaction();
        }
    } catch (err) {
        console.error("Error saving reaction:", err);
    }
}

async function loadSavedReaction() {
    const feedback = document.getElementById("reactionFeedback");
    const buttons = document.querySelectorAll(".react-btn");

    buttons.forEach(btn => btn.classList.remove("active"));

    try {
        const res = await fetch(`${API_BASE}/api/reactions/${currentLetterId}`);
        if (!res.ok) return;

        const data = await res.json();
        const currentReaction = data ? data.emoji : "";

        buttons.forEach(btn => {
            if (currentReaction && btn.innerText.includes(currentReaction)) {
                btn.classList.add("active");
            }
        });

        if (currentReaction) {
            feedback.innerText = `Current reaction: ${currentReaction}`;
        } else {
            feedback.innerText = "";
        }
    } catch (err) {
        console.error("Error loading reaction:", err);
    }
}

/* ==========================================
   Comment Logic: Save, Load, Edit, & Delete (MongoDB Connected)
   ========================================== */
async function sendReply() {
    const replyInput = document.getElementById("replyInput");
    const replyText = replyInput.value.trim();
    const status = document.getElementById("replyStatus");

    if (!replyText) {
        status.style.color = "#e04a6c";
        status.innerText = "Please type a short message first!";
        return;
    }

    const newComment = {
        letterId: currentLetterId,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
        const res = await fetch(`${API_BASE}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComment)
        });

        if (res.ok) {
            status.style.color = "#48bb78";
            status.innerText = "Comment added! 💕";
            replyInput.value = "";
            await loadSavedComments();
        } else {
            status.style.color = "#e04a6c";
            status.innerText = "Failed to save comment.";
        }
    } catch (err) {
        console.error("Error sending comment:", err);
        status.style.color = "#e04a6c";
        status.innerText = "Error connecting to server.";
    }
}

async function loadSavedComments() {
    let commentsContainer = document.getElementById("commentsListContainer");

    if (!commentsContainer) {
        commentsContainer = document.createElement("div");
        commentsContainer.id = "commentsListContainer";
        commentsContainer.className = "comments-list-container";
        
        const replyBox = document.querySelector(".reply-container");
        replyBox.parentNode.insertBefore(commentsContainer, replyBox);
    }

    try {
        const res = await fetch(`${API_BASE}/api/comments/${currentLetterId}`);
        const commentsList = res.ok ? await res.json() : [];

        if (commentsList.length === 0) {
            commentsContainer.innerHTML = "";
            return;
        }

        commentsContainer.innerHTML = `
            <h4 class="comments-title">Her Comments 💬</h4>
            <div class="comments-feed">
                ${commentsList.map(c => `
                    <div class="comment-bubble" id="comment-${c._id}">
                        <div class="comment-content">
                            <p class="comment-text" id="text-${c._id}">${escapeHtml(c.text)}</p>
                            <span class="comment-time">${c.time}</span>
                        </div>
                        <div class="comment-actions">
                            <button onclick="enableEditComment('${c._id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteComment('${c._id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}

// Edit Comment Inline
function enableEditComment(id) {
    const textElement = document.getElementById(`text-${id}`);
    const currentText = textElement.innerText;

    textElement.parentElement.innerHTML = `
        <div class="edit-comment-box">
            <input type="text" id="input-${id}" value="${escapeHtml(currentText)}" />
            <button onclick="saveEditComment('${id}')" class="save-btn">Save</button>
            <button onclick="loadSavedComments()" class="cancel-btn">Cancel</button>
        </div>
    `;
}

async function saveEditComment(id) {
    const newText = document.getElementById(`input-${id}`).value.trim();
    if (!newText) return;

    try {
        const res = await fetch(`${API_BASE}/api/comments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });

        if (res.ok) {
            await loadSavedComments();
        } else {
            alert("Failed to update comment.");
        }
    } catch (err) {
        console.error("Error editing comment:", err);
    }
}

// Delete Comment
async function deleteComment(id) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        const res = await fetch(`${API_BASE}/api/comments/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await loadSavedComments();
        } else {
            alert("Failed to delete comment.");
        }
    } catch (err) {
        console.error("Error deleting comment:", err);
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}