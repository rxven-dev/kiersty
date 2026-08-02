document.addEventListener("DOMContentLoaded", () => {
    // Modals
    const uploadModal = document.getElementById("uploadModal");
    const viewModal = document.getElementById("viewModal");
    const createAlbumModal = document.getElementById("createAlbumModal");
    const editAlbumModal = document.getElementById("editAlbumModal");
    const deleteConfirmModal = document.getElementById("deleteConfirmModal");

    // Form & Controls
    const memoryForm = document.getElementById("memoryForm");
    const editForm = document.getElementById("editForm");
    const albumSelect = document.getElementById("albumSelect");
    const editAlbumSelect = document.getElementById("editAlbumSelect");
    const galleryGrid = document.getElementById("galleryGrid");
    const searchInput = document.getElementById("searchInput");
    const albumsBar = document.getElementById("albumsBar");

    // Open/Close Buttons
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const closeViewBtn = document.getElementById("closeViewBtn");

    // Lightbox Viewing Elements
    const viewImage = document.getElementById("viewImage");
    const viewCaption = document.getElementById("viewCaption");
    const viewAlbumBadge = document.getElementById("viewAlbumBadge");
    const viewModeDetails = document.getElementById("viewModeDetails");
    const editMemoryBtn = document.getElementById("editMemoryBtn");
    const deleteMemoryBtn = document.getElementById("deleteMemoryBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    // Create Album Modal Elements
    const newAlbumNameInput = document.getElementById("newAlbumNameInput");
    const cancelAlbumBtn = document.getElementById("cancelAlbumBtn");
    const confirmAlbumBtn = document.getElementById("confirmAlbumBtn");

    // Edit Album Modal Elements
    const editAlbumNameInput = document.getElementById("editAlbumNameInput");
    const saveAlbumRenameBtn = document.getElementById("saveAlbumRenameBtn");
    const deleteAlbumBtn = document.getElementById("deleteAlbumBtn");
    const cancelEditAlbumBtn = document.getElementById("cancelEditAlbumBtn");

    // Delete Memory Elements
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    // Stock Photos
    const defaultMemories = [
        { id: "1", src: "https://i.ibb.co/XxJ4SzrK/99f138e6-9963-4864-a84f-2a73b32de9c8.jpg", caption: "First Date ☕", album: "Dates" },
        { id: "2", src: "https://i.ibb.co/kg12vH75/3cdd147e-ec86-467d-a603-9566ffdc1592.jpg", caption: "Cine Date 🎬", album: "Dates" },
        { id: "3", src: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=600&auto=format&fit=crop", caption: "Just Us 💖", album: "Daily" }
    ];

    // State
    let memories = JSON.parse(localStorage.getItem("customMemories")) || defaultMemories;
    let customAlbums = JSON.parse(localStorage.getItem("customAlbums")) || ["Dates", "Trips", "Daily"];
    let selectedAlbum = "all";
    let activeMemoryId = null;
    let albumToEdit = null;

    // Initialize
    initAlbumsUI();
    renderGallery();

    // Modals display trigger
    openModalBtn.onclick = () => uploadModal.style.display = "flex";
    closeModalBtn.onclick = () => uploadModal.style.display = "none";
    closeViewBtn.onclick = () => closeViewModal();

    window.onclick = (e) => {
        if (e.target === uploadModal) uploadModal.style.display = "none";
        if (e.target === viewModal) closeViewModal();
        if (e.target === createAlbumModal) createAlbumModal.style.display = "none";
        if (e.target === editAlbumModal) editAlbumModal.style.display = "none";
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = "none";
    };

    // Form submission
    memoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("imageFile");
        const captionInput = document.getElementById("imageCaption").value;
        const albumVal = albumSelect.value;

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const newMemory = {
                    id: Date.now().toString(),
                    src: event.target.result,
                    caption: captionInput,
                    album: albumVal
                };
                memories.unshift(newMemory);
                saveMemories();
                renderGallery();
            };
            reader.readAsDataURL(fileInput.files[0]);
        }

        memoryForm.reset();
        uploadModal.style.display = "none";
    });

    // Create Album Modal handlers
    cancelAlbumBtn.onclick = () => {
        createAlbumModal.style.display = "none";
        newAlbumNameInput.value = "";
    };

    confirmAlbumBtn.onclick = () => {
        const name = newAlbumNameInput.value.trim();
        if (name && !customAlbums.includes(name)) {
            customAlbums.push(name);
            localStorage.setItem("customAlbums", JSON.stringify(customAlbums));
            initAlbumsUI();
        }
        createAlbumModal.style.display = "none";
        newAlbumNameInput.value = "";
    };

    // Edit & Rename Album Handlers
    cancelEditAlbumBtn.onclick = () => {
        editAlbumModal.style.display = "none";
        albumToEdit = null;
    };

    saveAlbumRenameBtn.onclick = () => {
        const newName = editAlbumNameInput.value.trim();
        if (newName && albumToEdit && newName !== albumToEdit) {
            // Update album list
            const index = customAlbums.indexOf(albumToEdit);
            if (index !== -1) customAlbums[index] = newName;

            // Update photos album tags
            memories.forEach(mem => {
                if (mem.album === albumToEdit) mem.album = newName;
            });

            if (selectedAlbum === albumToEdit) selectedAlbum = newName;

            localStorage.setItem("customAlbums", JSON.stringify(customAlbums));
            saveMemories();
            initAlbumsUI();
            renderGallery();
        }
        editAlbumModal.style.display = "none";
        albumToEdit = null;
    };

    deleteAlbumBtn.onclick = () => {
        if (!albumToEdit) return;

        // Remove album from array
        customAlbums = customAlbums.filter(a => a !== albumToEdit);

        // Reassign photos in this album to "Daily"
        memories.forEach(mem => {
            if (mem.album === albumToEdit) mem.album = "Daily";
        });

        if (!customAlbums.includes("Daily")) customAlbums.push("Daily");

        if (selectedAlbum === albumToEdit) selectedAlbum = "all";

        localStorage.setItem("customAlbums", JSON.stringify(customAlbums));
        saveMemories();
        initAlbumsUI();
        renderGallery();

        editAlbumModal.style.display = "none";
        albumToEdit = null;
    };

    // Search filter listener
    searchInput.addEventListener("input", renderGallery);

    // Render Gallery Photos Grid
    function renderGallery() {
        galleryGrid.innerHTML = "";
        const query = searchInput.value.toLowerCase().trim();

        const filtered = memories.filter(mem => {
            const matchesSearch = mem.caption.toLowerCase().includes(query);
            const matchesAlbum = selectedAlbum === "all" || mem.album === selectedAlbum;
            return matchesSearch && matchesAlbum;
        });

        if (filtered.length === 0) {
            galleryGrid.innerHTML = `<p style="grid-column: 1/-1; color: #7d656e;">No memories found matching your search. ✨</p>`;
            return;
        }

        filtered.forEach(mem => {
            const item = document.createElement("div");
            item.className = "gallery-item";
            item.innerHTML = `
                <img src="${mem.src}" alt="${mem.caption}">
                <div class="gallery-overlay">
                    <span>${mem.caption}</span>
                    <small>📷 ${mem.album || 'Daily'}</small>
                </div>
            `;
            item.addEventListener("click", () => openViewModal(mem.id));
            galleryGrid.appendChild(item);
        });
    }

    // Lightbox / View Modal logic
    function openViewModal(id) {
        const mem = memories.find(m => m.id === id);
        if (!mem) return;

        activeMemoryId = id;
        viewImage.src = mem.src;
        viewCaption.textContent = mem.caption;
        viewAlbumBadge.textContent = mem.album || "Daily";

        viewModeDetails.style.display = "block";
        editForm.style.display = "none";
        viewModal.style.display = "flex";
    }

    function closeViewModal() {
        viewModal.style.display = "none";
        activeMemoryId = null;
    }

    editMemoryBtn.addEventListener("click", () => {
        const mem = memories.find(m => m.id === activeMemoryId);
        if (!mem) return;

        document.getElementById("editCaptionInput").value = mem.caption;
        editAlbumSelect.value = mem.album || customAlbums[0];

        viewModeDetails.style.display = "none";
        editForm.style.display = "block";
    });

    cancelEditBtn.addEventListener("click", () => {
        viewModeDetails.style.display = "block";
        editForm.style.display = "none";
    });

    editForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const memIndex = memories.findIndex(m => m.id === activeMemoryId);
        if (memIndex === -1) return;

        const newCaption = document.getElementById("editCaptionInput").value;
        const newAlbum = editAlbumSelect.value;
        const editFileInput = document.getElementById("editFileInput");

        memories[memIndex].caption = newCaption;
        memories[memIndex].album = newAlbum;

        const finalizeEdit = () => {
            saveMemories();
            renderGallery();
            closeViewModal();
        };

        if (editFileInput.files && editFileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (event) {
                memories[memIndex].src = event.target.result;
                finalizeEdit();
            };
            reader.readAsDataURL(editFileInput.files[0]);
        } else {
            finalizeEdit();
        }
    });

    // Delete Memory logic
    deleteMemoryBtn.addEventListener("click", () => {
        deleteConfirmModal.style.display = "flex";
    });

    cancelDeleteBtn.onclick = () => deleteConfirmModal.style.display = "none";

    confirmDeleteBtn.onclick = () => {
        memories = memories.filter(m => m.id !== activeMemoryId);
        saveMemories();
        renderGallery();
        deleteConfirmModal.style.display = "none";
        closeViewModal();
    };

    // Render Albums UI Chips & Dropdowns
    function initAlbumsUI() {
        albumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");
        editAlbumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");

        const chipsHtml = `
            <button class="album-chip ${selectedAlbum === 'all' ? 'active' : ''}" data-album="all">All Photos</button>
            ${customAlbums.map(a => `
                <button class="album-chip ${selectedAlbum === a ? 'active' : ''}" data-album="${a}">
                    <span>${a}</span>
                    <i class="fa-solid fa-pen-to-square album-edit-btn" data-edit-album="${a}" title="Edit or Delete Album"></i>
                </button>
            `).join("")}
            <button class="album-chip add-album-chip" id="addAlbumBtn"><i class="fa-solid fa-plus"></i> New Album</button>
        `;
        albumsBar.innerHTML = chipsHtml;

        // Add filter click handlers to chips
        document.querySelectorAll(".album-chip:not(.add-album-chip)").forEach(chip => {
            chip.addEventListener("click", (e) => {
                if (e.target.classList.contains("album-edit-btn")) return; // Don't filter when clicking edit icon
                document.querySelectorAll(".album-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                selectedAlbum = chip.getAttribute("data-album");
                renderGallery();
            });
        });

        // Add Edit Album Icon handlers
        document.querySelectorAll(".album-edit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                albumToEdit = btn.getAttribute("data-edit-album");
                editAlbumNameInput.value = albumToEdit;
                editAlbumModal.style.display = "flex";
            });
        });

        document.getElementById("addAlbumBtn").addEventListener("click", () => {
            createAlbumModal.style.display = "flex";
            newAlbumNameInput.focus();
        });
    }

    function saveMemories() {
        localStorage.setItem("customMemories", JSON.stringify(memories));
    }
});