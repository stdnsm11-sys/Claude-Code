# Hoop Vault: Pay-to-Win Simulator (educational)

A single-page simulation of the monetization tactics used in pay-to-win sports card modes (similar to the "MyTeam"-style modes that drew criticism for gambling-like design). Open `index.html` in any browser. You don't need to install anything.

**No real money is ever charged.** Every price is pretend; the **Reality Check** panel adds up what it *would* have cost.

## How to use it
1. Play for 5–10 minutes with **Teach Mode off**: open packs, play matches, spin the wheel, "buy" gems.
2. Flip the **🎓 Teach Mode** switch at the top. The game works exactly the same, but every time you do something:
   - the part of the screen using a trick glows yellow,
   - the **Teach panel** explains it in plain, short sentences written for students: *What happened*, *Why it works on your brain*, *Like a casino*, and *What you can do*,
   - each trick is labeled by its goal: **💸 Wants your money**, **⏳ Keeps you playing** or **🔁 Brings you back**,
   - a counter shows how many tricks you've spotted and how many times each was used on you.
   Tap any yellow tag to bring up its explanation again.
3. Open **📋 Debrief** to see your totals, the expected cost of a top card, every tactic (the ones you ran into are highlighted), real-world context and discussion questions.

## Tactics simulated
| Tactic | Where it shows up |
|---|---|
| Premium currency (Gems hide dollars) | Everything is priced in ◆ |
| Leftover-currency trap | Bundles (450/1,000/2,100…) never match pack prices (600/1,250) |
| Price anchoring / "Best Value" | Store ribbons, crossed-out "value" on the bundle |
| Loot boxes (paid random rewards) | Standard & Premium packs |
| Buried odds | Tiny grey "probability disclosure" link |
| Near-miss animations | Packs glow Diamond/Galaxy, then reveal Silver/Gold |
| Rigged first pull | The free welcome pack always has a Diamond |
| Early-win honeymoon | First 3 opponents are weak |
| Rubber-band matchmaking | Opponents scale to your team rating |
| Offers timed to losses | "SO CLOSE!" pack offer after a narrow loss |
| Fake urgency | Countdown resets at 0 and on reload |
| Tricky prize wheel | All 8 slices look equal, but the GALAXY card hits 0.2% of the time; the wheel often stops right next to it |
| Fabricated social proof | "Live Pulls" feed only shows jackpots |
| Power creep / seasons | Every 8 matches a new season makes your cards weaker |
| Engineered grind | ~40 wins to earn one pack with coins |
| Frictionless purchasing | One-tap buy, no confirmation |
| Sunk-cost / endowed progress | Collection bar toward an expensive set (with free progress to start) |
| Random match rewards | Win coins vary randomly (150–250) |
| Buy high, sell low | Quick-sell values are tiny compared with pack prices |
| Daily login streak | 7-day reward calendar that resets if you miss a day |
| Appointment mechanics | Free wheel spin refreshes once per day |

### Prize Arcade (🎰 tab): casino games inside the sports game
Bets use game coins; Gems can be exchanged for coins (◆ 100 → ● 1,000).

The Arcade and the Lucky Wheel are styled after the casino-style mini-games in the 2019 basketball-game controversy (purple/chrome neon look, 8-slice prize wheel with pack and coin icons, teal pachinko board with spinning bumpers and colored bins, a gem "Match 3" slot machine with a pull lever). They use Hoop Vault's own name, logo and fictional players, not any real game's or league's trademarks.

| Game | Tricks it demonstrates |
|---|---|
| **Slot machine** | Losses disguised as wins (0.5× payouts celebrated as "WIN!"), engineered near-misses (two jackpot symbols + one just off the line, shown far more often than chance), STOP buttons that do nothing (illusion of control), AUTO ×10 autoplay. Long-run payback ≈ 71%. |
| **Plinko** | "Aim" buttons that don't change anything, flashy 10× edge bins that are almost never hit (0.1%), "one peg from 10×" near-misses, DROP ×10. Long-run payback ≈ 79%. |
| **Roulette** | HOT/COLD number boards and "RED IS DUE!" messages (gambler's fallacy), a DOUBLE UP button after every loss (loss-chasing / Martingale), the green 0 house edge. Payback 97.3%. |
| **Across the Arcade** | Free welcome credits, BET MAX pre-selected, currency layering (dollars → gems → coins), celebration effects, house edge. The Reality Check tracks coins bet vs. paid back. |

Progress is saved in this browser only (localStorage). Use **Reset simulation** in the Debrief to start over.
