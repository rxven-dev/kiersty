document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000/api";

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

    // State
    let memories = [];
    let customAlbums = ["Dates", "Trips", "Daily"];
    let selectedAlbum = "all";
    let activeMemoryId = null;
    let albumToEdit = null;

    // Initialize data from MongoDB
    loadMemoriesFromDB();

    async function loadMemoriesFromDB() {
        try {
            const res = await fetch(`${API_BASE}/memories`);
            if (res.ok) {
                memories = await res.json();
                
                // Extract unique albums from MongoDB records
                const dbAlbums = memories.map(m => m.album).filter(Boolean);
                dbAlbums.forEach(a => {
                    if (!customAlbums.includes(a)) customAlbums.push(a);
                });

                initAlbumsUI();
                renderGallery();
            }
        } catch (err) {
            console.error("Failed to fetch memories from MongoDB:", err);
        }
    }

    // Modals display trigger
    if (openModalBtn) openModalBtn.onclick = () => uploadModal.style.display = "flex";
    if (closeModalBtn) closeModalBtn.onclick = () => uploadModal.style.display = "none";
    if (closeViewBtn) closeViewBtn.onclick = () => closeViewModal();

    window.onclick = (e) => {
        if (e.target === uploadModal) uploadModal.style.display = "none";
        if (e.target === viewModal) closeViewModal();
        if (e.target === createAlbumModal) createAlbumModal.style.display = "none";
        if (e.target === editAlbumModal) editAlbumModal.style.display = "none";
        if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = "none";
    };

    // Form submission -> Save to MongoDB
    memoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("imageFile");
        const captionInput = document.getElementById("imageCaption").value;
        const albumVal = albumSelect.value;

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function (event) {
                const newMemoryPayload = {
                    image: event.target.result,
                    caption: captionInput,
                    album: albumVal
                };

                try {
                    const response = await fetch(`${API_BASE}/memories`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newMemoryPayload)
                    });

                    if (response.ok) {
                        await loadMemoriesFromDB();
                    }
                } catch (err) {
                    console.error("Error saving photo to database:", err);
                }
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
            initAlbumsUI();
        }
        createAlbumModal.style.display = "none";
        newAlbumNameInput.value = "";
    };

    // Search filter listener
    if (searchInput) searchInput.addEventListener("input", renderGallery);

    // Render Gallery Photos Grid
    function renderGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = "";
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        const filtered = memories.filter(mem => {
            const matchesSearch = mem.caption ? mem.caption.toLowerCase().includes(query) : true;
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
                <img src="${mem.image || mem.src}" alt="${mem.caption}">
                <div class="gallery-overlay">
                    <span>${mem.caption}</span>
                    <small>📷 ${mem.album || 'Daily'}</small>
                </div>
            `;
            item.addEventListener("click", () => openViewModal(mem._id || mem.id));
            galleryGrid.appendChild(item);
        });
    }

    // Lightbox / View Modal logic
    function openViewModal(id) {
        const mem = memories.find(m => (m._id || m.id) === id);
        if (!mem) return;

        activeMemoryId = id;
        viewImage.src = mem.image || mem.src;
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

    // Render Albums UI Chips & Dropdowns
    function initAlbumsUI() {
        if (albumSelect) albumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");
        if (editAlbumSelect) editAlbumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");

        const chipsHtml = `
            <button class="album-chip ${selectedAlbum === 'all' ? 'active' : ''}" data-album="all">All Photos</button>
            ${customAlbums.map(a => `
                <button class="album-chip ${selectedAlbum === a ? 'active' : ''}" data-album="${a}">
                    <span>${a}</span>
                </button>
            `).join("")}
            <button class="album-chip add-album-chip" id="addAlbumBtn"><i class="fa-solid fa-plus"></i> New Album</button>
        `;
        if (albumsBar) albumsBar.innerHTML = chipsHtml;

        document.querySelectorAll(".album-chip:not(.add-album-chip)").forEach(chip => {
            chip.addEventListener("click", () => {
                document.querySelectorAll(".album-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                selectedAlbum = chip.getAttribute("data-album");
                renderGallery();
            });
        });

        const addBtn = document.getElementById("addAlbumBtn");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                createAlbumModal.style.display = "flex";
                newAlbumNameInput.focus();
            });
        }
    }
});