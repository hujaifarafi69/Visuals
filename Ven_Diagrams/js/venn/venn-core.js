// Offscreen canvas for compositing
const Off = document.createElement("canvas");
const O = Off.getContext("2d");

function circle(ctx, c) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.closePath();
}

function drawRegion(ctx, keep, remove, color) {
  Off.width = ctx.canvas.width;
  Off.height = ctx.canvas.height;
  O.clearRect(0, 0, Off.width, Off.height);

  circle(O, keep[0]);
  O.fill();

  for (let i = 1; i < keep.length; i++) {
    O.globalCompositeOperation = "source-in";
    circle(O, keep[i]);
    O.fill();
  }

  for (const r of remove) {
    O.globalCompositeOperation = "destination-out";
    circle(O, r);
    O.fill();
  }

  ctx.drawImage(Off, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = "source-over";
}
