// ============================================================
// Quazzy's Foodaria — Pizza Station
// ============================================================
"use strict";

function createPizzaStation(api) {
  const { spec } = api; // {toppings:[], extraCheese}
  const st = {
    stage: "raw", // raw -> sauce -> cheese -> topped -> baking -> baked -> sliced
    baking: false,
    bakeProgress: 0,
    pulled: false,
    bakeResult: null,
    toppingsAdded: [],
    sliced: false
  };
  const layout = {};
  const zones = [
    { id: "under", from: 0, to: 0.55, color: "#eddcb0" },
    { id: "perfect", from: 0.55, to: 0.8, color: "#f2c14e" },
    { id: "burnt", from: 0.8, to: 1, color: "#2a1a0a" }
  ];
  function zoneAt(p) { return zones.find((z) => p >= z.from && p < z.to) || zones[zones.length - 1]; }

  function update(dt) {
    if (st.baking && !st.pulled) {
      st.bakeProgress += dt / 8;
      if (st.bakeProgress > 1.05) st.bakeProgress = 1.05;
    }
  }

  function computeScore() {
    const req = spec.toppings || [];
    const matched = req.filter((t) => st.toppingsAdded.includes(t)).length;
    const extra = st.toppingsAdded.filter((t) => !req.includes(t)).length;
    const toppingScore = req.length ? Math.max(0, matched / req.length - extra * 0.15) : 1;
    const bakeScore = st.bakeResult === "perfect" ? 1 : st.bakeResult === "under" ? 0.5 : 0.25;
    return StationCommon.clamp(toppingScore * 0.55 + bakeScore * 0.35 + (st.sliced ? 0.1 : 0), 0, 1);
  }

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const bgGrd = ctx.createLinearGradient(0, 0, 0, h);
    bgGrd.addColorStop(0, "#3a2a20"); bgGrd.addColorStop(1, "#221812");
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, w, h);

    StationCommon.drawHeader(ctx, w, "🍕 Pizza Station", [
      `Toppings: ${(spec.toppings || []).map((t) => GameData.pizzaToppings.find((x) => x.id === t)?.name).join(", ") || "Cheese only"}`,
      spec.extraCheese ? "Extra Cheese requested" : ""
    ]);
    const stepIdx = { raw: 0, sauce: 1, cheese: 2, topped: 3, baking: 4, baked: 4, sliced: 5 }[st.stage];
    StationCommon.drawStepDots(ctx, w, Math.min(stepIdx, 5), 6);

    const cy = StationCommon.HEADER_H + 110;
    const cx = w / 2;
    const r = 100;
    Draw.pizzaBase(ctx, cx, cy, r,
      st.stage === "baking" || st.stage === "baked" || st.stage === "sliced"
        ? (st.bakeResult || "topped")
        : st.stage,
      st.toppingsAdded);

    if (st.stage === "sliced") {
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
    }

    const btnY = cy + r + 40;
    if (st.stage === "raw") {
      layout.action = { x: cx - 100, y: btnY, w: 200, h: 48 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Spread Sauce");
    } else if (st.stage === "sauce") {
      layout.action = { x: cx - 100, y: btnY, w: 200, h: 48 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Add Cheese");
    } else if (st.stage === "cheese") {
      layout.toppingButtons = [];
      GameData.pizzaToppings.forEach((t, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = cx - 155 + col * 105, y = btnY - 44 + row * 42;
        const active = st.toppingsAdded.includes(t.id);
        const required = (spec.toppings || []).includes(t.id);
        Draw.button(ctx, x, y, 98, 36, t.name, {
          fill: active ? "#57c94b" : required ? "#3a3444" : "#2a2530",
          stroke: required ? "#f2b60d" : "#171420",
          font: "12px Nunito, sans-serif"
        });
        layout.toppingButtons.push({ x, y, w: 98, h: 36, id: t.id });
      });
      layout.action = { x: cx - 100, y: btnY + 50, w: 200, h: 44 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Ready to Bake", { fill: "#4a90d9" });
    } else if (st.stage === "topped") {
      if (!st.baking) {
        layout.action = { x: cx - 100, y: btnY, w: 200, h: 48 };
        Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Put in Oven", { fill: "#d83131" });
      }
    } else if (st.stage === "baking") {
      const barY = btnY;
      StationCommon.zoneBar(ctx, cx - 160, barY, 320, 22, zones);
      Draw.needle(ctx, cx - 160, barY, 320, 22, st.bakeProgress);
      if (!st.pulled) {
        layout.action = { x: cx - 100, y: barY + 34, w: 200, h: 46 };
        Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Pull From Oven", { fill: "#f2b60d", stroke: "#a97906", text: "#241a05" });
      }
    } else if (st.stage === "baked") {
      layout.action = { x: cx - 100, y: btnY, w: 200, h: 48 };
      Draw.button(ctx, layout.action.x, layout.action.y, layout.action.w, layout.action.h, "Slice Pizza", { fill: "#4a90d9" });
    } else if (st.stage === "sliced") {
      const sb = StationCommon.drawSendButton(ctx, w, h, true);
      layout.send = sb;
    }
    const tr = StationCommon.drawTrash(ctx, w, h);
    layout.trash = tr;
  }

  function reset() {
    st.stage = "raw"; st.baking = false; st.bakeProgress = 0; st.pulled = false;
    st.bakeResult = null; st.toppingsAdded = []; st.sliced = false;
  }

  function onPointerDown(x, y) {
    if (layout.trash && Draw.hit(x, y, layout.trash.x, layout.trash.y, layout.trash.w, layout.trash.h)) { reset(); AudioEngine.play("pop"); return; }

    if (st.stage === "raw" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.stage = "sauce"; AudioEngine.play("tap");
    } else if (st.stage === "sauce" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.stage = "cheese"; AudioEngine.play("tap");
    } else if (st.stage === "cheese") {
      (layout.toppingButtons || []).forEach((b) => {
        if (Draw.hit(x, y, b.x, b.y, b.w, b.h)) {
          const i = st.toppingsAdded.indexOf(b.id);
          if (i >= 0) st.toppingsAdded.splice(i, 1); else st.toppingsAdded.push(b.id);
          AudioEngine.play("tap");
        }
      });
      if (layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
        st.stage = "topped"; AudioEngine.play("whoosh");
      }
    } else if (st.stage === "topped" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.stage = "baking"; st.baking = true; st.bakeProgress = 0; AudioEngine.play("sizzle");
    } else if (st.stage === "baking" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.pulled = true; st.baking = false;
      st.bakeResult = zoneAt(StationCommon.clamp(st.bakeProgress, 0, 0.999)).id;
      AudioEngine.play(st.bakeResult === "burnt" ? "burnt" : "ding");
      setTimeout(() => { st.stage = "baked"; }, 250);
    } else if (st.stage === "baked" && layout.action && Draw.hit(x, y, layout.action.x, layout.action.y, layout.action.w, layout.action.h)) {
      st.sliced = true; st.stage = "sliced"; AudioEngine.play("whoosh");
    } else if (st.stage === "sliced" && layout.send && Draw.hit(x, y, layout.send.x, layout.send.y, layout.send.w, layout.send.h)) {
      AudioEngine.play("success");
      api.onComplete(computeScore());
    }
  }

  return { update, draw, onPointerDown, key: "pizza" };
}
