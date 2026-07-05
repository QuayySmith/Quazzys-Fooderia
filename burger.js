// ============================================================
// Quazzy's Foodaria — Burger Station
// ============================================================
"use strict";

function createBurgerStation(api) {
  const { spec } = api; // {doneness, toppings:[], cheese}
  const zones = [
    { id: "rare", from: 0.0, to: 0.14, color: "#c96b5a" },
    { id: "medRare", from: 0.14, to: 0.28, color: "#b5583f" },
    { id: "medium", from: 0.28, to: 0.48, color: "#8f4a2f" },
    { id: "well", from: 0.48, to: 0.66, color: "#6b3a24" },
    { id: "wellDone", from: 0.66, to: 0.84, color: "#4a2a18" },
    { id: "burnt", from: 0.84, to: 1.0, color: "#241410" }
  ];

  const st = {
    phase: "grill", // grill -> build -> wrap -> done
    cookProgress: 0,
    cooking: false,
    takenOff: false,
    flipped: false,
    finalDoneness: null,
    cheeseAdded: false,
    toppingsAdded: [],
    wrapped: false,
    scoreShown: false
  };

  function zoneAt(p) {
    return zones.find((z) => p >= z.from && p < z.to) || zones[zones.length - 1];
  }

  function startPatty() {
    st.cooking = true;
    st.cookProgress = 0;
    AudioEngine.play("sizzle");
  }

  function takeOff() {
    st.takenOff = true;
    st.cooking = false;
    st.finalDoneness = zoneAt(StationCommon.clamp(st.cookProgress, 0, 0.999)).id;
    AudioEngine.play(st.finalDoneness === "burnt" ? "burnt" : "ding");
    setTimeout(() => { st.phase = "build"; }, 300);
  }

  function update(dt) {
    if (st.cooking && !st.takenOff) {
      st.cookProgress += dt / 9; // ~9s to fully burn
      if (st.cookProgress > 1.05) st.cookProgress = 1.05;
    }
  }

  function requiredToppingSet() { return spec.toppings || []; }

  function toggleTopping(id) {
    const i = st.toppingsAdded.indexOf(id);
    if (i >= 0) st.toppingsAdded.splice(i, 1);
    else st.toppingsAdded.push(id);
    AudioEngine.play("tap");
  }

  function computeScore() {
    const targetIdx = GameData.doneness.indexOf(spec.doneness);
    const actualIdx = GameData.doneness.indexOf(st.finalDoneness);
    const doneScore = Math.max(0, 1 - Math.abs(targetIdx - actualIdx) * 0.28);
    const req = requiredToppingSet();
    const matched = req.filter((t) => st.toppingsAdded.includes(t)).length;
    const extra = st.toppingsAdded.filter((t) => !req.includes(t)).length;
    const toppingScore = req.length
      ? Math.max(0, matched / req.length - extra * 0.15)
      : (extra === 0 ? 1 : 0.6);
    const cheeseOk = !!spec.cheese === !!st.cheeseAdded;
    const cheeseScore = cheeseOk ? 1 : 0.5;
    return StationCommon.clamp(doneScore * 0.45 + toppingScore * 0.4 + cheeseScore * 0.15, 0, 1);
  }

  const layout = {};

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const bgGrd = ctx.createLinearGradient(0, 0, 0, h);
    bgGrd.addColorStop(0, "#2a2432");
    bgGrd.addColorStop(1, "#1c1722");
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, w, h);

    const lines = [
      `${GameData.donenessLabel[spec.doneness]} · ${spec.cheese ? "Cheese" : "No Cheese"}`,
      `Toppings: ${(spec.toppings || []).map((t) => GameData.toppings.find((x) => x.id === t)?.name).join(", ") || "None"}`
    ];
    StationCommon.drawHeader(ctx, w, "🍔 Burger Maker", lines);
    StationCommon.drawStepDots(ctx, w, st.phase === "grill" ? 0 : st.phase === "build" ? 1 : 2, 3);

    const cy = StationCommon.HEADER_H + 40;

    if (st.phase === "grill") {
      // grill grate
      Draw.rr(ctx, w / 2 - 160, cy, 320, 150, 12);
      ctx.fillStyle = "#3a3038";
      ctx.fill();
      ctx.strokeStyle = "#171217";
      ctx.lineWidth = 3;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 - 150, cy + 15 + i * 22);
        ctx.lineTo(w / 2 + 150, cy + 15 + i * 22);
        ctx.strokeStyle = "#221a20";
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      if (!st.cooking && !st.takenOff) {
        layout.addPatty = { x: w / 2 - 90, y: cy + 170, w: 180, h: 50 };
        Draw.button(ctx, layout.addPatty.x, layout.addPatty.y, layout.addPatty.w, layout.addPatty.h, "Place Patty");
      } else {
        Draw.patty(ctx, w / 2, cy + 55, 190, st.takenOff ? st.finalDoneness : zoneAt(Math.min(st.cookProgress, 0.999)).id);
        // doneness meter
        const barY = cy + 170;
        StationCommon.zoneBar(ctx, w / 2 - 160, barY, 320, 22, zones);
        Draw.needle(ctx, w / 2 - 160, barY, 320, 22, st.cookProgress);
        ctx.fillStyle = "#e8e4de";
        ctx.font = "13px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Target: " + GameData.donenessLabel[spec.doneness], w / 2, barY + 40);

        if (!st.takenOff) {
          layout.takeOff = { x: w / 2 - 90, y: cy + 205, w: 180, h: 46 };
          Draw.button(ctx, layout.takeOff.x, layout.takeOff.y, layout.takeOff.w, layout.takeOff.h, "Take Off Grill", { fill: "#f2b60d", stroke: "#a97906", text: "#241a05" });
        } else {
          ctx.fillStyle = "#57c94b";
          ctx.font = "bold 18px Baloo2, sans-serif";
          ctx.fillText("Moving to build station…", w / 2, cy + 220);
        }
      }
    } else if (st.phase === "build") {
      // stack visual
      const stackX = w / 2 - 140, stackY = cy + 190;
      let yy = stackY;
      Draw.bunBottom(ctx, stackX, yy, 150); yy -= 6;
      if (st.finalDoneness) { Draw.patty(ctx, stackX, yy - 30, 150, st.finalDoneness); yy -= 34; }
      if (st.cheeseAdded) { Draw.toppingLayer(ctx, stackX, yy - 14, 150, "cheese"); yy -= 16; }
      st.toppingsAdded.forEach((t) => { Draw.toppingLayer(ctx, stackX, yy - 14, 150, t); yy -= 14; });
      if (st.wrapped) {
        ctx.fillStyle = "rgba(240,220,180,0.85)";
        Draw.rr(ctx, stackX - 90, stackY - 220, 180, 240, 10);
        ctx.fill();
      } else {
        Draw.bunTop(ctx, stackX, yy);
      }

      // topping tray on the right
      const trayX = w / 2 + 40;
      let tx = trayX, ty = cy + 10;
      layout.toppingButtons = [];
      const allT = [{ id: "cheese", name: "Cheese", isCheese: true }, ...GameData.toppings];
      allT.forEach((t, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const bx = trayX + col * 105, by = ty + row * 40;
        const active = t.isCheese ? st.cheeseAdded : st.toppingsAdded.includes(t.id);
        const required = t.isCheese ? !!spec.cheese : requiredToppingSet().includes(t.id);
        Draw.button(ctx, bx, by, 98, 34, t.name, {
          fill: active ? "#57c94b" : required ? "#3a3444" : "#2a2530",
          stroke: required ? "#f2b60d" : "#171420",
          text: "#fff",
          font: "12px Nunito, sans-serif"
        });
        layout.toppingButtons.push({ x: bx, y: by, w: 98, h: 34, id: t.id, isCheese: !!t.isCheese });
      });

      const btnY = cy + 10 + Math.ceil(allT.length / 2) * 40 + 14;
      layout.addTopBun = { x: trayX, y: btnY, w: 206, h: 44 };
      Draw.button(ctx, layout.addTopBun.x, layout.addTopBun.y, layout.addTopBun.w, layout.addTopBun.h, "Add Top Bun & Wrap", { fill: "#4a90d9", stroke: "#22588f" });
    }

    if (st.phase === "wrap" || st.wrapped) {
      const sb = StationCommon.drawSendButton(ctx, w, h, true);
      layout.send = sb;
    }
    const tr = StationCommon.drawTrash(ctx, w, h);
    layout.trash = tr;
  }

  function reset() {
    st.phase = "grill";
    st.cookProgress = 0; st.cooking = false; st.takenOff = false;
    st.finalDoneness = null; st.cheeseAdded = false; st.toppingsAdded = [];
    st.wrapped = false;
  }

  function onPointerDown(x, y) {
    if (layout.trash && Draw.hit(x, y, layout.trash.x, layout.trash.y, layout.trash.w, layout.trash.h)) {
      reset(); AudioEngine.play("pop"); return;
    }
    if (st.phase === "grill") {
      if (layout.addPatty && Draw.hit(x, y, layout.addPatty.x, layout.addPatty.y, layout.addPatty.w, layout.addPatty.h)) {
        startPatty();
      } else if (layout.takeOff && Draw.hit(x, y, layout.takeOff.x, layout.takeOff.y, layout.takeOff.w, layout.takeOff.h)) {
        takeOff();
      }
    } else if (st.phase === "build") {
      (layout.toppingButtons || []).forEach((b) => {
        if (Draw.hit(x, y, b.x, b.y, b.w, b.h)) {
          if (b.isCheese) { st.cheeseAdded = !st.cheeseAdded; AudioEngine.play("tap"); }
          else toggleTopping(b.id);
        }
      });
      if (layout.addTopBun && Draw.hit(x, y, layout.addTopBun.x, layout.addTopBun.y, layout.addTopBun.w, layout.addTopBun.h)) {
        st.wrapped = true;
        st.phase = "wrap";
        AudioEngine.play("whoosh");
      }
    } else if (st.phase === "wrap") {
      if (layout.send && Draw.hit(x, y, layout.send.x, layout.send.y, layout.send.w, layout.send.h)) {
        const score = computeScore();
        AudioEngine.play("success");
        api.onComplete(score);
      }
    }
  }

  return { update, draw, onPointerDown, key: "burger" };
}
