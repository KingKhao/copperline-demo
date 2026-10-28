/* Relay Plumbing & Electric — demo by Clinch Valley Digital.
   Everything here is a front-end mock: nothing is stored, nothing is sent. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PHONE = "(423) 555-0192";
  window.__cl = true;

  /* ---------- time in Rogersville (Eastern) ---------- */
  function etNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false })
      .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  }
  function fmtTime(d, ampm) {
    var h = d.getHours(), m = d.getMinutes();
    var s = ((h + 11) % 12 + 1) + (m ? ":" + String(m).padStart(2, "0") : "");
    return ampm ? s + (h < 12 ? " AM" : " PM") : s;
  }
  function hoursFor(day) { // [open, close] in hours, or null
    if (day === 0) return null;
    if (day === 6) return [8, 14];
    return [7, 18];
  }
  function dayWord(d, now) {
    var a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var diff = Math.round((b - a) / 864e5);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }
  // Upcoming 90-minute arrival windows during open hours.
  function windows(count) {
    var now = etNow(), out = [];
    var t = new Date(now.getTime() + 75 * 60000);
    t.setSeconds(0, 0);
    t.setMinutes(t.getMinutes() <= 30 ? 30 : 60);
    var guard = 0;
    while (out.length < count && guard++ < 400) {
      var h = hoursFor(t.getDay());
      var startH = t.getHours() + t.getMinutes() / 60;
      if (h && startH >= h[0] && startH + 1.5 <= h[1]) {
        var end = new Date(t.getTime() + 90 * 60000);
        out.push({ start: new Date(t), label: fmtTime(t) + "–" + fmtTime(end, true), day: dayWord(t, now) });
        t = new Date(t.getTime() + 120 * 60000);
      } else if (h && startH < h[0]) {
        t.setHours(h[0], 0);
      } else {
        t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 0, 0);
      }
    }
    return out;
  }
  function isOpen() {
    var n = etNow(), h = hoursFor(n.getDay()), x = n.getHours() + n.getMinutes() / 60;
    return !!(h && x >= h[0] && x < h[1]);
  }

  function fmtTimeFull(d) {
    var h = d.getHours();
    return ((h + 11) % 12 + 1) + ":" + String(d.getMinutes()).padStart(2, "0") + (h < 12 ? " AM" : " PM");
  }
  function tickClock() {
    var n = etNow();
    $$("[data-clock]").forEach(function (el) { el.textContent = fmtTimeFull(n); });
    var open = isOpen();
    var o = $("[data-opennow]");
    if (o) o.textContent = open ? "Office open now. Call or book." : "Office closed now. The emergency line still answers.";
    var s = $("[data-opennow-short]");
    if (s) s.textContent = open ? "Office open" : "Emergency line only";
    var today = n.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    $$("[data-today]").forEach(function (el) { el.textContent = today; });
  }
  tickClock();
  setInterval(tickClock, 20000);

  /* ---------- dispatch board (demo data) ---------- */
  var TOWNS = {
    "Rogersville": [300, 180], "Mooresburg": [120, 120], "Bulls Gap": [170, 285], "Surgoinsville": [470, 110],
    "Church Hill": [520, 230], "Persia": [380, 300], "Eidson": [250, 50]
  };
  var JOBS = {
    Plumbing: [["Water heater swap", "Church Hill"], ["Leak under sink", "Surgoinsville"], ["Main line clog", "Mooresburg"], ["Toilet reset", "Rogersville"], ["Burst pipe", "Persia"], ["Shut-off valve", "Eidson"]],
    Electrical: [["Breaker tripping", "Bulls Gap"], ["Dead outlets", "Rogersville"], ["Ceiling fan install", "Church Hill"], ["Panel inspection", "Surgoinsville"], ["No power, 2 rooms", "Persia"], ["GFCI replacement", "Mooresburg"]]
  };
  var LABEL = { job: "On a job", route: "En route", soon: "Arriving soon", free: "Available" };
  var trucks = [
    { n: 1, tech: "Dale", trade: "Plumbing", status: "job", job: "Water heater swap", town: "Church Hill", from: "Rogersville", left: 55, j: 0 },
    { n: 2, tech: "Rosa", trade: "Electrical", status: "free", job: "Finished: GFCI replacement", town: "Rogersville", from: "Rogersville", left: 0, j: 0 },
    { n: 3, tech: "Marcus", trade: "Plumbing", status: "route", job: "Leak under sink", town: "Surgoinsville", from: "Rogersville", left: 70, j: 1 },
    { n: 4, tech: "Jen", trade: "Electrical", status: "soon", job: "Breaker tripping", town: "Bulls Gap", from: "Rogersville", left: 60, j: 0 }
  ];
  var rowsEl = $("[data-rows]"), teaserEl = $("[data-teaser]"), trucksEl = $("[data-trucks]");
  var lastUpdate = Date.now();

  function nextFree(t) {
    var n = etNow();
    if (t.status === "free") return "Now";
    return "~" + fmtTimeFull(new Date(n.getTime() + t.left * 60000)).replace(":00 ", " ");
  }
  function truckPos(t) {
    var a = TOWNS[t.from] || TOWNS.Rogersville, b = TOWNS[t.town] || TOWNS.Rogersville;
    var k = t.status === "route" ? 0.5 : t.status === "soon" ? 0.85 : 1;
    if (t.status === "free") k = 1;
    var off = (t.n - 2.5) * 9; // keep trucks at the same town from stacking exactly
    return [a[0] + (b[0] - a[0]) * k + off, a[1] + (b[1] - a[1]) * k - 22 - Math.abs(off) / 2];
  }

  function renderBoard(flashN) {
    if (rowsEl) {
      rowsEl.innerHTML = trucks.map(function (t) {
        var pct = t.status === "job" ? Math.max(10, 100 - t.left) : t.status === "soon" ? 92 : t.status === "route" ? 55 : 100;
        return '<tr class="' + (t.n === flashN ? "flash" : "") + '"><td>' + t.n + '</td>' +
          '<td><span class="tech">' + t.tech + "<small>" + t.trade + "</small></span></td>" +
          '<td><span class="status-cell"><span class="status"><i class="dot s-' + t.status + (t.status === "soon" ? " pulse" : "") + '"></i>' + LABEL[t.status] + '</span><span class="status bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span></span></td>' +
          '<td class="hide-s">' + t.job + (t.status === "free" ? "" : ", " + t.town) + "</td>" +
          "<td>" + nextFree(t) + "</td></tr>";
      }).join("");
    }
    if (teaserEl) {
      teaserEl.innerHTML = trucks.map(function (t) {
        return '<li class="' + (t.n === flashN ? "flash" : "") + '"><i class="dot s-' + t.status + (t.status === "soon" ? " pulse" : "") + '"></i>Truck ' + t.n + ", " + t.tech + '<span class="st">' + LABEL[t.status] + "</span></li>";
      }).join("");
    }
    if (trucksEl) {
      if (!trucksEl.children.length) {
        trucksEl.innerHTML = trucks.map(function (t) {
          return '<g class="truck" data-truck="' + t.n + '"><rect x="-17" y="-13" width="34" height="26" rx="5"/><text y="5">' + t.n + "</text></g>";
        }).join("");
      }
      trucks.forEach(function (t) {
        var g = trucksEl.querySelector('[data-truck="' + t.n + '"]'), p = truckPos(t);
        g.setAttribute("class", "truck " + t.status);
        g.style.transform = "translate(" + p[0] + "px," + p[1] + "px)";
      });
    }
    // next window + who
    var w = windows(1)[0];
    var free = trucks.filter(function (t) { return t.status === "free"; })[0] || trucks.slice().sort(function (a, b) { return a.left - b.left; })[0];
    $$("[data-next-window]").forEach(function (el) { el.textContent = w ? w.label + " " + w.day : "Call for a window"; });
    var nt = $("[data-next-tech]");
    if (nt) nt.textContent = free.tech + ", Truck " + free.n + ", " + free.trade.toLowerCase();
  }

  function advance(t) {
    if (t.status === "job") {
      t.left -= 30;
      if (t.left <= 0) { t.status = "free"; t.left = 0; t.job = "Finished: " + t.job; }
    } else if (t.status === "free") {
      var pool = JOBS[t.trade]; t.j = (t.j + 1) % pool.length;
      t.from = t.town; t.job = pool[t.j][0]; t.town = pool[t.j][1];
      if (t.town === t.from) { t.j = (t.j + 1) % pool.length; t.job = pool[t.j][0]; t.town = pool[t.j][1]; }
      t.status = "route"; t.left = 85;
    } else if (t.status === "route") {
      t.status = "soon"; t.left = 70;
    } else {
      t.status = "job"; t.left = 60;
    }
  }

  var turn = 0;
  renderBoard();
  if (!reduced) {
    setInterval(function () {
      var t = trucks[turn % trucks.length]; turn++;
      advance(t); lastUpdate = Date.now();
      renderBoard(t.n);
      setTimeout(function () { $$(".flash").forEach(function (el) { el.classList.remove("flash"); }); }, 1400);
    }, 4200);
  }
  setInterval(function () {
    var s = Math.round((Date.now() - lastUpdate) / 1000);
    var el = $("[data-updated]");
    if (el) el.textContent = s < 3 ? "Updated just now" : "Updated " + s + " seconds ago";
  }, 1000);

  /* ---------- triage ---------- */
  var SHUTOFF = "Turn off the main water shut-off. It's usually where the line comes into the house: a basement or crawlspace wall facing the street, or a utility closet near the water heater. Turn a round handle clockwise, or a lever so it sits across the pipe.";
  var TRIAGE = {
    burst: {
      name: "Burst or leaking pipe", trade: "plumbing", problem: "Leak or burst pipe",
      qs: [
        { q: "Is water spraying or pooling right now?", a: [["Yes, it's spraying or spreading", 2], ["It's a slow drip", 0]] },
        { q: "Is the water near outlets, cords or the electrical panel?", a: [["Yes, or I'm not sure", 2], ["No, it's away from anything electrical", 0]] }
      ],
      result: function (a) {
        var steps = [SHUTOFF];
        if (a[1] === 2) steps.unshift("Stay out of standing water. If you can reach the panel without stepping in water, switch off the breaker for that area. If not, don't touch it.");
        steps.push("Open the lowest faucet in the house to drain the lines, and move anything you care about out of the way.");
        if (a[0] === 2 || a[1] === 2) return { level: "now", why: "Running water does more damage every minute, and water near electricity is dangerous. This is what the emergency line is for.", steps: steps };
        return { level: "today", why: "A slow drip can wait a few hours, but not a few days: it's rotting whatever is under it. Put a bucket under it and book a window today.", steps: ["Put a bucket or towel under the drip.", "If it speeds up, " + SHUTOFF.charAt(0).toLowerCase() + SHUTOFF.slice(1)] };
      }
    },
    clog: {
      name: "Clogged drain", trade: "plumbing", problem: "Clogged drain",
      qs: [
        { q: "Is it one drain, or several at once?", a: [["Just one sink, tub or toilet", 0], ["Several drains are slow or backing up", 1]] },
        { q: "Is dirty water or sewage coming up anywhere?", a: [["Yes", 2], ["No", 0]] }
      ],
      result: function (a) {
        if (a[1] === 2) return { level: "now", why: "Sewage coming up means the main line is blocked. Everything you run, from the washer to a shower, ends up on your floor.", steps: ["Stop running water anywhere in the house: no flushing, showers, dishwasher or laundry.", "Keep kids and pets away from the backed-up water.", "Don't pour chemical drain cleaner in. It won't clear a main line and it burns whoever opens the pipe."] };
        if (a[0] === 1) return { level: "today", why: "Several slow drains together usually means the main line, not one trap. Better to clear it before it backs up.", steps: ["Go easy on water until we've been out.", "Skip chemical drain cleaner.", "If you know where the outdoor cleanout cap is, leave it closed."] };
        return { level: "schedule", why: "One slow drain is annoying, not urgent. Book a window that suits you.", steps: ["Try a plunger on a sink or toilet (cover the overflow hole on a sink).", "Skip chemical drain cleaner; it damages older pipes."] };
      }
    },
    nohot: {
      name: "No hot water", trade: "plumbing", problem: "No hot water",
      qs: [
        { q: "Is your water heater gas or electric?", a: [["Gas", "gas"], ["Electric", "elec"], ["Not sure", "elec"]] },
        { q: "Anything else going on around it?", a: [["I smell gas", "gas"], ["Water around the base", "leak"], ["Neither", "none"]] }
      ],
      result: function (a) {
        if (a[1] === "gas") return { level: "now", why: "A gas smell is an emergency before it's a plumbing problem. Get out first.", steps: ["Leave the house now. Don't flip switches, light anything or use your phone inside.", "From outside, call 911 or your gas company.", "Once they say it's safe, call us about the water heater."] };
        if (a[1] === "leak") return { level: "today", why: "A leaking tank usually means it's near the end. It can go from a puddle to a flood without warning.", steps: ["Close the cold-water valve on the pipe going into the top of the tank.", a[0] === "gas" ? "Turn the gas control knob to Off or Pilot." : "Switch off the water heater's breaker in the panel.", "Put towels down and move boxes away from the tank."] };
        return { level: "today", why: "Cold showers aren't dangerous, but nobody wants to wait. Most of the time it's a part, not a new tank.", steps: [a[0] === "gas" ? "Check whether the pilot light is out; relight only if the label's instructions are clear to you." : "Check the panel for a tripped water heater breaker and reset it once. If it trips again, leave it off.", "Note the age on the label sticker; it helps us bring the right part."] };
      }
    },
    nopower: {
      name: "No power", trade: "electrical", problem: "No power to part of the house",
      qs: [
        { q: "Is the whole house out, or just some rooms?", a: [["The whole house", "all"], ["Just some rooms or outlets", "some"]] },
        { q: "Are your neighbours out too?", a: [["Yes, the street's dark", "yes"], ["No, or I can't tell", "no"]] }
      ],
      result: function (a) {
        if (a[0] === "all" && a[1] === "yes") return { level: "schedule", why: "If the whole street is dark, it's a utility outage, not your house. Call your power company. We can't fix the lines on the poles.", steps: ["Report the outage to your electric utility.", "Unplug sensitive electronics so a surge doesn't catch them when power returns.", "Never run a generator indoors or in a garage."] };
        if (a[0] === "all") return { level: "now", why: "Just your house out usually means the main breaker, the meter or the service line. That's a job for an electrician, today.", steps: ["Check the main breaker at the top of the panel. If it's tripped, reset it once.", "If it trips again, or you see scorch marks or smell burning, leave it off and call.", "Don't touch the meter or the service wires outside."] };
        return { level: "today", why: "Part of the house out is usually a tripped breaker or a failed connection. Worth fixing today, especially if it's the fridge or the furnace.", steps: ["Look for a breaker sitting in the middle position. Push it fully off, then on.", "Press TEST then RESET on any GFCI outlets in kitchens, baths and the garage.", "If nothing comes back, leave it and book a window."] };
      }
    },
    trip: {
      name: "Breaker keeps tripping", trade: "electrical", problem: "Breaker keeps tripping",
      qs: [
        { q: "When does it trip?", a: [["Right away, as soon as I reset it", "now"], ["After a while, or when something's running", "load"]] },
        { q: "Any burning smell, buzzing, or a warm panel?", a: [["Yes", "hot"], ["No", "cool"]] }
      ],
      result: function (a) {
        if (a[1] === "hot") return { level: "now", why: "Heat, buzzing or a burning smell means something is overheating. That's how house fires start.", steps: ["Leave the breaker off. Don't reset it again.", "If you see smoke or flames, get out and call 911.", "Keep the panel door closed and call the emergency line."] };
        if (a[0] === "now") return { level: "today", why: "A breaker that trips instantly is protecting you from a short somewhere on that circuit. Leave it off until it's found.", steps: ["Leave the breaker off.", "Unplug everything on that circuit, so we can test it clean.", "Run an extension cord from a working room for the fridge if needed."] };
        return { level: "schedule", why: "Tripping under load usually means too much on one circuit, like a space heater and a hair dryer together. Annoying, fixable, not urgent.", steps: ["Move the big load (space heater, microwave, window AC) to another circuit.", "Note which things were running when it tripped; it saves time on site."] };
      }
    },
    outlet: {
      name: "Dead outlet", trade: "electrical", problem: "Dead or scorched outlet",
      qs: [
        { q: "Is it scorched, warm to the touch, or buzzing?", a: [["Yes", "hot"], ["No, it's just dead", "dead"]] },
        { q: "Is it in a kitchen, bathroom, garage or outdoors?", a: [["Yes", "wet"], ["No", "dry"]] }
      ],
      result: function (a) {
        if (a[0] === "hot") return { level: "today", why: "A warm or scorched outlet is a loose or failing connection. Don't use it until it's replaced.", steps: ["Unplug whatever is in it.", "Switch off its breaker if you can tell which one it is.", "If it's smoking, get out and call 911."] };
        if (a[1] === "wet") return { level: "schedule", why: "Outlets in wet areas are protected by a GFCI, which may have tripped. That's often a 10-second fix.", steps: ["Find the outlet with TEST and RESET buttons nearby (it may be in another room or the garage).", "Press RESET firmly. If it won't reset, book a window."] };
        return { level: "schedule", why: "A single dead outlet is rarely urgent. Book a window that suits you, and we'll check the circuit while we're there.", steps: ["Check the panel for a tripped breaker.", "Check for a wall switch that might control it."] };
      }
    }
  };
  var LEVEL = { now: "Call now", today: "Get a tech today", schedule: "Can be scheduled" };

  var tri = { key: null, step: 0, ans: [] };
  var tPanels = {};
  $$("[data-tpanel]").forEach(function (p) { tPanels[p.getAttribute("data-tpanel")] = p; });
  function tShow(name) {
    Object.keys(tPanels).forEach(function (k) { tPanels[k].hidden = k !== name; });
    var p = tPanels[name]; p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
  }
  function tProgress(stepNo, label) {
    $("[data-tprogress]").style.width = (stepNo / 3 * 100) + "%";
    $("[data-tlabel]").textContent = "Step " + Math.min(stepNo, 3) + " of 3: " + label;
  }
  function tQuestion() {
    var d = TRIAGE[tri.key], q = d.qs[tri.step];
    tProgress(tri.step + 1 + (tri.step === 0 ? 0.5 : 0.6), d.name);
    $("[data-tq]").textContent = q.q;
    $("[data-tans]").innerHTML = q.a.map(function (a, i) { return '<button type="button" class="ans" data-ai="' + i + '">' + a[0] + "</button>"; }).join("");
    tShow("q");
    $("[data-tq]").focus({ preventScroll: true });
  }
  function tResult() {
    var d = TRIAGE[tri.key], r = d.result(tri.ans);
    tProgress(3, "Your reading");
    var u = $("[data-urgency]"); u.setAttribute("data-level", r.level);
    $("[data-ulabel]").textContent = LEVEL[r.level];
    $("[data-uwhy]").textContent = r.why;
    $("[data-usteps]").innerHTML = r.steps.map(function (s) { return "<li><span>" + s + "</span></li>"; }).join("");
    var call = $("[data-ucall]"), book = $("[data-ubook]");
    call.className = "btn " + (r.level === "now" ? "call" : "ghost");
    book.className = "btn " + (r.level === "now" ? "ghost" : "navy");
    book.setAttribute("data-trade", d.trade); book.setAttribute("data-problem", d.problem);
    tShow("result");
    $("[data-ulabel]").focus({ preventScroll: true });
  }
  $$("[data-prob]").forEach(function (b) {
    b.addEventListener("click", function () { tri = { key: b.getAttribute("data-prob"), step: 0, ans: [] }; tQuestion(); });
  });
  $("[data-tans]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-ai]"); if (!b) return;
    tri.ans.push(TRIAGE[tri.key].qs[tri.step].a[+b.getAttribute("data-ai")][1]);
    tri.step++;
    if (tri.step < TRIAGE[tri.key].qs.length) tQuestion(); else tResult();
  });
  $("[data-tback]").addEventListener("click", function () {
    if (tri.step === 0) { tShow("pick"); tProgress(1, "What's going on?"); $("[data-prob]").focus(); return; }
    tri.step--; tri.ans.pop(); tQuestion();
  });
  $("[data-trestart]").addEventListener("click", function () { tShow("pick"); tProgress(1, "What's going on?"); $("[data-prob]").focus(); });
  tProgress(1, "What's going on?");

  /* ---------- booking ---------- */
  var PROBLEMS = {
    plumbing: [["Leak or burst pipe", "$150–$700"], ["Clogged drain", "$125–$550"], ["No hot water", "$180–$420 for most repairs"], ["Toilet running or leaking", "$140–$380"], ["Water heater replacement", "$1,400–$2,600 installed"], ["Something else", "priced on site"]],
    electrical: [["No power to part of the house", "$180–$350 for most fixes"], ["Breaker keeps tripping", "$180–$350"], ["Dead or scorched outlet", "$120–$260 per device"], ["Light or fan install", "$140–$420 per fixture"], ["Panel upgrade quote", "$2,200–$4,200"], ["Something else", "priced on site"]]
  };
  var form = $("#bookform"), bstep = 1, presetProblem = null;
  var bPanels = $$("[data-bpanel]", form), bNext = $("[data-bnext]"), bBack = $("[data-bback]");

  function renderProblems() {
    var trade = (form.trade.value || "plumbing");
    $("[data-bproblems]").innerHTML = PROBLEMS[trade].map(function (p, i) {
      return '<label class="chip"><input type="radio" name="problem" value="' + p[0] + '" data-price="' + p[1] + '"' + (p[0] === presetProblem ? " checked" : "") + "><span>" + p[0] + "</span></label>";
    }).join("");
    updatePriceHint();
  }
  function updatePriceHint() {
    var c = $('input[name=problem]:checked', form);
    $("[data-bprice]").textContent = c ? "Typical range: " + c.getAttribute("data-price") + ", plus the $79 trip fee (credited if you go ahead)." : "";
  }
  function renderWindows() {
    var ws = windows(5);
    $("[data-bwindows]").innerHTML = ws.map(function (w, i) {
      return '<label class="win"><input type="radio" name="window" value="' + w.label + " " + w.day + '"' + (i === 0 ? " checked" : "") + "><span><b>" + w.label + "</b><small>" + w.day.charAt(0).toUpperCase() + w.day.slice(1) + (i === 0 ? ", next open window" : "") + "</small></span></label>";
    }).join("") + '<label class="win emerg"><input type="radio" name="window" value="as soon as possible (emergency)"><span><b>Emergency: as soon as possible</b><small>Any hour. $125 after-hours fee outside office hours.</small></span></label>';
  }
  function bGo(n, focus) {
    bstep = n;
    bPanels.forEach(function (p) { p.hidden = +p.getAttribute("data-bpanel") !== n; });
    $$("[data-bstep-dot]").forEach(function (d) {
      var k = +d.getAttribute("data-bstep-dot");
      d.classList.toggle("on", k === n); d.classList.toggle("done", k < n);
    });
    if (n === 2) renderProblems();
    if (n === 3) renderWindows();
    bBack.hidden = n === 1;
    bNext.textContent = n === 4 ? "Book my call" : "Next";
    $("[data-berr]").textContent = "";
    if (focus !== false) {
      var panel = $('[data-bpanel="' + n + '"]', form);
      var first = panel.querySelector("input:checked") || panel.querySelector("input, select");
      if (first) first.focus({ preventScroll: true });
    }
  }
  form.addEventListener("change", function (e) {
    if (e.target.name === "problem") updatePriceHint();
    if (e.target.name === "trade") presetProblem = null;
  });
  // choosing a card moves you on, like a dispatcher would
  form.addEventListener("click", function (e) {
    var inp = e.target.closest("label") && e.target.closest("label").querySelector("input[type=radio]");
    if (!inp || e.detail === 0) return;
    setTimeout(function () { if (inp.checked && bstep < 3 && +inp.closest("[data-bpanel]").getAttribute("data-bpanel") === bstep) bGo(bstep + 1); }, 260);
  });
  bBack.addEventListener("click", function () { bGo(Math.max(1, bstep - 1)); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("[data-berr]");
    if (bstep === 1 && !form.trade.value) { flashMsg("Pick plumbing or electrical."); return; }
    if (bstep === 2 && !$('input[name=problem]:checked', form)) { flashMsg("Pick the closest problem, or Something else."); return; }
    if (bstep < 4) { bGo(bstep + 1); return; }
    var bad = null;
    [form.name, form.phone, form.town].forEach(function (f) { f.removeAttribute("aria-invalid"); });
    if (!form.name.value.trim()) bad = [form.name, "Add your name so the tech knows who to ask for."];
    else if (form.phone.value.replace(/\D/g, "").length < 10) bad = [form.phone, "Add a 10-digit mobile number for the arrival text."];
    else if (!form.town.value) bad = [form.town, "Choose your town."];
    if (bad) { bad[0].setAttribute("aria-invalid", "true"); err.textContent = bad[1]; bad[0].focus(); return; }
    confirmBooking();
  });
  function flashMsg(m) {
    var p = $('[data-bpanel="' + bstep + '"]', form), el = p.querySelector(".form-err") || p.appendChild(Object.assign(document.createElement("p"), { className: "form-err", role: "alert" }));
    el.textContent = m;
  }
  function confirmBooking() {
    var ref = "RL-" + String(Math.floor(10000 + Math.random() * 89999));
    var trade = form.trade.value, problem = $('input[name=problem]:checked', form).value, win = $('input[name=window]:checked', form).value;
    var name = form.name.value.trim().split(" ")[0], town = form.town.value;
    var tech = trucks.filter(function (t) { return t.trade.toLowerCase() === trade; }).sort(function (a, b) { return a.left - b.left; })[0];
    $("[data-bref]").textContent = ref;
    $("[data-bsummary]").textContent = "Thanks, " + name + ". " + (trade === "plumbing" ? "Plumbing" : "Electrical") + ": " + problem.toLowerCase() + ", arriving " + win + "." +
      (town === "Somewhere else" ? " You're outside our usual towns, so the office would call to check before confirming." : " " + tech.tech + " in Truck " + tech.n + " would be your tech.");
    form.hidden = true;
    var c = $("[data-bconfirm]"); c.hidden = false; c.focus();
    $("[data-sms1]").textContent = "Relay: Thanks " + name + ", you're booked for " + win + ". Ref " + ref + ".";
    $("[data-sms2]").textContent = tech.tech + " in Truck " + tech.n + " is en route and should arrive in about 25 minutes.";
    playPhone(true);
  }
  $("[data-breset]").addEventListener("click", function () {
    form.reset(); presetProblem = null; form.hidden = false; $("[data-bconfirm]").hidden = true; bGo(1);
  });
  // "Request a tech" from the triage result pre-fills trade and problem
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-ubook]"); if (!a) return;
    var trade = a.getAttribute("data-trade");
    form.hidden = false; $("[data-bconfirm]").hidden = true;
    $$('input[name=trade]', form).forEach(function (r) { r.checked = r.value === trade; });
    presetProblem = a.getAttribute("data-problem");
    renderProblems();
    bGo(3);
  });
  bGo(1, false);

  /* ---------- phone texts ---------- */
  var phoneTimer;
  function playPhone(force) {
    var b1 = $("[data-sms1]"), b2 = $("[data-sms2]"), ty = $(".typing");
    clearTimeout(phoneTimer);
    if (reduced) { b1.classList.add("show"); b2.classList.add("show"); return; }
    b1.classList.remove("show"); b2.classList.remove("show"); ty.classList.remove("show");
    phoneTimer = setTimeout(function () {
      b1.classList.add("show");
      phoneTimer = setTimeout(function () {
        ty.classList.add("show");
        phoneTimer = setTimeout(function () { ty.classList.remove("show"); b2.classList.add("show"); }, 1600);
      }, 900);
    }, force ? 300 : 500);
  }

  /* ---------- HomeCare ---------- */
  var dlg = $("[data-hc-dialog]"), hcForm = $("[data-hc-form]"), lastFocus;
  $$("[data-join]").forEach(function (b) {
    b.addEventListener("click", function () {
      lastFocus = b;
      $$("[data-hc-plan]").forEach(function (s) { s.textContent = b.getAttribute("data-join"); });
      hcForm.hidden = false; hcForm.reset(); $("[data-hc-done]").hidden = true; $("[data-hc-err]").textContent = "";
      dlg.hidden = false; hcForm.name.focus();
    });
  });
  function closeDlg() { dlg.hidden = true; if (lastFocus) lastFocus.focus(); }
  $$("[data-hc-close]").forEach(function (b) { b.addEventListener("click", closeDlg); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });
  document.addEventListener("keydown", function (e) {
    if (dlg.hidden) return;
    if (e.key === "Escape") closeDlg();
    if (e.key === "Tab") {
      var f = $$("button, input, a[href]", dlg).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  hcForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = hcForm, msg = "";
    if (!f.name.value.trim()) msg = "Add your name.";
    else if (f.phone.value.replace(/\D/g, "").length < 10) msg = "Add a 10-digit phone number.";
    else if (!f.addr.value.trim()) msg = "Add the street address we'd visit.";
    if (msg) { $("[data-hc-err]").textContent = msg; return; }
    $("[data-hc-ref]").textContent = "HC-" + Math.floor(1000 + Math.random() * 8999);
    f.hidden = true; var d = $("[data-hc-done]"); d.hidden = false; d.focus();
  });
  // mobile: label each plan cell
  var heads = $$(".plans thead th").map(function (th) { return th.childNodes[0].textContent.trim(); });
  $$(".plans tbody tr").forEach(function (tr) { $$("td", tr).forEach(function (td, i) { td.setAttribute("data-plan", heads[i + 1] || ""); }); });

  // water heater age
  var age = $("[data-age]");
  function ageSay() {
    var y = +age.value;
    $("[data-age-out]").textContent = y;
    var bar = $("[data-age-bar]"); bar.style.width = Math.min(100, y / 14 * 100) + "%"; bar.classList.toggle("old", y >= 10);
    $("[data-age-say]").textContent = y < 5 ? "Still young. A yearly flush keeps sediment out and helps it reach old age."
      : y < 10 ? "Middle-aged. Flush it every year and have the relief valve and anode rod checked."
      : "Most tanks last 8 to 12 years. Yours is due for a look before it picks its own day to quit.";
  }
  age.addEventListener("input", ageSay); ageSay();

  /* ---------- service area ---------- */
  var SERVED = ["rogersville", "church hill", "mount carmel", "surgoinsville", "bulls gap", "mooresburg", "eidson", "persia"];
  var CALLFIRST = ["sneedville", "kingsport", "morristown"];
  $("[data-towncheck]").addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = $("#town-in").value.trim(), v = raw.toLowerCase(), out = $("[data-townout]");
    $$(".area-map .pin").forEach(function (p) { p.classList.toggle("hit", p.textContent.toLowerCase().indexOf(v) === 0 && v.length > 2); });
    if (!v) { out.textContent = "Type a town name first."; return; }
    var name = raw.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    if (SERVED.indexOf(v) > -1) out.textContent = "Yes, " + name + " is in our area. Book online or call " + PHONE + ".";
    else if (CALLFIRST.indexOf(v) > -1) out.textContent = name + " is just outside our ring. Call " + PHONE + " before booking and we'll tell you straight.";
    else out.textContent = "We don't have " + name + " on our list. Call " + PHONE + " and we'll tell you honestly if we can get there.";
  });

  /* ---------- sample reviews ---------- */
  var REVIEWS = [
    ["“Our pipe let go at eleven at night. A person answered, told us where the shut-off was, and the truck was in the driveway in under an hour.”", "Burst pipe, Church Hill"],
    ["“They told me the range on the phone and the bill landed right in the middle of it. No surprises, which is all I wanted.”", "Water heater, Rogersville"],
    ["“I got a text with the tech's name and a 30-minute heads-up. I didn't lose a whole day off work waiting.”", "Breaker tripping, Surgoinsville"],
    ["“The HomeCare visit caught a corroded relief valve before it became a problem. Worth it for that alone.”", "HomeCare member, Mooresburg"]
  ];
  var ri = 0, bq = $("[data-quote]");
  function showReview(d) {
    ri = (ri + d + REVIEWS.length) % REVIEWS.length;
    bq.classList.add("swap");
    setTimeout(function () {
      bq.querySelector("p").textContent = REVIEWS[ri][0];
      $("[data-who]").innerHTML = "Sample review<span>" + REVIEWS[ri][1] + "</span>";
      $("[data-revcount]").textContent = (ri + 1) + " of " + REVIEWS.length;
      bq.classList.remove("swap");
    }, reduced ? 0 : 260);
  }
  $$("[data-rev]").forEach(function (b) { b.addEventListener("click", function () { showReview(+b.getAttribute("data-rev")); }); });

  /* ---------- entrances, checklist, nav ---------- */
  $$(".board > .tile:not(.nameband)").forEach(function (t) { if (!t.closest(".hero")) t.classList.add("rise"); });
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var sibs = el.parentElement ? $$(":scope > .rise, :scope > .reveal", el.parentElement) : [];
      var idx = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = (reduced ? 0 : Math.min(idx, 6) * 70) + "ms";
      el.classList.add("in");
      io.unobserve(el);
      if (el.matches("[data-checklist]") || el.querySelector("[data-checklist]")) runChecklist();
      if (el.classList.contains("phone-tile")) playPhone();
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".reveal, .rise").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });
  if (io) { io.observe($(".phone-tile")); } else { playPhone(); }

  var checked = false;
  function runChecklist() {
    if (checked) return; checked = true;
    $$("[data-checklist] li").forEach(function (li, i) { setTimeout(function () { li.classList.add("on"); }, reduced ? 0 : 400 + i * 380); });
  }

  var nav = $("#nav");
  window.addEventListener("scroll", function () { nav.classList.toggle("scrolled", window.scrollY > 20); }, { passive: true });
})();
