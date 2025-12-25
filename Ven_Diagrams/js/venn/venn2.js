// ==================================
// state
// ==================================
let isIntersection2 = true;

// ==================================
// core draw 
// ==================================
function drawVenn2(id) {
    const c = document.getElementById(id);
    if (!c) return;

    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    const r = c.height * 0.25;
    const A = { x: c.width * 0.4, y: c.height / 2, r };
    const B = { x: c.width * 0.6, y: c.height / 2, r };

    if (isIntersection2) {
        // A ∩ B
        drawRegion(ctx, [A, B], [], "rgba(160,80,180,.6)");
    } else {
        // A ∪ B - Draw with full opacity then apply transparency
        ctx.save();
        ctx.globalAlpha = 0.6;
        
        // Create union path
        ctx.beginPath();
        
        // Draw A ∪ B as a single region
        // First circle A
        ctx.arc(A.x, A.y, A.r, 0, Math.PI * 2);
        
        // Second circle B  
        ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2);
        
        // Fill the combined area
        ctx.fillStyle = "rgb(160,80,180)";
        ctx.fill();
        
        ctx.restore();
    }

    // outlines (always drawn)
    [A, B].forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.stroke();
    });
}
// ==================================
// init (safe, isolated)
// ==================================
function initVenn2() {
    const canvas = document.getElementById("vennCanvas");
    if (!canvas) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    drawVenn2("vennCanvas");
}

// ==================================
// button logic (ONLY toggles state)
// ==================================
function toggleMode2() {
    isIntersection2 = !isIntersection2;

    const btn = document.getElementById("modeToggle2");
    if (btn) btn.textContent = isIntersection2 ? "∩" : "∪";

    drawVenn2("vennCanvas");
}

// ==================================
window.addEventListener("load", initVenn2);
