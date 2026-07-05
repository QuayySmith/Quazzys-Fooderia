// ============================================================
// Quazzy's Foodaria — Fries Station
// ============================================================
"use strict";

function createFriesStation(api) {
  const { spec } = api; // {seasoned, crispy}
  const perfectFrom = spec.crispy === "extra" ? 0.62 : 0.42;
  const perfectTo = spec.crispy === "extra" ? 0.82 : 0.62;
  const zones = [
    { id: "soggy", from: 0, to: perfectFrom, color: "#e8d9a0" },
    { id: "perfect", from: perfectFrom, to: perfectTo, color: "#f0b432" },
    { id: "burnt", from: perfectTo, to: 1, color: "#3a2410" }
  ];

  const st = { phase: "fry", frying: false, progress: 0, pulled: false, resultZone: null, seasoned: false, boxed: false };
  const layout = {};

  function zoneAt(p) { return zones.find((z) => p >= z.from && p < z.to) || zones[zones.length - 1]; }

  function drop() { st.frying = true; st.progress = 0; AudioEngine.play("sizzle"); }
  function pull() {
    st.pulled = true; st.frying = false;
    st.resultZone = zoneAt(StationCommon.clamp(st.progress, 0, 0.999)).id;
    AudioEngine.play(st.resultZone === "burnt" ? "burnt" : "ding");
    setTimeout(() => { st.phase = "season"; }, 250);
  }

  function update(dt) {
    if (st.frying && !st.pulled) {
      st.progress += dt / 7;
      if (st.progress > 1.05) st.progress = 1.05;
    }
  }

  function computeScore() {
    const crispScore = st.resultZone === "perfect" ? 1 : st.resultZone === "soggy" ? 0.5 : 0.3;
    const seasonOk = !!spec.seasoned === !!st.seasoned;
    return StationCommon.clamp(crispScore * 0.7 + (seasonOk ? 0.3 : 0.1), 0, 1);
  }

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const bgGrd = ctx.createLinearGradient(0, 0, 0, h);
    bgGrd.addColorStop(0, "#26313a"); bgGrd.addColorStop(1, "#1a222a");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, w, h);

    StationCommon.drawHeader(ctx, w, "🍟 Fry Maker", [
      `Crispy: ${spec.crispy === "extra" ? "Extra Crispy" : "Normal"}`,
      `Seasoning: ${spec.seasoned ? "Yes, please" : "None"}`
    ]);
    StationCommon.drawStepDots(ctx, w, st.phase === "fry" ? 0 : st.phase === "season" ? 1 : 2, 3);

    const cy = StationCommon.HEADER_H + 40;
    // fryer basket
    Draw.rr(ctx, w / 2 - 90, cy, 180, 120, 10);
    ctx.fillStyle = "#2a3038"; ctx.fill();
    ctx.strokeStyle = "#111417"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#4a90d9"; ctx.globalAlpha = 0.4;
    ctx.fillRect(w / 2 - 85, cy + 30, 170, 85);
    ctx.globalAlpha = 1;

    if (st.phase === "fry") {
      if (!st.frying && !st.pulled) {
        layout.drop = { x: w / 2 - 90, y: cy + 140, w: 180, h: 48 };
        Draw.button(ctx, layout.drop.x, layout.drop.y, layout.drop.w, layout.drop.h, "Drop Basket");
      } else {
        Draw.friesBox(ctx, w / 2, cy + 20, 100, true, st.pulled && st.resultZone === "burnt" ? "#4a3020" : "#d83131");
        const barY = cy + 150;
        StationCommon.zoneBar(ctx, w / 2 - 160, barY, 320, 22, zones);
        Draw.needle(ctx, w / 2 - 160, barY, 320, 22, st.progress);
        if (!st.pulled) {
          layout.pull = { x: w / 2 - 90, y: cy + 185, w: 180, h: 46 };
          Draw.button(ctx, layout.pull.x, layout.pull.y, layout.pull.w, layout.pull.h, "Pull Basket", { fill: "#f2b60d", stroke: "#a97906", text: "#241a05" });
        } else {
          ctx.fillStyle = "#57c94b"; ctx.font = "bold 18px Baloo2, sans-serif"; ctx.textAlign = "center";
          ctx.fillText("Moving to seasoning…", w / 2, cy + 200);
        }
      }
    } else if (st.phase === "season") {
      Draw.friesBox(ctx, w / 2, cy + 30, 120, true);
      if (st.seasoned) {
        ctx.fillStyle = "#e8e4de"; ctx.font = "13px Nunito, sans-serif"; ctx.textAlign = "center";
        for (let i = 0; i < 12; i++) {
          ctx.fillRect(w / 2 - 50 + Math.random() * 100, cy + Math.random() * 60, 2, 2);
        }
      }
      layout.season = { x: w / 2 - 90, y: cy + 150, w: 180, h: 46 };
      Draw.button(ctx, layout.season.x, layout.season.y, layout.season.w, layout.season.h, st.seasoned ? "Seasoned ✓" : "Add Seasoning", { fill: st.seasoned ? "#57c94b" : "#4a90d9" });
      layout.next = { x: w / 2 - 90, y: cy + 205, w: 180, h: 44 };
      Draw.button(ctx, layout.next.x, layout.next.y, layout.next.w, layout.next.h, "Box It Up", { fill: "#d83131" });
    } else if (st.phase === "box") {
      Draw.friesBox(ctx, w / 2, cy + 40, 130, true);
      const sb = StationCommon.drawSendButton(ctx, w, h, true);
      layout.send = sb;
    }
    const tr = StationCommon.drawTrash(ctx, w, h);
    layout.trash = tr;
  }

  function reset() {
    st.phase = "fry"; st.frying = false; st.progress = 0; st.pulled = false;
    st.resultZone = null; st.seasoned = false; st.boxed = false;
  }

  function onPointerDown(x, y) {
    if (layout.trash && Draw.hit(x, y, layout.trash.x, layout.trash.y, layout.trash.w, layout.trash.h)) { reset(); AudioEngine.play("pop"); return; }
    if (st.phase === "fry") {
      if (layout.drop && Draw.hit(x, y, layout.drop.x, layout.drop.y, layout.drop.w, layout.drop.h)) drop();
      else if (layout.pull && Draw.hit(x, y, layout.pull.x, layout.pull.y, layout.pull.w, layout.pull.h)) pull();
    } else if (st.phase === "season") {
      if (layout.season && Draw.hit(x, y, layout.season.x, layout.season.y, layout.season.w, layout.season.h)) { st.seasoned = !st.seasoned; AudioEngine.play("tap"); }
      else if (layout.next && Draw.hit(x, y, layout.next.x, layout.next.y, layout.next.w, layout.next.h)) { st.phase = "box"; AudioEngine.play("whoosh"); }
    } else if (st.phase === "box") {
      if (layout.send && Draw.hit(x, y, layout.send.x, layout.send.y, layout.send.w, layout.send.h)) {
        AudioEngine.play("success");
        api.onComplete(computeScore());
      }
    }
  }

  return { update, draw, onPointerDown, key: "fries" };
}
