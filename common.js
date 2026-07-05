// ============================================================
// Quazzy's Foodaria — Station Common Framework
// ============================================================
"use strict";

const StationCommon = {
  HEADER_H: 84,
  FOOTER_H: 90,

  drawHeader(ctx, w, title, ticketLines) {
    Draw.rr(ctx, 0, 0, w, StationCommon.HEADER_H, 0);
    const grd = ctx.createLinearGradient(0, 0, 0, StationCommon.HEADER_H);
    grd.addColorStop(0, "#241d2c");
    grd.addColorStop(1, "#1a1520");
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = "#3a3244";
    ctx.beginPath();
    ctx.moveTo(0, StationCommon.HEADER_H);
    ctx.lineTo(w, StationCommon.HEADER_H);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#f2b60d";
    ctx.font = "bold 20px Baloo2, sans-serif";
    ctx.fillText(title, 18, 28);

    ctx.fillStyle = "#e8e4de";
    ctx.font = "15px Nunito, sans-serif";
    ticketLines.forEach((line, i) => {
      ctx.fillText(line, 18, 48 + i * 18);
    });
  },

  drawStepDots(ctx, w, step, total) {
    const y = StationCommon.HEADER_H - 10;
    const spacing = 26;
    const startX = w - 18 - (total - 1) * spacing;
    for (let i = 0; i < total; i++) {
      const x = startX + i * spacing;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < step ? "#57c94b" : i === step ? "#f2b60d" : "#3a3444";
      ctx.fill();
      ctx.strokeStyle = "#14101a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },

  drawSendButton(ctx, w, h, enabled) {
    const bw = 160, bh = 52;
    const x = w - bw - 20, y = h - bh - 18;
    Draw.button(ctx, x, y, bw, bh, "SEND TO TRAY", {
      fill: enabled ? "#57c94b" : "#3a3444",
      stroke: enabled ? "#2f8a29" : "#201c26",
      text: enabled ? "#0c1a08" : "#807a88"
    });
    return { x, y, w: bw, h: bh, enabled };
  },

  drawTrash(ctx, w, h) {
    const x = 20, y = h - 70;
    Draw.button(ctx, x, y, 90, 50, "RESET", { fill: "#7a3436", stroke: "#4a1e20" });
    return { x, y, w: 90, h: 50 };
  },

  toast(ctx, w, h, text, color = "#f2b60d") {
    ctx.save();
    ctx.globalAlpha = 0.95;
    Draw.rr(ctx, w / 2 - 160, h / 2 - 34, 320, 68, 16);
    ctx.fillStyle = "#1a1520";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "bold 22px Baloo2, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2);
    ctx.restore();
  },

  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
};
