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
    // Attach click listeners to all letter cards
    document.querySelectorAll(".note-card").forEach(card => {
        card.addEventListener("click", () => {
            const letterId = card.getAttribute("data-letter");
            if (letterId) {
                openLetter(letterId);
            }
        });
    });

    // Close modal listener
    const closeModalBtn = document.getElementById("closeModalBtn");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeLetterModal);
    }

    // Modal background click to close
    const modal = document.getElementById("letterModal");
    if (modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeLetterModal();
            }
        });
    }

    // Reply / Send comment listener
    const sendBtn = document.getElementById("sendReplyBtn");
    if (sendBtn) {
        sendBtn.addEventListener("click", sendReply);
    }
});

function openLetter(id) {
    const letter = letters[id];
    if (!letter) return;

    currentLetterId = id;
    const modal = document.getElementById("letterModal");
    const titleEl = document.getElementById("letterTitle");
    const contentEl = document.getElementById("letterContent");
    const statusEl = document.getElementById("replyStatus");
    const replyInput = document.getElementById("replyInput");

    if (titleEl) titleEl.innerText = letter.title;
    if (contentEl) contentEl.innerText = letter.content;
    if (statusEl) statusEl.innerText = "";
    if (replyInput) replyInput.value = "";

    if (modal) modal.style.display = "flex";

    // Load comments directly from MongoDB
    loadSavedComments();
}

function closeLetterModal() {
    const modal = document.getElementById("letterModal");
    if (modal) modal.style.display = "none";
    currentLetterId = null;
}

// SAVE COMMENT TO MONGODB
async function sendReply() {
    const replyInput = document.getElementById("replyInput");
    const replyText = replyInput ? replyInput.value.trim() : "";
    const status = document.getElementById("replyStatus");

    if (!replyText) {
        if (status) {
            status.style.color = "#e04a6c";
            status.innerText = "Please type a short message first!";
        }
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                letterId: currentLetterId,
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })
        });

        if (response.ok) {
            if (status) {
                status.style.color = "#48bb78";
                status.innerText = "Comment added to MongoDB! 💕";
            }
            if (replyInput) replyInput.value = "";
            
            // Refresh comments from backend
            loadSavedComments();
        } else {
            throw new Error("Failed to save comment.");
        }
    } catch (err) {
        console.error("Error saving comment to MongoDB:", err);
        if (status) {
            status.style.color = "#e04a6c";
            status.innerText = "Error: Make sure your server (npm start) is running!";
        }
    }
}

// FETCH COMMENTS FROM MONGODB
async function loadSavedComments() {
    if (!currentLetterId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/comments/${currentLetterId}`);
        const commentsList = await response.json();

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

        if (!commentsList || commentsList.length === 0) {
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
    } catch (err) {
        console.error("Error loading comments from MongoDB:", err);
    }
}