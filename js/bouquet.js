document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("bouquetCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const sendBtn = document.getElementById("sendBouquetBtn");
    const statusMsg = document.getElementById("bouquetStatus");
    const galleryGrid = document.getElementById("bouquetGallery");

    // Floating Sticker elements
    const floatingSticker = document.getElementById("floatingBouquet");
    const floatingImg = document.getElementById("floatingImg");
    const closeFloatingBtn = document.getElementById("closeFloatingBtn");

    // Dynamic high-DPI scaling
    const setupCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 320 * dpr;
        canvas.height = 420 * dpr;
        canvas.style.width = "320px";
        canvas.style.height = "420px";
        ctx.scale(dpr, dpr);
    };
    setupCanvas();

    // State
    let selectedFlower = "roses";
    let selectedWrap = "#ffc2d1";
    let selectedRibbon = "#ff4d6d";

    // Listener Helper
    const setupGroupListeners = (groupId, keySetter) => {
        const group = document.getElementById(groupId);
        if (!group) return;

        group.addEventListener("click", (e) => {
            const btn = e.target.closest(".option-btn");
            if (!btn) return;

            group.querySelectorAll(".option-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            keySetter(btn.dataset);
            drawBouquet();
        });
    };

    setupGroupListeners("flowerOptions", (dataset) => selectedFlower = dataset.flower);
    setupGroupListeners("wrapOptions", (dataset) => selectedWrap = dataset.wrap);
    setupGroupListeners("ribbonOptions", (dataset) => selectedRibbon = dataset.ribbon);

    function drawBouquet() {
        ctx.clearRect(0, 0, 320, 420);
        const cx = 160;

        // 1. Soft Backdrop Glow
        ctx.save();
        ctx.shadowColor = "rgba(255, 101, 132, 0.15)";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
        ctx.fillRect(20, 20, 280, 380);
        ctx.restore();

        // 2. Back Paper Wrap Layer
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - 95, 170);
        ctx.lineTo(cx + 95, 170);
        ctx.lineTo(cx + 40, 390);
        ctx.lineTo(cx - 40, 390);
        ctx.closePath();
        ctx.fillStyle = adjustColor(selectedWrap, -20);
        ctx.fill();
        ctx.restore();

        // 3. Stems & Greenery / Leaves
        drawStemsAndLeaves(cx);

        // 4. Multi-Flower Bouquet Arrangement
        const flowerPositions = [
            { x: cx - 55, y: 130, scale: 0.88, type: selectedFlower === "mixed" ? "lilies" : selectedFlower },
            { x: cx + 55, y: 130, scale: 0.88, type: selectedFlower === "mixed" ? "tulips" : selectedFlower },
            { x: cx - 30, y: 82,  scale: 0.98, type: selectedFlower === "mixed" ? "daisies" : selectedFlower },
            { x: cx + 30, y: 82,  scale: 0.98, type: selectedFlower === "mixed" ? "sunflowers" : selectedFlower },
            { x: cx,       y: 135, scale: 1.05, type: selectedFlower === "mixed" ? "roses" : selectedFlower },
            { x: cx,       y: 52,  scale: 1.12, type: selectedFlower === "mixed" ? "lilies" : selectedFlower }
        ];

        flowerPositions.forEach(p => {
            drawRealisticFlower(p.x, p.y, p.type, p.scale);
        });

        // 5. Front Paper Wrap Folds
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - 90, 180);
        ctx.lineTo(cx, 260);
        ctx.lineTo(cx - 22, 385);
        ctx.lineTo(cx - 40, 385);
        ctx.closePath();
        let gradL = ctx.createLinearGradient(cx - 90, 180, cx, 260);
        gradL.addColorStop(0, selectedWrap);
        gradL.addColorStop(1, adjustColor(selectedWrap, -10));
        ctx.fillStyle = gradL;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 90, 180);
        ctx.lineTo(cx, 260);
        ctx.lineTo(cx + 22, 385);
        ctx.lineTo(cx + 40, 385);
        ctx.closePath();
        let gradR = ctx.createLinearGradient(cx + 90, 180, cx, 260);
        gradR.addColorStop(0, adjustColor(selectedWrap, 10));
        gradR.addColorStop(1, selectedWrap);
        ctx.fillStyle = gradR;
        ctx.fill();
        ctx.restore();

        // 6. Cute Ribbon & Bow
        drawCuteRibbon(cx, 280, selectedRibbon);
    }

    function drawStemsAndLeaves(cx) {
        ctx.save();
        ctx.strokeStyle = "#40916c";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        const stems = [-45, -25, 0, 25, 45];
        stems.forEach(offset => {
            ctx.beginPath();
            ctx.moveTo(cx + offset, 150);
            ctx.quadraticCurveTo(cx + offset * 0.5, 230, cx + (offset * 0.2), 330);
            ctx.stroke();
        });

        drawLeaf(cx - 50, 160, -0.6);
        drawLeaf(cx + 50, 160, 0.6);
        drawLeaf(cx - 22, 125, -0.3);
        drawLeaf(cx + 22, 125, 0.3);
        ctx.restore();
    }

    function drawLeaf(x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        let leafGrad = ctx.createLinearGradient(-15, 0, 15, 0);
        leafGrad.addColorStop(0, "#52b788");
        leafGrad.addColorStop(1, "#74c69d");
        ctx.fillStyle = leafGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawRealisticFlower(x, y, type, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (type === "lilies") {
            for (let i = 0; i < 6; i++) {
                ctx.rotate((Math.PI * 2) / 6);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(12, 15, 6, 32);
                ctx.quadraticCurveTo(0, 38, -6, 32);
                ctx.quadraticCurveTo(-12, 15, 0, 0);

                let lilyGrad = ctx.createLinearGradient(0, 0, 0, 35);
                lilyGrad.addColorStop(0, "#ffffff");
                lilyGrad.addColorStop(0.4, "#ffb3c6");
                lilyGrad.addColorStop(0.85, "#ff4d6d");
                lilyGrad.addColorStop(1, "#c9184a");

                ctx.fillStyle = lilyGrad;
                ctx.fill();

                ctx.strokeStyle = "rgba(201, 24, 74, 0.5)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, 2);
                ctx.lineTo(0, 26);
                ctx.stroke();

                ctx.fillStyle = "#800f2f";
                ctx.beginPath();
                ctx.arc(-2, 16, 0.9, 0, Math.PI * 2);
                ctx.arc(2, 20, 0.9, 0, Math.PI * 2);
                ctx.arc(0, 12, 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            for (let i = 0; i < 6; i++) {
                ctx.rotate((Math.PI * 2) / 6);
                ctx.strokeStyle = "#d8f3dc";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(3, 8, 4, 16);
                ctx.stroke();

                ctx.fillStyle = "#ffb703";
                ctx.beginPath();
                ctx.ellipse(4, 17, 1.8, 3.5, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#74c69d";
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === "roses") {
            const roseGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
            roseGrad.addColorStop(0, "#ff4d6d");
            roseGrad.addColorStop(0.65, "#c9184a");
            roseGrad.addColorStop(1, "#590d22");

            ctx.fillStyle = roseGrad;
            for (let i = 0; i < 7; i++) {
                ctx.rotate((Math.PI * 2) / 7);
                ctx.beginPath();
                ctx.arc(0, 11, 13, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#ff758f";
            for (let i = 0; i < 5; i++) {
                ctx.rotate((Math.PI * 2) / 5);
                ctx.beginPath();
                ctx.arc(0, 6, 9, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#fff0f3";
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === "tulips") {
            const tulipGrad = ctx.createLinearGradient(0, -26, 0, 16);
            tulipGrad.addColorStop(0, "#ff758f");
            tulipGrad.addColorStop(0.6, "#ffb703");
            tulipGrad.addColorStop(1, "#ff595e");

            ctx.fillStyle = tulipGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI);
            ctx.lineTo(-18, -14);
            ctx.quadraticCurveTo(-9, -26, 0, -12);
            ctx.quadraticCurveTo(9, -26, 18, -14);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
            ctx.beginPath();
            ctx.ellipse(0, -5, 6, 12, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === "sunflowers") {
            ctx.fillStyle = "#ffb703";
            for (let i = 0; i < 14; i++) {
                ctx.rotate(Math.PI / 7);
                ctx.beginPath();
                ctx.ellipse(0, 18, 5.5, 14, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#fb8500";
            for (let i = 0; i < 14; i++) {
                ctx.rotate(Math.PI / 7);
                ctx.beginPath();
                ctx.ellipse(0, 14, 4, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#3d0c02";
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#7f4f24";
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === "daisies") {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = "rgba(0,0,0,0.1)";
            ctx.shadowBlur = 5;
            for (let i = 0; i < 12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.beginPath();
                ctx.ellipse(0, 17, 5.5, 13, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#ffb703";
            ctx.beginPath();
            ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#fb8500";
            ctx.beginPath();
            ctx.arc(2, 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawCuteRibbon(x, y, color) {
        ctx.save();
        ctx.translate(x, y);

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.quadraticCurveTo(-20, 30, -25, 45);
        ctx.moveTo(6, 8);
        ctx.quadraticCurveTo(20, 30, 25, 45);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(-18, -4, 18, 10, -Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(18, -4, 18, 10, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = adjustColor(color, 40);
        ctx.beginPath();
        ctx.ellipse(-18, -4, 8, 4, -Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(18, -4, 8, 4, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = adjustColor(color, -15);
        ctx.beginPath();
        ctx.arc(0, -2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function adjustColor(hex, percent) {
        let num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // --- COLLECTION GALLERY & UNDO FEATURE ---
    const getSavedBouquets = () => JSON.parse(localStorage.getItem("bouquetCollection") || "[]");

    const renderGallery = () => {
        if (!galleryGrid) return;
        const list = getSavedBouquets();

        if (list.length === 0) {
            galleryGrid.innerHTML = `<p style="color:#aaa; font-style:italic; grid-column:1/-1; text-align:center;">No bouquets saved yet! Build one above 💕</p>`;
            return;
        }

        galleryGrid.innerHTML = list.map((item, index) => `
            <div class="bouquet-card">
                <img src="${item.imgData}" alt="Custom Bouquet">
                <div class="card-details">
                    <div class="flower-type">${item.flower === "mixed" ? "💐 Mixed Bloom" : item.flower}</div>
                    <div class="date-label">${new Date(item.date).toLocaleDateString()}</div>
                </div>
                <button class="undo-btn" data-index="${index}">↩️ Undo / Remove</button>
            </div>
        `).join("");

        // Attach undo events
        galleryGrid.querySelectorAll(".undo-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = parseInt(e.target.dataset.index);
                removeBouquet(idx);
            });
        });
    };

    const removeBouquet = (index) => {
        let list = getSavedBouquets();
        list.splice(index, 1);
        localStorage.setItem("bouquetCollection", JSON.stringify(list));
        renderGallery();
        if (statusMsg) {
            statusMsg.innerText = "Removed from collection!";
            statusMsg.style.color = "#888";
        }
    };

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            const dataUrl = canvas.toDataURL("image/png");
            const bouquetData = {
                flower: selectedFlower,
                wrap: selectedWrap,
                ribbon: selectedRibbon,
                imgData: dataUrl,
                date: new Date().toISOString()
            };

            let list = getSavedBouquets();
            list.unshift(bouquetData); // Add to start
            localStorage.setItem("bouquetCollection", JSON.stringify(list));

            renderGallery();

            // Display floating draggable sticker
            if (floatingSticker && floatingImg) {
                floatingImg.src = dataUrl;
                floatingSticker.classList.remove("hidden");
            }

            statusMsg.innerText = "✨ Bouquet saved to collection & floating on screen! 💖";
            statusMsg.style.color = "#e04a6c";
        });
    }

    if (closeFloatingBtn) {
        closeFloatingBtn.addEventListener("click", () => {
            floatingSticker.classList.add("hidden");
        });
    }

    // --- DRAGGABLE FLOATING STICKER LOGIC ---
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    if (floatingSticker) {
        const dragStart = (e) => {
            if (e.target === closeFloatingBtn) return;

            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
            isDragging = true;
        };

        const dragEnd = () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            floatingSticker.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        };

        floatingSticker.addEventListener("touchstart", dragStart, { passive: false });
        floatingSticker.addEventListener("touchend", dragEnd, { passive: false });
        floatingSticker.addEventListener("touchmove", drag, { passive: false });

        floatingSticker.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);
    }

    // Initial renders
    drawBouquet();
    renderGallery();
});