// Custom letters configuration
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
const API_BASE = "http://localhost:5000"; 

document.addEventListener("DOMContentLoaded", () => {
    updateCardLockStatus();
});

function updateCardLockStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    document.getElementById("letterTitle").innerText = letter.title;
    document.getElementById("letterBody").innerText = letter.content;
    document.getElementById("replyStatus").innerText = "";
    document.getElementById("replyInput").value = "";

    await loadSavedReaction();
    await loadSavedComments();

    modal.style.display = "flex";
    
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

function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-card ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === "success" ? "💖" : "⚠️"}</span>
        <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 50);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* --- Reaction Logic --- */
async function reactToLetter(selectedEmoji) {
    // Check if letter ID exists before sending request
    if (!currentLetterId) {
        showToast("Please open a letter first!", "error");
        return;
    }

    const feedback = document.getElementById("reactionFeedback");
    const activeBtn = document.querySelector(".react-btn.active");
    
    let newEmoji = selectedEmoji;
    if (activeBtn && activeBtn.innerText.trim() === selectedEmoji) {
        newEmoji = ""; // Toggle off reaction
    }

    try {
        const saveRes = await fetch(`${API_BASE}/api/reactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letterId: currentLetterId, emoji: newEmoji })
        });

        if (saveRes.ok) {
            if (!newEmoji) {
                if (feedback) feedback.innerText = "Reaction removed";
            } else if (newEmoji === '👎') {
                if (feedback) feedback.innerText = "You disliked this? 🥺 Sending hugs anyway!";
            } else {
                if (feedback) feedback.innerText = `You reacted ${newEmoji}`;
            }
            await loadSavedReaction();
        } else {
            showToast("Failed to save reaction", "error");
        }
    } catch (err) {
        console.error("Error saving reaction:", err);
        showToast("Could not save reaction", "error");
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
            if (currentReaction && btn.innerText.trim() === currentReaction.trim()) {
                btn.classList.add("active");
            }
        });

        if (feedback) {
            feedback.innerText = currentReaction ? `Current reaction: ${currentReaction}` : "";
        }
    } catch (err) {
        console.error("Error loading reaction:", err);
    }
}

/* --- Comment Logic --- */
async function sendReply() {
    const replyInput = document.getElementById("replyInput");
    const replyText = replyInput.value.trim();

    if (!replyText) {
        showToast("Please type a message first!", "error");
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
            showToast("Comment added! 💕", "success");
            replyInput.value = "";
            await loadSavedComments();
        } else {
            showToast("Failed to save comment.", "error");
        }
    } catch (err) {
        console.error("Error sending comment:", err);
        showToast("Error connecting to server.", "error");
    }
}

async function loadSavedComments() {
    let commentsContainer = document.getElementById("commentsListContainer");

    if (!commentsContainer) {
        commentsContainer = document.createElement("div");
        commentsContainer.id = "commentsListContainer";
        commentsContainer.className = "comments-list-container";
        
        const replyBox = document.querySelector(".reply-container");
        if (replyBox && replyBox.parentNode) {
            replyBox.parentNode.insertBefore(commentsContainer, replyBox);
        }
    }

    try {
        const res = await fetch(`${API_BASE}/api/comments/${currentLetterId}`);
        const commentsList = res.ok ? await res.json() : [];

        if (!commentsList || commentsList.length === 0) {
            commentsContainer.innerHTML = "";
            return;
        }

        commentsContainer.innerHTML = `
            <h4 class="comments-title">Her Comments 💬</h4>
            <div class="comments-feed">
                ${commentsList.map(c => {
                    const id = c._id; // Standard MongoDB string ID
                    return `
                    <div class="comment-bubble" id="comment-${id}">
                        <div class="comment-content" id="content-${id}">
                            <p class="comment-text" id="text-${id}">${escapeHtml(c.text)}</p>
                            <span class="comment-time">${escapeHtml(c.time || '')}</span>
                        </div>
                        <div class="comment-actions">
                            <button onclick="enableEditComment('${id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteComment('${id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}

function enableEditComment(id) {
    const textElement = document.getElementById(`text-${id}`);
    if (!textElement) return;
    
    const currentText = textElement.innerText;
    const contentContainer = document.getElementById(`content-${id}`);

    if (!contentContainer) return;

    contentContainer.innerHTML = `
        <div class="edit-comment-box">
            <input type="text" id="input-${id}" value="${escapeHtml(currentText)}" />
            <button onclick="saveEditComment('${id}')" class="save-btn">Save</button>
            <button onclick="loadSavedComments()" class="cancel-btn">Cancel</button>
        </div>
    `;
}

async function saveEditComment(id) {
    // 1. Guard against bad/undefined IDs
    if (!id || id === 'undefined' || id === '[object Object]') {
        showToast("Invalid comment ID!", "error");
        return;
    }

    const inputField = document.getElementById(`input-${id}`);
    if (!inputField) return;

    const newText = inputField.value.trim();
    if (!newText) {
        showToast("Comment text cannot be empty!", "error");
        return;
    }

    try {
        // Ensure clean string formatting in URL
        const cleanId = String(id).trim();
        const res = await fetch(`${API_BASE}/api/comments/${cleanId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });

        if (res.ok) {
            showToast("Comment updated! ✨", "success");
            await loadSavedComments();
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || "Failed to update comment.", "error");
        }
    } catch (err) {
        console.error("Error editing comment:", err);
        showToast("Server error during update.", "error");
    }
}

async function deleteComment(id) {
    if (!id || id === 'undefined') {
        showToast("Invalid Comment ID.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/comments/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast("Comment deleted 💕", "success");
            await loadSavedComments();
        } else if (res.status === 404) {
            // Comment was already deleted or doesn't exist in MongoDB
            showToast("Comment no longer exists on server. Refreshing...", "error");
            await loadSavedComments();
        } else {
            const errData = await res.json().catch(() => ({}));
            showToast(errData.error || "Failed to delete comment.", "error");
        }
    } catch (err) {
        console.error("Error deleting comment:", err);
        showToast("Server error during delete.", "error");
    }
}

function escapeHtml(str) {
    return str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
}