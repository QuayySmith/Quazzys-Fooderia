// ============================================================
// Quazzy's Foodaria — Wings Station
// ============================================================
"use strict";

function createWingsStation(api) {
  const { spec } = api; // {sauce, crispy}
  const perfectFrom = spec.crispy === "extra" ? 0.6 : 0.4;
  const perfectTo = spec.crispy === "extra" ? 0.8 : 0.6;
  const zones = [
    { id: "under", from: 0, to: perfectFrom, color: "#e0b06a" },
    { id: "perfect", from: perfectFrom, to: perfectTo, color: "#c9843c" },
    { id: "burnt", from: perfectTo, to: 1, color: "#301c10" }
  ];
  const st = { phase: "fry", frying: false, progress: 0, pulled: false, resultZone: null, sauceApplied: null, plated: false };
  const layout = {};

  function zoneAt(p) { return zones.find((z) => p >= z.from && p < z.to) || zones[zones.length - 1]; }
  function drop() { st.frying = true; st.progress = 0; AudioEngine.play("sizzle"); }
  function pull() {
    st.pulled = true; st.frying = false;
    st.resultZone = zoneAt(StationCommon.clamp(st.progress, 0, 0.999)).id;
    AudioEngine.play(st.resultZone === "burnt" ? "burnt" : "ding");
    setTimeout(() => { st.phase = "sauce"; }, 250);
  }
  function update(dt) {
    if (st.frying && !st.pulled) { st.progress += dt / 7; if (st.progress > 1.05) st.progress = 1.05; }
  }
  function computeScore() {
    const crispScore = st.resultZone === "perfect" ? 1 : st.resultZone === "under" ? 0.5 : 0.3;
    const sauceOk = st.sauceApplied === spec.sauce;
    return StationCommon.clamp(crispScore * 0.55 + (sauceOk ? 0.45 : 0.1), 0, 1);
  }

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const bgGrd = ctx.createLinearGradient(0, 0, 0, h);
    bgGrd.addColorStop(0, "#3a2a26"); bgGrd.addColorStop(1, "#221816");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, w, h);

    const sauceDef = GameData.wingSauces.find((s) => s.id === spec.sauce);
    StationCommon.drawHeader(ctx, w, "🍗 Wings Station", [
      `Sauce: ${sauceDef ? sauceDef.name : "?"}`,
      `Crispy: ${spec.crispy === "extra" ? "Extra Crispy" : "Normal"}`
    ]);
    StationCommon.drawStepDots(ctx, w, st.phase === "fry" ? 0 : st.phase === "sauce" ? 1 : 2, 3);

    const cy = StationCommon.HEADER_H + 40;
    Draw.rr(ctx, w / 2 - 90, cy, 180, 120, 10);
    ctx.fillStyle = "#2a2422"; ctx.fill();
    ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.stroke();

    if (st.phase === "fry") {
      if (!st.frying && !st.pulled) {
        layout.drop = { x: w / 2 - 90, y: cy + 140, w: 180, h: 48 };
        Draw.button(ctx, layout.drop.x, layout.drop.y, layout.drop.w, layout.drop.h, "Drop Wings");
      } else {
        for (let i = 0; i < 5; i++) {
          Draw.wingPiece(ctx, w / 2 - 70 + (i % 3) * 60, cy + 40 + Math.floor(i / 3) * 45, 60, null);
        }
        const barY = cy + 150;
        StationCommon.zoneBar(ctx, w / 2 - 160, barY, 320, 22, zones);
        Draw.needle(ctx, w / 2 - 160, barY, 320, 22, st.progress);
        if (!st.pulled) {
          layout.pull = { x: w / 2 - 90, y: cy + 185, w: 180, h: 46 };
          Draw.button(ctx, layout.pull.x, layout.pull.y, layout.pull.w, layout.pull.h, "Pull From Fryer", { fill: "#f2b60d", stroke: "#a97906", text: "#241a05" });
        } else {
          ctx.fillStyle = "#57c94b"; ctx.font = "bold 18px Baloo2, sans-serif"; ctx.textAlign = "center";
          ctx.fillText("Moving to sauce…", w / 2, cy + 200);
        }
      }
    } else if (st.phase === "sauce") {
      for (let i = 0; i < 5; i++) {
        const sc = st.sauceApplied ? GameData.wingSauces.find((s) => s.id === st.sauceApplied).color : null;
        Draw.wingPiece(ctx, w / 2 - 70 + (i % 3) * 60, cy + 20 + Math.floor(i / 3) * 45, 60, sc);
      }
      layout.sauceButtons = [];
      let bx = w / 2 - 155;
      GameData.wingSauces.forEach((s, i) => {
        const x = bx + i * 105, y = cy + 130;
        Draw.button(ctx, x, y, 98, 40, s.name, { fill: st.sauceApplied === s.id ? "#57c94b" : "#3a3444" });
        layout.sauceButtons.push({ x, y, w: 98, h: 40, id: s.id });
      });
      layout.next = { x: w / 2 - 90, y: cy + 180, w: 180, h: 44 };
      Draw.button(ctx, layout.next.x, layout.next.y, layout.next.w, layout.next.h, "Plate Wings", { fill: "#d83131" });
    } else if (st.phase === "plate") {
      for (let i = 0; i < 5; i++) {
        const sc = GameData.wingSauces.find((s) => s.id === st.sauceApplied)?.color;
        Draw.wingPiece(ctx, w / 2 - 70 + (i % 3) * 60, cy + 30 + Math.floor(i / 3) * 40, 60, sc);
      }
      const sb = StationCommon.drawSendButton(ctx, w, h, true);
      layout.send = sb;
    }
    const tr = StationCommon.drawTrash(ctx, w, h);
    layout.trash = tr;
  }

  function reset() {
    st.phase = "fry"; st.frying = false; st.progress = 0; st.pulled = false;
    st.resultZone = null; st.sauceApplied = null; st.plated = false;
  }

  function onPointerDown(x, y) {
    if (layout.trash && Draw.hit(x, y, layout.trash.x, layout.trash.y, layout.trash.w, layout.trash.h)) { reset(); AudioEngine.play("pop"); return; }
    if (st.phase === "fry") {
      if (layout.drop && Draw.hit(x, y, layout.drop.x, layout.drop.y, layout.drop.w, layout.drop.h)) drop();
      else if (layout.pull && Draw.hit(x, y, layout.pull.x, layout.pull.y, layout.pull.w, layout.pull.h)) pull();
    } else if (st.phase === "sauce") {
      (layout.sauceButtons || []).forEach((b) => {
        if (Draw.hit(x, y, b.x, b.y, b.w, b.h)) { st.sauceApplied = b.id; AudioEngine.play("tap"); }
      });
      if (layout.next && Draw.hit(x, y, layout.next.x, layout.next.y, layout.next.w, layout.next.h)) { st.phase = "plate"; AudioEngine.play("whoosh"); }
    } else if (st.phase === "plate") {
      if (layout.send && Draw.hit(x, y, layout.send.x, layout.send.y, layout.send.w, layout.send.h)) {
        AudioEngine.play("success");
        api.onComplete(computeScore());
      }
    }
  }

  return { update, draw, onPointerDown, key: "wings" };
}
