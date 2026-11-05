/* Texas Agenda Forecaster: interface. */
(function () {
  const D = window.TX_DATA;
  const M = window.TX_MODEL;
  const STORE_KEY = "txaf-my-promises-v1";
  const VIEWS = ["agenda", "promises", "history", "method"];

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (p) => Math.round(p * 100) + "%";
  const leaderById = (id) => D.LEADERS.find((l) => l.id === id);
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const PHASES = {
    "day-one":    { title: "Day one", when: "Inauguration · " + fmtDate(D.POWER.session.inauguration),
                    blurb: "Executive actions promised for the first hours in office. Fast, but the most exposed to lawsuits." },
    "first-year": { title: "First year", when: "2027 · own-office powers",
                    blurb: "Moves that statewide officers can make with powers their offices already hold." },
    "session":    { title: "90th Legislature", when: fmtDate(D.POWER.session.opens) + " · " + D.POWER.session.days + " days",
                    blurb: "Everything that needs a bill or the 2028-29 budget. Each item has to get through the Republican Senate." },
    "long-term":  { title: "Longer horizon", when: "Congress · constitution · 2028+",
                    blurb: "Goals that need Congress, voters or a different Senate." },
  };

  // ---- State -----------------------------------------------------------------
  let mine = [];
  try { mine = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch (e) { mine = []; }
  const saveMine = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(mine)); } catch (e) { /* storage unavailable */ } };
  const open = new Set();

  function scenario() {
    return {
      senateCoop: +$("#s-senate").value,
      ltGovPowers: $("#s-ltgov").checked ? 1 : 0,
      fiscal: +$("#s-fiscal").value,
      courts: +$("#s-courts").value,
      congress: +$("#s-congress").value,
    };
  }
  const includeFederal = () => $("#s-federal").checked;

  function allPromises() {
    for (const m of mine) if (!D.THEMES[m.theme]) D.THEMES[m.theme] = m.themeLabel || m.theme;
    return D.PROMISES.concat(mine);
  }

  function run() {
    const res = M.buildAgenda(D, scenario(), allPromises());
    if (!includeFederal()) res.items = res.items.filter((i) => i.level !== "federal");
    return res;
  }

  // ---- Static pieces -----------------------------------------------------------
  function renderPower() {
    const P = D.POWER;
    const seat = (n, total, cls) => `<i class="${cls}" style="width:${(n / total) * 100}%"></i>`;
    const mark = (n, total, label) => `<span class="mark" style="left:calc(${(n / total) * 100}% - 1px)" title="${esc(label)}"></span>`;
    const h = P.house, s = P.senate;
    $("#power").innerHTML = `
      <div class="chamber">
        <h3>Governor <span>+ Lt. Gov., AG, Comptroller</span></h3>
        <div class="holder d">Democrats</div>
        <p>Hinojosa holds the veto and line-item veto. Neither party has the two-thirds of both chambers needed to override.</p>
      </div>
      <div class="chamber">
        <h3>Texas House <span>${h.seats} seats</span></h3>
        <div class="holder d">Democrats ${h.dem}–${h.gop}</div>
        <div class="seatbar" role="img" aria-label="House: ${h.dem} Democrats, ${h.gop} Republicans, ${h.uncalled} uncalled; majority ${h.majority}">
          ${seat(h.dem, h.seats, "d")}${seat(h.uncalled, h.seats, "u")}${seat(h.gop, h.seats, "r")}
          ${mark(h.majority, h.seats, "Majority: " + h.majority)}${mark(h.twoThirds, h.seats, "Two-thirds: " + h.twoThirds)}
        </div>
        <div class="thresholds"><span>${h.uncalled} uncalled</span><span>majority ${h.majority}</span><span>two-thirds ${h.twoThirds}</span></div>
        <p>${esc(h.note)}</p>
      </div>
      <div class="chamber">
        <h3>Texas Senate <span>${s.seats} seats</span></h3>
        <div class="holder r">Republicans ${s.gop}–${s.dem}</div>
        <div class="seatbar" role="img" aria-label="Senate: ${s.gop} Republicans, ${s.dem} Democrats; two-thirds ${s.twoThirds}">
          ${seat(s.dem, s.seats, "d")}${seat(s.seats - s.dem - s.gop, s.seats, "u")}${seat(s.gop, s.seats, "r")}
          ${mark(s.seats - s.majority, s.seats, "Majority: " + s.majority)}${mark(s.seats - s.twoThirds, s.seats, "Two-thirds: " + s.twoThirds)}
        </div>
        <div class="thresholds"><span>majority ${s.majority}</span><span>5/9 floor rule ${s.fiveNinths}</span><span>two-thirds ${s.twoThirds}</span></div>
        <p>${esc(s.note)}</p>
      </div>`;
    $("#asof").textContent = "Unofficial results and declarations as of " + fmtDate(D.ASOF) + ". Session opens " + fmtDate(D.POWER.session.opens) + ".";
    $("#foot").innerHTML = `Built from public reporting linked on each promise. Likelihoods are model estimates for discussion, not predictions of record. ${esc(D.POWER.courts.note)} ${esc(D.POWER.federal.note)}`;
  }

  // ---- Shared bits -------------------------------------------------------------
  function leaderChips(ids) {
    return ids.map((id) => `<span class="chip">${esc(leaderById(id).name.split(" ").pop())} · ${esc(leaderById(id).office)}</span>`).join("");
  }

  function routeBlock(pr) {
    const b = M.band(pr.p);
    const path = D.PATHWAYS[pr.pathway];
    const factors = [`<span class="factor">Base rate, ${esc(path.label.toLowerCase())}: ${pct(pr.base)}</span>`]
      .concat(pr.factors.map((f) => `<span class="factor ${f.delta > 0 ? "up" : "down"}">${esc(f.label)} ${f.delta > 0 ? "+" : "−"}${Math.abs(f.delta).toFixed(2)}</span>`));
    const srcs = (pr.sources || []).map((k) => {
      const s = D.SRC[k] || (k && k.startsWith("http") ? { label: k.replace(/^https?:\/\//, "").slice(0, 60), url: k } : null);
      return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : "";
    }).join("");
    return `<div class="route c-${b.key}">
      <div><div class="title">${esc(pr.title)} ${pr.mine ? '<span class="tag-mine">added by you</span>' : ""}</div>
        <div class="who">${leaderChips([pr.leader])}<span class="chip ${path.needsSenate ? "gate" : ""}">${esc(path.label)}</span></div></div>
      <div class="rp">${pct(pr.p)}</div>
      <p>${esc(pr.detail)}</p>
      <div class="factors">${factors.join("")}</div>
      ${srcs ? `<div class="srcs">${srcs}</div>` : ""}
    </div>`;
  }

  // ---- Agenda view -------------------------------------------------------------
  function renderAgenda(res) {
    const counts = { likely: 0, tossup: 0, uphill: 0, longshot: 0 };
    for (const it of res.items) counts[M.band(it.p).key]++;
    const sum = (k, label) => `<div class="sum c-${k}"><b>${counts[k]}</b><span>${label}</span></div>`;

    let html = `<div class="summary" aria-label="Agenda items by likelihood">
      ${sum("likely", "Likely (65%+)")}${sum("tossup", "Toss-up (40–64%)")}${sum("uphill", "Uphill (20–39%)")}${sum("longshot", "Long shot (under 20%)")}
    </div>`;

    for (const ph of M.PHASE_ORDER) {
      const items = res.items.filter((i) => i.phase === ph);
      if (!items.length) continue;
      const meta = PHASES[ph];
      html += `<section class="phase"><div class="phase-head"><h2>${meta.title}</h2><span>${esc(meta.when)}</span><p>${esc(meta.blurb)}</p></div>`;
      for (const it of items) {
        const b = M.band(it.p);
        const isOpen = open.has(it.theme);
        const smaller = it.best !== it.headline
          ? `Most achievable step: ${esc(it.best.title.toLowerCase())} (${pct(it.best.p)})` : "";
        html += `<div class="row c-${b.key}">
          <button type="button" aria-expanded="${isOpen}" data-theme="${esc(it.theme)}">
            <div><div class="title">${esc(it.label)}</div>
              <div class="sub">${esc(it.headline.title)}</div>
              ${smaller ? `<div class="sub">${smaller}</div>` : ""}
              <div class="who">${leaderChips(it.leaders)}</div></div>
            <div class="meter" aria-hidden="true"><i style="width:${it.p * 100}%"></i></div>
            <div class="pct"><b>${pct(it.p)}</b><span class="pill">${b.label}</span></div>
          </button>
          ${isOpen ? `<div class="detail">${it.promises.map(routeBlock).join("")}</div>` : ""}
        </div>`;
      }
      html += `</section>`;
    }
    $("#view").innerHTML = html;
    $("#view").querySelectorAll(".row > button").forEach((btn) => btn.addEventListener("click", () => {
      const t = btn.dataset.theme;
      open.has(t) ? open.delete(t) : open.add(t);
      render();
    }));
  }

  // ---- Promises view -----------------------------------------------------------
  let leaderFilter = "all";
  function renderPromises(res) {
    const cards = D.LEADERS.map((l) => `<div class="leader"><div class="office">${esc(l.office)}</div><h3>${esc(l.name)}</h3>
      <div class="res">${esc(l.result)}</div><p>${esc(l.blurb)}</p></div>`).join("");
    const list = res.scored
      .filter((p) => leaderFilter === "all" || p.leader === leaderFilter)
      .filter((p) => includeFederal() || leaderById(p.leader).level !== "federal")
      .sort((a, b) => b.p - a.p);

    const opts = (obj, sel) => Object.entries(obj).map(([v, l]) => `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(l)}</option>`).join("");
    const pathOpts = Object.fromEntries(Object.entries(D.PATHWAYS).map(([k, v]) => [k, v.label]));
    const leaderOpts = Object.fromEntries(D.LEADERS.map((l) => [l.id, l.name + " (" + l.office + ")"]));

    $("#view").innerHTML = `
      <h2 class="section-title">Who promised what</h2>
      <p class="lede">Every tracked declaration, scored on its own. Sorted from most to least likely under the current scenario.</p>
      <div class="leaders">${cards}</div>
      <div class="form-actions" style="margin-bottom:12px">
        <label class="field" style="max-width:320px">Show promises from
          <select id="f-leader"><option value="all">All leaders</option>${opts(leaderOpts, leaderFilter)}</select></label>
      </div>
      <div style="display:grid;gap:8px">${list.map(routeBlock).join("") || '<p class="note">No promises match.</p>'}</div>

      <form class="add" id="add-form" novalidate>
        <h2 class="section-title" style="margin:0">Add a new declaration</h2>
        <p class="note" style="margin:0">Leaders will keep announcing priorities before and during the session. Add one here and it is scored and placed in the agenda immediately. Your additions stay in this browser only.</p>
        <div class="form-grid">
          <label class="field wide">What they promised<input id="a-title" required maxlength="160" placeholder="e.g. Raise the homestead exemption to $200,000"></label>
          <label class="field">Leader<select id="a-leader">${opts(leaderOpts, "hinojosa")}</select></label>
          <label class="field">Agenda theme<select id="a-theme">${opts(D.THEMES, "property-tax")}<option value="__new">New theme…</option></select></label>
          <label class="field" id="a-newtheme-wrap" hidden>New theme name<input id="a-newtheme" maxlength="40"></label>
          <label class="field">How it becomes real<select id="a-pathway">${opts(pathOpts, "statute")}</select></label>
          <label class="field">GOP Senate likely to<select id="a-senate">${opts({ support: "Support", mixed: "Split / negotiate", oppose: "Oppose", "n/a": "Not involved" }, "mixed")}</select></label>
          <label class="field">Legal risk<select id="a-legal">${opts({ low: "Low", med: "Medium", high: "High" }, "low")}</select></label>
          <label class="field">Cost to the state<select id="a-cost">${opts({ low: "Low", med: "Medium", high: "High" }, "med")}</select></label>
          <label class="field">Public appeal<select id="a-appeal">${opts({ low: "Narrow", med: "Mixed", high: "Broad" }, "med")}</select></label>
          <label class="field">Emphasis<select id="a-priority">${opts({ 3: "Headline promise", 2: "Major", 1: "Minor" }, "2")}</select></label>
          <label class="field">Timing<select id="a-when">${opts({ "day-one": "Day one", "first-year": "First year", session: "2027 session", "long-term": "Longer horizon" }, "session")}</select></label>
          <label class="field wide">Source link (optional)<input id="a-source" type="url" placeholder="https://"></label>
          <label class="field wide">Notes (optional)<textarea id="a-detail" rows="2" maxlength="400"></textarea></label>
        </div>
        <div class="form-actions">
          <button class="btn primary" type="submit">Add and score</button>
          <button class="btn" type="button" id="a-copy"${mine.length ? "" : " disabled"}>Copy my additions as JSON</button>
          <button class="btn" type="button" id="a-clear"${mine.length ? "" : " disabled"}>Remove my additions</button>
          <span class="note" id="a-msg" role="status"></span>
        </div>
      </form>`;

    $("#f-leader").addEventListener("change", (e) => { leaderFilter = e.target.value; render(); });
    $("#a-theme").addEventListener("change", (e) => { $("#a-newtheme-wrap").hidden = e.target.value !== "__new"; });
    $("#a-pathway").addEventListener("change", (e) => {
      if (!D.PATHWAYS[e.target.value].needsSenate) $("#a-senate").value = "n/a";
      else if ($("#a-senate").value === "n/a") $("#a-senate").value = "mixed";
    });
    $("#add-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = $("#a-title").value.trim();
      if (!title) { $("#a-msg").textContent = "Describe the promise before adding it."; $("#a-title").focus(); return; }
      let theme = $("#a-theme").value, themeLabel;
      if (theme === "__new") {
        themeLabel = $("#a-newtheme").value.trim();
        if (!themeLabel) { $("#a-msg").textContent = "Name the new theme, or pick an existing one."; $("#a-newtheme").focus(); return; }
        theme = "my-" + themeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      const src = $("#a-source").value.trim();
      mine.push({
        id: "my-" + Date.now(), mine: true, leader: $("#a-leader").value, theme, themeLabel,
        priority: +$("#a-priority").value, when: $("#a-when").value, title,
        detail: $("#a-detail").value.trim() || "Added by you.",
        pathway: $("#a-pathway").value, senate: $("#a-senate").value, legal: $("#a-legal").value,
        cost: $("#a-cost").value, appeal: $("#a-appeal").value, sources: src ? [src] : [],
      });
      saveMine();
      render();
      $("#a-msg").textContent = "Added. It now appears in the list and the projected agenda.";
    });
    $("#a-copy").addEventListener("click", () => {
      const text = JSON.stringify(mine.map(({ mine: _m, ...rest }) => rest), null, 2);
      const done = () => { $("#a-msg").textContent = "Copied. Paste into data.js PROMISES to make them permanent."; };
      try {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text));
      } catch (err) { fallbackCopy(text); }
    });
    $("#a-clear").addEventListener("click", () => {
      mine = []; saveMine(); render();
      $("#a-msg").textContent = "Your additions were removed.";
    });
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.rows = 6; ta.style.width = "100%";
    $("#a-msg").textContent = "Copy was blocked. Select the text below and copy it.";
    $("#a-msg").after(ta); ta.select();
  }

  // ---- History view ------------------------------------------------------------
  function renderHistory(res) {
    const rows = D.HISTORY.slice().sort((a, b) => a.year - b.year).map((h) => `<tr>
      <td class="num">${h.year}</td><td>${esc(h.who)}</td><td>${esc(h.title)}</td>
      <td>${esc(D.PATHWAYS[h.pathway].label)}</td><td>${h.control === "split" ? "Split" : "Unified"}</td>
      <td class="o-${h.outcome}">${h.outcome === "partial" ? "Partly kept" : h.outcome === "kept" ? "Kept" : "Broken"}</td>
      <td>${esc(h.note)}</td></tr>`).join("");
    const rates = Object.entries(res.rates).map(([k, r]) => `<div class="rate">
      <span>${esc(D.PATHWAYS[k].label)}</span>
      <div class="meter"><i style="width:${r.rate * 100}%"></i></div>
      <span class="num">${pct(r.rate)}</span></div>`).join("");
    const counts = Object.entries(res.rates).map(([k, r]) => `${D.PATHWAYS[k].label}: ${r.n}`).join(" · ");
    $("#view").innerHTML = `
      <h2 class="section-title">How Texas promises have fared</h2>
      <p class="lede">Major promises by Texas governors and lieutenant governors since 1983, sorted by how they had to become law. The model learns its starting odds for each route from this record, counting promises made under split control twice because 2027 will be split.</p>
      <div class="rates">${rates}</div>
      <p class="note" style="margin:-12px 0 18px">Historical records per route: ${esc(counts)}. Routes with no Texas examples rely on the prior described under Method.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Year</th><th>Leader</th><th>Promise</th><th>Route</th><th>Control</th><th>Outcome</th><th>What happened</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="note" style="margin-top:14px">The closest precedent for 2027 is 1995–1999: a governor of one party working with a Legislature led by the other. George W. Bush passed his four headline items in his first session by working through Democratic Lt. Gov. Bob Bullock, then lost his bigger tax swap in 1997.</p>`;
  }

  // ---- Method view -------------------------------------------------------------
  function renderMethod() {
    const paths = Object.values(D.PATHWAYS).map((p) => `<li><b>${esc(p.label)}.</b> ${esc(p.detail)}</li>`).join("");
    $("#view").innerHTML = `<div class="prose">
      <h2 class="section-title">How the forecast works</h2>
      <p>The app does three things: it collects what each leader has said they will do, works out how each promise would have to become real in Texas, and estimates the odds using Texas's own track record.</p>
      <h3>1. Route to reality</h3>
      <p>Each promise is tagged with the route it has to travel. The route matters more than the promise. A governor can fire an agency head alone, but a teacher raise has to pass a Republican Senate.</p>
      <ul>${paths}</ul>
      <h3>2. Starting odds from history</h3>
      <p>For each route, the starting odds are the share of past Texas promises on that route that were kept (a partly kept promise counts as half). Promises made under split control count twice. Each route is blended with a prior rate (weight of two records) so that thin history does not swing the result. Routes Texas history barely covers, such as acts of Congress, lean on that prior.</p>
      <h3>3. Adjustments</h3>
      <p>Each promise's odds then shift on the log-odds scale for: the GOP Senate's likely stance, legal risk, fiscal cost and public appeal. The scenario sliders scale those shifts. Results are capped between 3% and 95%, because nothing in politics is certain.</p>
      <h3>4. Rolling up the agenda</h3>
      <p>Promises are grouped into themes. A theme's likelihood is the odds of its headline promise, with a small boost for each additional leader who made it a major priority. The most achievable step is shown separately, because a smaller move, such as auditing vouchers, can succeed even when the headline goal, repealing them, stalls.</p>
      <h3>Limits</h3>
      <p>Election results are unofficial as of ${fmtDate(D.ASOF)}. Ratings for Senate stance, legal risk, cost and appeal are editorial judgments, not polling, and are easy to change in <code>data.js</code>. Treat the percentages as a structured way to argue about the session, not as predictions of record.</p>
    </div>`;
  }

  // ---- Router -------------------------------------------------------------------
  function currentView() {
    const h = location.hash.replace("#", "");
    return VIEWS.includes(h) ? h : "agenda";
  }
  function render() {
    const v = currentView();
    document.querySelectorAll("#tabs a").forEach((a) => {
      if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const res = run();
    if (v === "agenda") renderAgenda(res);
    else if (v === "promises") renderPromises(res);
    else if (v === "history") renderHistory(res);
    else renderMethod();
  }

  ["#s-senate", "#s-fiscal", "#s-courts", "#s-congress"].forEach((id) => $(id).addEventListener("input", render));
  ["#s-ltgov", "#s-federal"].forEach((id) => $(id).addEventListener("change", render));
  $("#reset").addEventListener("click", () => {
    ["#s-senate", "#s-fiscal", "#s-courts", "#s-congress"].forEach((id) => { $(id).value = 0; });
    $("#s-ltgov").checked = true; $("#s-federal").checked = true;
    render();
  });
  window.addEventListener("hashchange", render);

  renderPower();
  render();
})();
