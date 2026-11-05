# Texas Agenda Forecaster

A browser app that projects a 2027–28 agenda for Texas from the promises of the
Democrats elected statewide on Nov. 3, 2026, and estimates how likely each item is
to happen with a Democratic governor and House and a Republican Senate.

Open `index.html` in a browser. No build step or server is needed.

## What it does

- **Projected agenda**: promises from Gov.-elect Gina Hinojosa, Lt. Gov.-elect Vikki
  Goodwin, AG-elect Nathan Johnson, Comptroller-elect Sarah Eckhardt and
  Sen.-elect James Talarico grouped into themes and ordered by phase: day one,
  first year, the 90th Legislature (opens Jan. 12, 2027) and the longer horizon.
- **Likelihoods**: each promise is tagged with the route it must travel (executive
  action, new law, budget, two-thirds Senate vote, constitutional amendment, act of
  Congress, and so on). Starting odds for each route come from Texas's own record of
  kept and broken promises since 1983 (the **Track record** tab), then shift for the
  GOP Senate's likely stance, legal risk, cost and public appeal.
- **Scenario sliders**: test a deal-making vs. blockading Senate, the Senate
  stripping the lieutenant governor's powers, budget conditions, courts and Congress.
- **New declarations**: add a promise in the **Promises** tab and it is scored and
  placed in the agenda right away (stored in your browser). Use "Copy my additions as
  JSON" and paste into `data.js` to make them permanent.

## Files

| File | Contents |
| --- | --- |
| `data.js` | Election results, leaders, promises with source links, historical baseline |
| `model.js` | Scoring model (works in the browser and in Node) |
| `app.js` | Interface |
| `styles.css` | Styles, light and dark themes |

## Keeping it current

Results are unofficial as of Nov. 5, 2026. Update `POWER` in `data.js` once the
House count and the speaker race settle, and add promises to `PROMISES` as the
leaders file bills and release budget proposals. Factor ratings are editorial
judgments, not polling; change them where better evidence exists.

Quick check of the model from the command line:

```sh
node -e 'const D=require("./data.js"),M=require("./model.js");for(const i of M.buildAgenda(D,{}).items)console.log(Math.round(i.p*100)+"%",i.label)'
```
