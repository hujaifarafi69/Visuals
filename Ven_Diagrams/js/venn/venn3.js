let modeAB = "intersection";
let modeBC = "intersection";

function drawVenn3(id) {
    const c = document.getElementById(id);
    if (!c) return;

    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    const r = c.height * 0.25;

    const A = { x: c.width * 0.37, y: c.height * 0.35, r };
    const B = { x: c.width * 0.63, y: c.height * 0.35, r };
    const C = { x: c.width * 0.5,  y: c.height * 0.65, r };

    drawRegion(ctx, [A, B, C], [], "rgba(120,60,200,.75)");

    if (modeAB === "intersection") {
        drawRegion(ctx, [A, B], [C], "rgba(170,60,180,.6)");
    } else {
        drawUnionAB(ctx, A, B, C, "rgba(170,60,180,.6)");
    }

    if (modeBC === "intersection") {
        drawRegion(ctx, [B, C], [A], "rgba(60,120,150,.6)");
    } else {
        drawUnionBC(ctx, A, B, C, "rgba(60,120,150,.6)");
    }

    [A, B, C].forEach(o => {
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.stroke();
    });

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.fillText("A", A.x - r * 0.7, A.y);
    ctx.fillText("B", B.x + r * 0.7, B.y);
    ctx.fillText("C", C.x, C.y + r * 0.7);
    
    ctx.restore();
}

function drawUnionAB(ctx, A, B, C, color) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    ctx.arc(A.x, A.y, A.r, 0, Math.PI * 2);
    ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2);
    
    ctx.fillStyle = color.replace(/rgba?\(([^)]+)\)/, "rgb($1)");
    ctx.fill();
    
    ctx.restore();
}

function drawUnionBC(ctx, A, B, C, color) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    ctx.arc(B.x, B.y, B.r, 0, Math.PI * 2);
    ctx.arc(C.x, C.y, C.r, 0, Math.PI * 2);
    
    ctx.fillStyle = color.replace(/rgba?\(([^)]+)\)/, "rgb($1)");
    ctx.fill();
    
    ctx.restore();
}

function initVenn3() {
    const canvas = document.getElementById("vennCanvas");
    if (!canvas) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    drawVenn3("vennCanvas");
}

window.addEventListener("load", initVenn3);
window.addEventListener("resize", initVenn3);

function toggleModeAB() {
    modeAB = modeAB === "intersection" ? "union" : "intersection";
    document.getElementById("modeToggleAB").textContent =
        modeAB === "intersection" ? "∩" : "∪";
    drawVenn3("vennCanvas");
}

function toggleModeBC() {
    modeBC = modeBC === "intersection" ? "union" : "intersection";
    document.getElementById("modeToggleBC").textContent =
        modeBC === "intersection" ? "∩" : "∪";
    drawVenn3("vennCanvas");
}