function drawVenn2(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const r = c.height * 0.25;
  const A = { x: c.width * 0.4, y: c.height / 2, r };
  const B = { x: c.width * 0.6, y: c.height / 2, r };

  drawRegion(ctx, [A], [B], "rgba(220,80,80,.6)");
  drawRegion(ctx, [B], [A], "rgba(80,130,220,.6)");
  drawRegion(ctx, [A, B], [], "rgba(160,80,180,.65)");

  [A, B].forEach(o => { circle(ctx, o); ctx.stroke(); });
}

function initVenn2() {
  const canvas = document.getElementById("vennCanvas");
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawVenn2("vennCanvas");
}
