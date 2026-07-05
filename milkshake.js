// ============================================================
// Quazzy's Foodaria — Milkshake Station
// ============================================================
"use strict";

function createMilkshakeStation(api) {
  const { spec } = api; // {flavor, whip, topping}
  const st = {
    stage: "cup", // cup -> flavor -> blend -> topping -> done
    flavorChosen: null,
    blending: false,
    blendTaps: 0,
    blendDone: false,
    whipAdded: false,
    toppingAdded: null
  };
  const NEEDED_TAPS = 8;
  const layout = {};

  function computeScore() {
    const flavorOk = st.flavorChosen === spec.flavor;
    const whipOk = !!spec.whip === !!st.whipAdded;
    const toppingOk = (spec.topping || null) === (st.toppingAdded || null);
    const blendScore = st.blendDone ? 1 : 0.4;
    return StationCommon.clamp(
      (flavorOk ? 0.4 : 0.05) + blendScore * 0.25 + (whipOk ? 0.2 : 0.05) + (toppingOk ? 0.15 : 0.05),
      0, 1
    );
  }

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const bgGrd = ctx.createLinearGradient(0, 0, 0, h);
    bgGrd.addColorStop(0, "#2a2438"); bgGrd.addColorStop(1, "#1a1622");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, w, h);

    const flavorDef = GameData.shakeFlavors.find((f) => f.id === spec.flavor);
    StationCommon.drawHeader(ctx, w, "🥤 Milkshake Station", [
      `Flavor: ${flavorDef ? flavorDef.name : "?"}`,
      `Whip: ${spec.whip ? "Yes" : "No"} · Topping: ${spec.topping ? GameData.shakeToppings.find((t) => t.id === spec.topping)?.name : "None"}`
    ]);
    const stepIdx = { cup: 0, flavor: 1, blend: 2, topping: 3, done: 4 }[st.stage];
    StationCommon.drawStepDots(ctx, w, stepIdx, 5);

    const cy = StationCommon.HEADER_H + 20;
    const cx = w / 2;

    if (st.stage === "cup") {
      Draw.cup(ctx, cx, cy + 10, 160, null);
      layout.action = { x: cx - 100, y: cy + 190, w: 200, h: 48 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Grab Cup");
    } else if (st.stage === "flavor") {
      Draw.cup(ctx, cx, cy + 10, 160, st.flavorChosen ? GameData.shakeFlavors.find((f) => f.id === st.flavorChosen).color : "#ddd");
      layout.flavorButtons = [];
      let fx = cx - 210;
      GameData.shakeFlavors.forEach((f, i) => {
        const x = fx + i * 108, y = cy + 200;
        Draw.button(ctx, x, y, 100, 40, f.name, { fill: st.flavorChosen === f.id ? "#57c94b" : "#3a3444", font: "12px Nunito, sans-serif" });
        layout.flavorButtons.push({ x, y, w: 100, h: 40, id: f.id });
      });
    } else if (st.stage === "blend") {
      // blender graphic
      Draw.rr(ctx, cx - 60, cy + 20, 120, 140, 10);
      ctx.fillStyle = "#2a2a30"; ctx.fill();
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3; ctx.stroke();
      const fillH = 110 * StationCommon.clamp(st.blendTaps / NEEDED_TAPS, 0, 1);
      ctx.fillStyle = GameData.shakeFlavors.find((f) => f.id === st.flavorChosen)?.color || "#ddd";
      ctx.fillRect(cx - 52, cy + 150 - fillH, 104, fillH);
      StationCommon.timerBar(ctx, cx - 130, cy + 175, 260, 20, st.blendTaps / NEEDED_TAPS, "#4a90d9");
      layout.action = { x: cx - 100, y: cy + 205, w: 200, h: 48 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, st.blendDone ? "Blended!" : "Tap to Blend!", { fill: st.blendDone ? "#57c94b" : "#d83131" });
    } else if (st.stage === "topping") {
      Draw.cup(ctx, cx, cy + 10, 160, GameData.shakeFlavors.find((f) => f.id === st.flavorChosen)?.color, st.whipAdded, st.toppingAdded);
      layout.whip = { x: cx - 155, y: cy + 195, w: 140, h: 42 };
      Draw.button(ctx, layout.whip.x, layout.whip.y, layout.whip.w, layout.whip.h, st.whipAdded ? "Whip ✓" : "Add Whip", { fill: st.whipAdded ? "#57c94b" : "#3a3444", font: "13px Nunito, sans-serif" });
      layout.toppingButtons = [];
      let tx = cx + 15;
      GameData.shakeToppings.forEach((t, i) => {
        const x = tx + i * 78, y = cy + 195 + 46;
        Draw.button(ctx, x, y - 46, 72, 42, t.name.split(" ")[0], { fill: st.toppingAdded === t.id ? "#57c94b" : "#3a3444", font: "12px Nunito, sans-serif" });
        layout.toppingButtons.push({ x, y: y - 46, w: 72, h: 42, id: t.id });
      });
      layout.action = { x: cx - 100, y: cy + 250, w: 200, h: 44 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Finish Shake", { fill: "#4a90d9" });
    } else if (st.stage === "done") {
      Draw.cup(ctx, cx, cy + 10, 160, GameData.shakeFlavors.find((f) => f.id === st.flavorChosen)?.color, st.whipAdded, st.toppingAdded);
      const sb = StationCommon.drawSendButton(ctx, w, h, true);
      layout.send = sb;
    }
    const tr = StationCommon.drawTrash(ctx, w, h);
    layout.trash = tr;
  }

  function update(dt) {}

  function reset() {
    st.stage = "cup"; st.flavorChosen = null; st.blending = false; st.blendTaps = 0;
    st.blendDone = false; st.whipAdded = false; st.toppingAdded = null;
  }

  function onPointerDown(x, y) {
    if (layout.trash && Draw.hit(x, y, layout.trash.x, layout.trash.y, layout.trash.w, layout.trash.h)) { reset(); AudioEngine.play("pop"); return; }

    if (st.stage === "cup" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.stage = "flavor"; AudioEngine.play("tap");
    } else if (st.stage === "flavor") {
      (layout.flavorButtons || []).forEach((b) => {
        if (Draw.hit(x, y, b.x, b.y, b.w, b.h)) { st.flavorChosen = b.id; AudioEngine.play("tap"); st.stage = "blend"; }
      });
    } else if (st.stage === "blend") {
      if (layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h) && !st.blendDone) {
        st.blendTaps++;
        AudioEngine.play("pop");
        if (st.blendTaps >= NEEDED_TAPS) { st.blendDone = true; AudioEngine.play("ding"); setTimeout(() => { st.stage = "topping"; }, 350); }
      }
    } else if (st.stage === "topping") {
      if (layout.whip && Draw.hit(x, y, layout.whip.x, layout.whip.y, layout.whip.w, layout.whip.h)) { st.whipAdded = !st.whipAdded; AudioEngine.play("tap"); }
      (layout.toppingButtons || []).forEach((b) => {
        if (Draw.hit(x, y, b.x, b.y, b.w, b.h)) { st.toppingAdded = st.toppingAdded === b.id ? null : b.id; AudioEngine.play("tap"); }
      });
      if (layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) { st.stage = "done"; AudioEngine.play("whoosh"); }
    } else if (st.stage === "done" && layout.send && Draw.hit(x, y, layout.send.x, layout.send.y, layout.send.w, layout.send.h)) {
      AudioEngine.play("success");
      api.onComplete(computeScore());
    }
  }

  return { update, draw, onPointerDown, key: "milkshake" };
}
