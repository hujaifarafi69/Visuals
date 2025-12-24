function drawVenn3(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);

  const r = c.height * 0.25;
  const A = { x: c.width * 0.37, y: c.height * 0.35, r };
  const B = { x: c.width * 0.63, y: c.height * 0.35, r };
  const C = { x: c.width * 0.5, y: c.height * 0.65, r };

  drawRegion(ctx, [A], [B, C], "rgba(220,80,80,.55)");
  drawRegion(ctx, [B], [A, C], "rgba(80,130,220,.55)");
  drawRegion(ctx, [C], [A, B], "rgba(80,180,100,.55)");
  drawRegion(ctx, [A, B], [C], "rgba(170,60,180,.55)");
  drawRegion(ctx, [A, C], [B], "rgba(200,120,70,.55)");
  drawRegion(ctx, [B, C], [A], "rgba(60,120,150,.55)");
  drawRegion(ctx, [A, B, C], [], "rgba(120,60,200,.75)");

  [A, B, C].forEach(o => { circle(ctx, o); ctx.stroke(); });
}

function initVenn3() {
  const canvas = document.getElementById("vennCanvas");
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawVenn3("vennCanvas");
}
