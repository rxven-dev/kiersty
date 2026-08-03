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
    const editCaptionInput = document.getElementById("editCaptionInput");
    const editFileInput = document.getElementById("editFileInput");
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

    // State initialization with solid fallbacks
    let memories = [];
    let defaultAlbums = ["Dates", "Trips", "Daily"];
    let customAlbums = JSON.parse(localStorage.getItem("kiersty_custom_albums"));

    if (!customAlbums || !Array.isArray(customAlbums) || customAlbums.length === 0) {
        customAlbums = defaultAlbums;
        localStorage.setItem("kiersty_custom_albums", JSON.stringify(customAlbums));
    }

    let selectedAlbum = "all";
    let activeMemoryId = null;
    let albumToEdit = null;

    // --- Immediate UI Render ---
    initAlbumsUI();
    loadMemoriesFromDB();

    async function loadMemoriesFromDB() {
        try {
            const res = await fetch(`${API_BASE}/memories`);
            if (res.ok) {
                memories = await res.json();
                
                // Merge MongoDB albums with local custom albums
                const dbAlbums = memories.map(m => m.album).filter(Boolean);
                let updated = false;
                dbAlbums.forEach(a => {
                    if (!customAlbums.includes(a)) {
                        customAlbums.push(a);
                        updated = true;
                    }
                });

                if (updated) {
                    saveAlbumsToLocalStorage();
                }

                initAlbumsUI();
                renderGallery();
            }
        } catch (err) {
            console.warn("Could not reach backend API, rendering local memories.", err);
            renderGallery();
        }
    }

    function saveAlbumsToLocalStorage() {
        localStorage.setItem("kiersty_custom_albums", JSON.stringify(customAlbums));
    }

    // Modal Control Handlers
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

    // Helper: Formats Base64 images properly so they never render blank
    function formatImageSrc(imgSrc) {
        if (!imgSrc || imgSrc.trim() === "") return "";
        if (!imgSrc.startsWith("data:") && !imgSrc.startsWith("http")) {
            return `data:image/jpeg;base64,${imgSrc}`;
        }
        return imgSrc;
    }

    // Upload New Memory
    if (memoryForm) {
        memoryForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const fileInput = document.getElementById("imageFile");
            const captionInput = document.getElementById("imageCaption") ? document.getElementById("imageCaption").value : "";
            const albumVal = albumSelect ? albumSelect.value : "Daily";

            if (!fileInput || !fileInput.files || !fileInput.files[0]) {
                alert("Please select a photo file!");
                return;
            }

            const reader = new FileReader();
            reader.onload = async function (event) {
                const base64Data = event.target.result;
                if (!base64Data) {
                    alert("Failed to read image file.");
                    return;
                }

                const newMemoryPayload = {
                    image: base64Data,
                    caption: captionInput,
                    album: albumVal
                };

                try {
                    console.log("Sending photo to server...");
                    const response = await fetch(`${API_BASE}/memories`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newMemoryPayload)
                    });

                    if (response.ok) {
                        const savedItem = await response.json();
                        console.log("SUCCESS! Saved to MongoDB:", savedItem);
                        selectedAlbum = "all"; // Reset album filter so photo is visible immediately
                        await loadMemoriesFromDB();
                    } else {
                        const errorText = await response.text();
                        console.error("Server error response:", errorText);
                        alert(`Server rejected upload (${response.status}): ${errorText}`);
                    }
                } catch (err) {
                    console.error("Network/Fetch error:", err);
                    alert("Network error: Could not connect to http://localhost:5000.");
                }
            };
            reader.readAsDataURL(fileInput.files[0]);

            memoryForm.reset();
            uploadModal.style.display = "none";
        });
    }

    // EDIT PHOTO HANDLERS
    if (editMemoryBtn) {
        editMemoryBtn.onclick = () => {
            const mem = memories.find(m => (m._id || m.id) === activeMemoryId);
            if (!mem) return;

            if (editCaptionInput) editCaptionInput.value = mem.caption || "";
            if (editAlbumSelect) editAlbumSelect.value = mem.album || "Daily";
            
            if (viewModeDetails) viewModeDetails.style.display = "none";
            if (editForm) editForm.style.display = "block";
        };
    }

    if (cancelEditBtn) {
        cancelEditBtn.onclick = () => {
            if (editForm) editForm.style.display = "none";
            if (viewModeDetails) viewModeDetails.style.display = "block";
        };
    }

    if (editForm) {
        editForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const memIndex = memories.findIndex(m => (m._id || m.id) === activeMemoryId);
            if (memIndex === -1) return;

            const mem = memories[memIndex];
            let updatedPayload = {
                caption: editCaptionInput ? editCaptionInput.value : mem.caption,
                album: editAlbumSelect ? editAlbumSelect.value : mem.album,
                image: mem.image || mem.src
            };

            const performUpdate = async (payload) => {
                try {
                    const res = await fetch(`${API_BASE}/memories/${activeMemoryId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        const updatedItem = await res.json();
                        memories[memIndex] = updatedItem;
                    } else {
                        memories[memIndex] = { ...memories[memIndex], ...payload };
                    }
                } catch (err) {
                    console.error("Failed to update photo in DB:", err);
                    memories[memIndex] = { ...memories[memIndex], ...payload };
                }

                renderGallery();
                openViewModal(activeMemoryId);
            };

            if (editFileInput && editFileInput.files && editFileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    updatedPayload.image = event.target.result;
                    await performUpdate(updatedPayload);
                };
                reader.readAsDataURL(editFileInput.files[0]);
            } else {
                await performUpdate(updatedPayload);
            }
        });
    }

    // DELETE PHOTO HANDLERS
    if (deleteMemoryBtn) {
        deleteMemoryBtn.onclick = () => {
            if (deleteConfirmModal) deleteConfirmModal.style.display = "flex";
        };
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.onclick = () => {
            if (deleteConfirmModal) deleteConfirmModal.style.display = "none";
        };
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
            if (activeMemoryId) {
                try {
                    await fetch(`${API_BASE}/memories/${activeMemoryId}`, {
                        method: "DELETE"
                    });
                } catch (err) {
                    console.error("Failed to delete memory from DB:", err);
                }

                memories = memories.filter(m => (m._id || m.id) !== activeMemoryId);
                if (deleteConfirmModal) deleteConfirmModal.style.display = "none";
                closeViewModal();
                renderGallery();
            }
        };
    }

    // Create Album Handlers
    if (cancelAlbumBtn) {
        cancelAlbumBtn.onclick = () => {
            createAlbumModal.style.display = "none";
            if (newAlbumNameInput) newAlbumNameInput.value = "";
        };
    }

    if (confirmAlbumBtn) {
        confirmAlbumBtn.onclick = () => {
            const name = newAlbumNameInput ? newAlbumNameInput.value.trim() : "";
            if (name && !customAlbums.includes(name)) {
                customAlbums.push(name);
                saveAlbumsToLocalStorage();
                initAlbumsUI();
            }
            createAlbumModal.style.display = "none";
            if (newAlbumNameInput) newAlbumNameInput.value = "";
        };
    }

    // Edit/Manage Album Handlers
    function openEditAlbumModal(albumName) {
        albumToEdit = albumName;
        if (editAlbumNameInput) editAlbumNameInput.value = albumName;
        if (editAlbumModal) editAlbumModal.style.display = "flex";
    }

    if (cancelEditAlbumBtn) {
        cancelEditAlbumBtn.onclick = () => {
            if (editAlbumModal) editAlbumModal.style.display = "none";
            albumToEdit = null;
        };
    }

    if (saveAlbumRenameBtn) {
        saveAlbumRenameBtn.onclick = () => {
            const newName = editAlbumNameInput ? editAlbumNameInput.value.trim() : "";
            if (newName && albumToEdit && newName !== albumToEdit) {
                const idx = customAlbums.indexOf(albumToEdit);
                if (idx !== -1) customAlbums[idx] = newName;
                
                if (selectedAlbum === albumToEdit) selectedAlbum = newName;

                saveAlbumsToLocalStorage();
                initAlbumsUI();
                renderGallery();
            }
            if (editAlbumModal) editAlbumModal.style.display = "none";
            albumToEdit = null;
        };
    }

    if (deleteAlbumBtn) {
        deleteAlbumBtn.onclick = () => {
            if (albumToEdit) {
                customAlbums = customAlbums.filter(a => a !== albumToEdit);
                if (customAlbums.length === 0) customAlbums = ["Daily"];
                if (selectedAlbum === albumToEdit) selectedAlbum = "all";
                
                saveAlbumsToLocalStorage();
                initAlbumsUI();
                renderGallery();
            }
            if (editAlbumModal) editAlbumModal.style.display = "none";
            albumToEdit = null;
        };
    }

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
            galleryGrid.innerHTML = `<p style="grid-column: 1/-1; color: #7d656e; text-align: center; padding: 20px;">No memories found in this album. ✨</p>`;
            return;
        }

        filtered.forEach(mem => {
            const imgSrc = formatImageSrc(mem.image || mem.src);

            const item = document.createElement("div");
            item.className = "gallery-item";
            item.innerHTML = `
                <img src="${imgSrc}" alt="${mem.caption || 'Memory'}">
                <div class="gallery-overlay">
                    <span>${mem.caption || ''}</span>
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
        const imgSrc = formatImageSrc(mem.image || mem.src);

        if (viewImage) viewImage.src = imgSrc;
        if (viewCaption) viewCaption.textContent = mem.caption || "";
        if (viewAlbumBadge) viewAlbumBadge.textContent = mem.album || "Daily";

        if (viewModeDetails) viewModeDetails.style.display = "block";
        if (editForm) editForm.style.display = "none";
        if (viewModal) viewModal.style.display = "flex";
    }

    function closeViewModal() {
        if (viewModal) viewModal.style.display = "none";
        activeMemoryId = null;
    }

    // Render Albums UI Chips & Dropdowns
    function initAlbumsUI() {
        if (albumSelect) albumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");
        if (editAlbumSelect) editAlbumSelect.innerHTML = customAlbums.map(a => `<option value="${a}">${a}</option>`).join("");

        if (albumsBar) {
            const chipsHtml = `
                <button class="album-chip ${selectedAlbum === 'all' ? 'active' : ''}" data-album="all">All Photos</button>
                ${customAlbums.map(a => `
                    <button class="album-chip ${selectedAlbum === a ? 'active' : ''}" data-album="${a}">
                        <span>${a}</span>
                        <i class="fa-solid fa-ellipsis-vertical edit-album-trigger" data-album-name="${a}" title="Manage Album" style="margin-left: 8px; cursor: pointer; opacity: 0.7;"></i>
                    </button>
                `).join("")}
                <button class="album-chip add-album-chip" id="addAlbumBtn"><i class="fa-solid fa-plus"></i> New Album</button>
            `;
            albumsBar.innerHTML = chipsHtml;

            // Album chip click listener
            document.querySelectorAll(".album-chip:not(.add-album-chip)").forEach(chip => {
                chip.addEventListener("click", (e) => {
                    if (e.target.classList.contains("edit-album-trigger")) return; 
                    document.querySelectorAll(".album-chip").forEach(c => c.classList.remove("active"));
                    chip.classList.add("active");
                    selectedAlbum = chip.getAttribute("data-album");
                    renderGallery();
                });
            });

            // Edit album three-dots icon click listener
            document.querySelectorAll(".edit-album-trigger").forEach(icon => {
                icon.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const albumName = icon.getAttribute("data-album-name");
                    openEditAlbumModal(albumName);
                });
            });

            // Add album button listener
            const addBtn = document.getElementById("addAlbumBtn");
            if (addBtn) {
                addBtn.addEventListener("click", () => {
                    if (createAlbumModal) createAlbumModal.style.display = "flex";
                    if (newAlbumNameInput) newAlbumNameInput.focus();
                });
            }
        }
    }
});