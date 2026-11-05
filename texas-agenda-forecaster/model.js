/*
 * Texas Agenda Forecaster: likelihood model.
 *
 * 1. Base rate per pathway, learned from the HISTORY records. Records made under
 *    split control count double, because January 2027 is split (Democratic
 *    governor and House, Republican Senate). Thin history is blended with a prior.
 * 2. Each promise's factors shift that base rate on the log-odds scale.
 * 3. Scenario sliders scale those shifts.
 * 4. Promises roll up into agenda themes; several leaders or several routes
 *    toward one goal raise the theme's odds.
 */
(function (root) {
  const OUTCOME_SCORE = { kept: 1, partial: 0.5, broken: 0 };

  // Prior success rates used where Texas history is thin (blended, weight PRIOR_WEIGHT).
  // Rough figures informed by comparative research on pledge fulfilment, which finds
  // governing parties keep most pledges under unified control and far fewer under
  // divided control.
  const PRIORS = {
    executive: 0.55, agency: 0.8, veto: 0.8, statute: 0.5, budget: 0.6,
    supermajority: 0.35, constitutional: 0.3, federal: 0.3, oversight: 0.7,
  };
  const PRIOR_WEIGHT = 2;
  const SPLIT_WEIGHT = 2;

  const W = {
    senate: { support: 0.9, mixed: 0, oppose: -1.8 },
    legal:  { low: 0, med: -0.4, high: -1.2 },
    cost:   { low: 0, med: -0.25, high: -0.6 },
    appeal: { low: -0.4, med: 0, high: 0.4 },
  };

  const DEFAULT_SCENARIO = {
    senateCoop: 0,   // -1 GOP Senate blocks everything ... +1 deal-making Senate
    ltGovPowers: 1,  // 1 Goodwin keeps traditional powers, 0 Senate GOP strips them
    fiscal: 0,       // -1 tight budget ... +1 large surplus
    courts: 0,       // -1 hostile courts ... +1 deferential courts
    congress: 0,     // -1 gridlock / vetoes ... +1 bipartisan deals
  };

  const logit = (p) => Math.log(p / (1 - p));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  function baseRates(history) {
    const out = {};
    for (const key of Object.keys(PRIORS)) {
      let num = 0, den = 0, n = 0;
      for (const h of history) {
        if (h.pathway !== key) continue;
        const w = h.control === "split" ? SPLIT_WEIGHT : 1;
        num += w * OUTCOME_SCORE[h.outcome];
        den += w;
        n += 1;
      }
      const rate = (num + PRIORS[key] * PRIOR_WEIGHT) / (den + PRIOR_WEIGHT);
      out[key] = { rate, n, raw: den ? num / den : null, prior: PRIORS[key] };
    }
    return out;
  }

  // Returns { p, base, factors: [{label, delta}] } for one promise.
  function scorePromise(promise, data, scenario, rates) {
    const s = Object.assign({}, DEFAULT_SCENARIO, scenario || {});
    const path = data.PATHWAYS[promise.pathway];
    const base = rates[promise.pathway].rate;
    const factors = [];
    const add = (label, delta) => { if (Math.abs(delta) > 0.001) factors.push({ label, delta }); };

    if (path.needsSenate) {
      add("GOP Senate stance: " + promise.senate, W.senate[promise.senate] || 0);
      add("Senate cooperation scenario", 0.8 * s.senateCoop);
      if (promise.senate !== "oppose") {
        add(s.ltGovPowers ? "Lt. governor controls Senate committees" : "Senate GOP strips lt. governor's powers",
            s.ltGovPowers ? 0.3 : -0.5);
      }
      add("Democratic House passes it", 0.2);
    }
    if (promise.pathway === "veto" && promise.senate === "oppose") {
      add("Budget standoff risk", -0.3 * (1 - s.senateCoop));
    }

    const legal = W.legal[promise.legal] || 0;
    add("Legal risk: " + promise.legal, legal * (1 - 0.4 * s.courts));

    const cost = W.cost[promise.cost] || 0;
    add("Fiscal cost: " + promise.cost, cost * (1 - 0.5 * s.fiscal));

    add("Public appeal: " + promise.appeal, W.appeal[promise.appeal] || 0);

    if (promise.pathway === "federal") add("Congress scenario", 0.8 * s.congress);
    if (promise.pathway === "oversight") add("Congress scenario", 0.3 * s.congress);

    const x = logit(base) + factors.reduce((a, f) => a + f.delta, 0);
    return { p: clamp(sigmoid(x), 0.03, 0.95), base, factors };
  }

  const PHASE_ORDER = ["day-one", "first-year", "session", "long-term"];

  // Roll promises up into agenda items.
  function buildAgenda(data, scenario, promises) {
    const rates = baseRates(data.HISTORY);
    const scored = (promises || data.PROMISES).map((pr) =>
      Object.assign({}, pr, scorePromise(pr, data, scenario, rates)));

    const byTheme = new Map();
    for (const pr of scored) {
      if (!byTheme.has(pr.theme)) byTheme.set(pr.theme, []);
      byTheme.get(pr.theme).push(pr);
    }

    const items = [];
    for (const [theme, list] of byTheme) {
      const order = (pr) => data.LEADERS.findIndex((l) => l.id === pr.leader);
      // Headline goal: the most emphasized promise, governor's version first on ties.
      const headline = list.slice().sort((a, b) => b.priority - a.priority || order(a) - order(b))[0];
      // Most achievable step toward the theme, which may be a smaller move.
      const best = list.reduce((a, b) => (b.p > a.p ? b : a));
      const leaders = [...new Set(list.map((pr) => pr.leader))];
      // Each additional leader championing the theme adds a modest push.
      const backers = new Set(list.filter((pr) => pr.priority >= 2).map((pr) => pr.leader)).size;
      const p = clamp(sigmoid(logit(headline.p) + 0.2 * Math.max(0, backers - 1)), 0.03, 0.95);
      const priority = list.reduce((a, pr) => a + pr.priority, 0) + (leaders.length - 1);
      const phase = PHASE_ORDER.find((ph) => list.some((pr) => pr.when === ph)) || "session";
      const level = list.every((pr) => data.LEADERS.find((l) => l.id === pr.leader).level === "federal")
        ? "federal" : "state";
      items.push({
        theme, label: data.THEMES[theme] || theme, p, priority, leaders, phase, level,
        headline, best, promises: list.sort((a, b) => b.p - a.p),
      });
    }
    items.sort((a, b) =>
      PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase) ||
      b.priority * b.p - a.priority * a.p);
    return { items, scored, rates };
  }

  function band(p) {
    if (p >= 0.65) return { key: "likely", label: "Likely" };
    if (p >= 0.4) return { key: "tossup", label: "Toss-up" };
    if (p >= 0.2) return { key: "uphill", label: "Uphill" };
    return { key: "longshot", label: "Long shot" };
  }

  const MODEL = { PRIORS, W, DEFAULT_SCENARIO, PHASE_ORDER, baseRates, scorePromise, buildAgenda, band };
  if (typeof module !== "undefined" && module.exports) module.exports = MODEL;
  else root.TX_MODEL = MODEL;
})(typeof window !== "undefined" ? window : globalThis);
