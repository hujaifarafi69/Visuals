function drawVenn1(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const r = Math.min(c.width, c.height) * 0.3;
  const A = { x: c.width / 2, y: c.height / 2, r };

  drawRegion(ctx, [A], [], "rgba(220,80,80,.6)");
  circle(ctx, A);
  ctx.stroke();
}

function initVenn1() {
  const canvas = document.getElementById("vennCanvas");
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawVenn1("vennCanvas");
}
