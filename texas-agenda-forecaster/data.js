/*
 * Texas Agenda Forecaster: source data.
 *
 * Election results are UNOFFICIAL election-night and day-after reporting for the
 * Nov. 3, 2026 general election, compiled Nov. 5, 2026. Promise records are the
 * leaders' own campaign or post-election declarations as reported by the outlets
 * linked in each record. The factor ratings (senate stance, legal risk, cost,
 * public appeal) are editorial estimates made for this model. They are not polling
 * data. Change them here or in the app as better information arrives.
 */
(function (root) {
  const ASOF = "2026-11-05";

  // ---- Who holds power in January 2027 -------------------------------------
  const POWER = {
    asOf: ASOF,
    session: {
      name: "90th Texas Legislature, regular session",
      opens: "2027-01-12",
      days: 140,
      inauguration: "2027-01-19",
    },
    house: {
      seats: 150, dem: 80, gop: 64, uncalled: 6, majority: 76, twoThirds: 100,
      note: "Unofficial. Tallies ranged from 80-64 with 6 uncalled to a possible 84-66. Speaker race open (Senfronia Thompson and Joe Moody reported as candidates).",
    },
    senate: {
      seats: 31, dem: 12, gop: 19, majority: 16, fiveNinths: 18, twoThirds: 21,
      note: "Republicans held the chamber. Nathan Johnson's and Sarah Eckhardt's Senate seats will be filled by special election. Because the lieutenant governor's powers come largely from Senate rules, the GOP majority could rewrite those rules.",
    },
    courts: {
      note: "Democrats were reported to have won all four Texas Supreme Court seats on the ballot, which still leaves a Republican majority on the nine-member court.",
    },
    federal: {
      note: "Democrats were projected to win control of the U.S. Senate. A Republican president keeps the veto.",
    },
  };

  // ---- Leaders --------------------------------------------------------------
  const LEADERS = [
    { id: "hinojosa", name: "Gina Hinojosa", office: "Governor", level: "state",
      result: "Defeated Gov. Greg Abbott, about 52.8% to 45.7% (unofficial)",
      blurb: "First Democratic governor elected since 1990. Ran on public schools, cost of living and ending what she called the \"Greg Abbott corruption tax.\" Says she will build a \"postpartisan\" administration." },
    { id: "goodwin", name: "Vikki Goodwin", office: "Lieutenant Governor", level: "state",
      result: "Defeated Lt. Gov. Dan Patrick (unofficial)",
      blurb: "First woman to hold the office. Presides over a Republican Senate, where her power to appoint committees and refer bills depends on the Senate's rules." },
    { id: "johnson", name: "Nathan Johnson", office: "Attorney General", level: "state",
      result: "Defeated Mayes Middleton by about 6 points (unofficial)",
      blurb: "Pitched a \"back to basics\" office after 12 years under Ken Paxton. Expected to use the office against Trump administration actions." },
    { id: "eckhardt", name: "Sarah Eckhardt", office: "Comptroller", level: "state",
      result: "Defeated Comptroller Don Huffines by about 5 points (unofficial)",
      blurb: "Voucher opponent who will oversee the new $1 billion education savings account program and has vowed to audit it." },
    { id: "talarico", name: "James Talarico", office: "U.S. Senator", level: "federal",
      result: "Defeated Ken Paxton, about 55.1% to 43.0% (unofficial)",
      blurb: "First Texas Democrat elected to the U.S. Senate in decades. Ran on cost of living, anti-corruption and health care." },
  ];

  // ---- Pathways: how a promise becomes reality ------------------------------
  // needsSenate: the GOP state Senate can block it.
  // needsHouse: the Democratic state House must pass it.
  const PATHWAYS = {
    executive:     { label: "Executive action", needsSenate: false, needsHouse: false,
                     detail: "The governor acts alone through an order, appointment or emergency declaration. Fast, but exposed to lawsuits and to the Legislature undoing it." },
    agency:        { label: "Own-office action", needsSenate: false, needsHouse: false,
                     detail: "A statewide officer (AG, comptroller) uses powers the office already has." },
    veto:          { label: "Veto / line-item veto", needsSenate: false, needsHouse: false,
                     detail: "The governor strikes a bill or a budget line. Overriding takes two-thirds of both chambers, which neither party has." },
    statute:       { label: "New state law", needsSenate: true, needsHouse: true,
                     detail: "Simple majorities in both chambers plus the governor's signature. The GOP Senate is the gate." },
    budget:        { label: "State budget", needsSenate: true, needsHouse: true,
                     detail: "Must be written into the 2028-29 appropriations act, which both chambers have to pass." },
    supermajority: { label: "Two-thirds Senate vote", needsSenate: true, needsHouse: true,
                     detail: "Rainy Day Fund spending or confirmations that need 21 of 31 senators, so at least two Republicans must join." },
    constitutional:{ label: "Constitutional amendment", needsSenate: true, needsHouse: true,
                     detail: "Two-thirds of both chambers (100 House, 21 Senate), then a majority of voters." },
    federal:       { label: "Act of Congress", needsSenate: false, needsHouse: false,
                     detail: "Needs both houses of Congress and a president of the other party, or 60 Senate votes for most bills." },
    oversight:     { label: "Federal oversight", needsSenate: false, needsHouse: false,
                     detail: "Hearings, investigations and letters a senator in the majority can drive without passing a law." },
  };

  // ---- Agenda themes (promises from different leaders roll up here) --------
  const THEMES = {
    "fuel-tax":        "Fuel tax relief",
    "power-bills":     "Electricity bills",
    "teacher-pay":     "Teacher pay & school funding",
    "testing":         "Testing & accountability",
    "takeovers":       "School takeovers",
    "vouchers":        "Private school vouchers",
    "rebate":          "Taxpayer rebate",
    "data-centers":    "AI data centers",
    "water":           "Water supply",
    "grocery":         "Grocery prices",
    "property-tax":    "Property tax & subsidies",
    "medicaid":        "Health coverage",
    "thc":             "Hemp / THC rules",
    "housing":         "Rent & housing",
    "abortion":        "Abortion law",
    "ag-office":       "Attorney general's office",
    "federal-suits":   "State vs. federal government",
    "ethics":          "Ethics & elections",
    "veterans":        "Veterans' care",
    "immigration":     "Immigration enforcement",
  };

  // Ratings
  //   senate: "support" | "mixed" | "oppose" | "n/a"  (expected GOP Senate posture)
  //   legal:  "low" | "med" | "high"                  (risk a court blocks it)
  //   cost:   "low" | "med" | "high"                  (fiscal size)
  //   appeal: "low" | "med" | "high"                  (breadth of public / bipartisan appeal)
  //   priority: 1-3, how central the leader made it (3 = headline promise)
  const SRC = {
    sa100:  { label: "San Antonio Express-News: Hinojosa's first 100 days", url: "https://www.mysanantonio.com/news/local/article/gina-hinojosa-texas-governor-issues-22512422.php" },
    saGoals:{ label: "San Antonio Express-News: Hinojosa's goals", url: "https://www.mysanantonio.com/news/local/article/gina-hinojosa-texas-22513906.php" },
    ttGov:  { label: "Texas Tribune: How will Hinojosa govern?", url: "https://www.texastribune.org/2026/11/04/gina-hinojosa-texas-democrat-governor/" },
    ttSplit:{ label: "Texas Tribune: What divided government could look like", url: "https://www.texastribune.org/2026/10/30/texas-governor-power-2026-greg-abbott-gina-hinojosa-split-government/" },
    ttEdu:  { label: "Texas Tribune: How K-12 policy could change", url: "https://www.texastribune.org/2026/11/05/texas-dems-vowed-seismic-education-change-heres-how-schools-could-change-for-millions-of-students/" },
    hcGov:  { label: "Houston Chronicle: How Hinojosa could wield power", url: "https://www.houstonchronicle.com/politics/texas/article/gina-hinojosa-policies-22512284.php" },
    campaign:{ label: "ginafortexas.com", url: "https://ginafortexas.com/" },
    vgPri:  { label: "vikkigoodwin.com: Priorities", url: "https://www.vikkigoodwin.com/priorities" },
    ksatMeet:{ label: "KSAT: Meet the Democrats who'll run Texas", url: "https://www.ksat.com/news/texas/2026/11/04/meet-vikki-goodwin-nathan-johnson-and-the-other-democrats-wholl-run-texas/" },
    kprcVG: { label: "KPRC: 10 things to know about Vikki Goodwin", url: "https://www.click2houston.com/news/local/2026/11/04/10-things-to-know-about-vikki-goodwin-texas-lieutenant-governor-elect/" },
    dmnDems:{ label: "Dallas Morning News: Democrats' wins and GOP programs", url: "https://www.dallasnews.com/news/politics/article/democrats-wins-lead-attack-republican-programs-22511251.php" },
    ttAG:   { label: "Texas Tribune: 2026 attorney general race", url: "https://www.texastribune.org/2026/10/05/texas-attorney-general-election-2026-candidates-mayes-middleton-nathan-johnson-tom-oxford/" },
    ksatTal:{ label: "KSAT: Talarico on his priorities", url: "https://ksat.com/news/local/2026/11/02/exclusive-james-talarico-talks-us-senate-race-san-antonio-roots-and-priorities-ahead-of-election-day/" },
    ttTal:  { label: "Texas Tribune: Talarico's Senate bid", url: "https://www.texastribune.org/2025/09/09/james-talarico-texas-senate-democrat-primary" },
    tprVet: { label: "Texas Public Radio: Talarico's veterans plan", url: "https://www.tpr.org/military-veterans-issues/2026-08-14/james-talarico-pushes-new-plan-to-woo-texas-veterans-pledges-to-fight-for-them-the-way-they-fight-for-us" },
    kxan27: { label: "KXAN: What a split Legislature means for 2027", url: "https://www.kxan.com/news/texas-politics/post-election-2027-legislative-session-preview/" },
  };

  const PROMISES = [
    // Hinojosa
    { id: "h-fuel", leader: "hinojosa", theme: "fuel-tax", priority: 3, when: "day-one",
      title: "Declare a high-cost emergency and suspend the state gas and diesel tax",
      detail: "Promised \"within an hour of taking the oath.\" The disaster statute lets a governor suspend regulatory laws, but suspending a tax by order is untested and likely to be challenged.",
      pathway: "executive", senate: "n/a", legal: "high", cost: "med", appeal: "high", sources: ["sa100", "saGoals"] },
    { id: "h-power", leader: "hinojosa", theme: "power-bills", priority: 3, when: "day-one",
      title: "Freeze electricity rates by emergency order",
      detail: "Paired with the fuel tax order. Most Texans buy power in a competitive retail market, so a freeze would run through the PUC and face challenges from retail providers.",
      pathway: "executive", senate: "n/a", legal: "high", cost: "med", appeal: "high", sources: ["sa100"] },
    { id: "h-morath", leader: "hinojosa", theme: "takeovers", priority: 2, when: "day-one",
      title: "Replace Education Commissioner Mike Morath",
      detail: "Removing him is within reach. A permanent successor needs Senate confirmation, so an interim pick may serve for some time.",
      pathway: "executive", senate: "n/a", legal: "low", cost: "low", appeal: "med", sources: ["sa100", "saGoals"] },
    { id: "h-takeover", leader: "hinojosa", theme: "takeovers", priority: 2, when: "first-year",
      title: "Reverse state takeovers of local school districts",
      detail: "Takeovers such as Houston ISD's are run by the education commissioner, so a new commissioner could begin returning control without new law.",
      pathway: "executive", senate: "n/a", legal: "med", cost: "low", appeal: "med", sources: ["sa100", "ttEdu"] },
    { id: "h-teacher", leader: "hinojosa", theme: "teacher-pay", priority: 3, when: "session",
      title: "Raise teacher pay",
      detail: "Teacher raises passed with bipartisan votes in 2025, so the question is size, not direction. Needs room in the 2028-29 budget.",
      pathway: "budget", senate: "mixed", legal: "low", cost: "high", appeal: "high", sources: ["sa100", "saGoals"] },
    { id: "h-staar", leader: "hinojosa", theme: "testing", priority: 2, when: "session",
      title: "End STAAR testing",
      detail: "Replacing or shrinking STAAR drew interest from both parties in 2025. Federal law still requires annual testing, so expect a replacement rather than no test.",
      pathway: "statute", senate: "mixed", legal: "low", cost: "low", appeal: "high", sources: ["sa100", "ttEdu"] },
    { id: "h-voucher-repeal", leader: "hinojosa", theme: "vouchers", priority: 3, when: "session",
      title: "Repeal the private school voucher program",
      detail: "The 2025 education savings account law was a top Republican priority. Repeal must pass the GOP Senate.",
      pathway: "statute", senate: "oppose", legal: "low", cost: "low", appeal: "med", sources: ["saGoals", "dmnDems"] },
    { id: "h-voucher-veto", leader: "hinojosa", theme: "vouchers", priority: 2, when: "session",
      title: "Strike voucher funding with the line-item veto",
      detail: "The Tribune notes she could line-item veto budget items. Republicans could respond by holding the rest of the budget hostage or funding the program another way.",
      pathway: "veto", senate: "oppose", legal: "med", cost: "low", appeal: "med", sources: ["ttSplit"] },
    { id: "h-rebate", leader: "hinojosa", theme: "rebate", priority: 3, when: "session",
      title: "Send every Texan a one-time $1,500 check from the Rainy Day Fund",
      detail: "Spending from the Economic Stabilization Fund this way needs two-thirds of the Senate (21 votes), so at least two Republicans.",
      pathway: "supermajority", senate: "mixed", legal: "low", cost: "high", appeal: "high", sources: ["saGoals"] },
    { id: "h-datacenter", leader: "hinojosa", theme: "data-centers", priority: 2, when: "day-one",
      title: "Impose an immediate moratorium on new AI data centers",
      detail: "Texas has no clear authority for a governor to halt private construction statewide. The durable route is legislation on water and grid use.",
      pathway: "executive", senate: "n/a", legal: "high", cost: "low", appeal: "med", sources: ["saGoals"] },
    { id: "h-grocery", leader: "hinojosa", theme: "grocery", priority: 1, when: "session",
      title: "Ban surveillance pricing on groceries",
      detail: "Bars stores from setting prices for individual shoppers based on their personal data. New legal ground in Texas, but it reads as consumer protection rather than party politics.",
      pathway: "statute", senate: "mixed", legal: "med", cost: "low", appeal: "high", sources: ["saGoals"] },
    { id: "h-subsidies", leader: "hinojosa", theme: "property-tax", priority: 2, when: "session",
      title: "End corporate subsidies and put the money toward property tax bills",
      detail: "Property tax relief is a shared goal. Cutting business incentive programs to pay for it will meet resistance from business groups and many senators.",
      pathway: "statute", senate: "mixed", legal: "low", cost: "med", appeal: "high", sources: ["saGoals", "hcGov"] },

    // Goodwin
    { id: "g-school", leader: "goodwin", theme: "teacher-pay", priority: 3, when: "session",
      title: "Increase public school funding and teacher pay",
      detail: "Her signature issue. As presiding officer she can steer school finance bills through Senate committees, if the Senate's rules leave her that power.",
      pathway: "budget", senate: "mixed", legal: "low", cost: "high", appeal: "high", sources: ["vgPri", "kprcVG"] },
    { id: "g-medicaid", leader: "goodwin", theme: "medicaid", priority: 2, when: "session",
      title: "Expand Medicaid and create a statewide health program",
      detail: "Texas is one of the few states that never expanded Medicaid. GOP senators have blocked expansion for more than a decade.",
      pathway: "statute", senate: "oppose", legal: "low", cost: "high", appeal: "med", sources: ["ksatMeet"] },
    { id: "g-water", leader: "goodwin", theme: "water", priority: 2, when: "session",
      title: "Invest in water infrastructure and water recycling",
      detail: "Water is one of the few issues with strong rural Republican support. Her fight is over who gets the water, families or data centers.",
      pathway: "budget", senate: "support", legal: "low", cost: "high", appeal: "high", sources: ["vgPri", "kprcVG"] },
    { id: "g-thc", leader: "goodwin", theme: "thc", priority: 1, when: "session",
      title: "Regulate THC with age limits, testing and labeling",
      detail: "A regulate-not-ban middle path. Senate Republicans pushed a full ban in 2025, but Abbott vetoed it and regulated by order instead.",
      pathway: "statute", senate: "mixed", legal: "low", cost: "low", appeal: "high", sources: ["kprcVG"] },
    { id: "g-rent", leader: "goodwin", theme: "housing", priority: 1, when: "session",
      title: "Pass the Fair Rent Incentive Act",
      detail: "A renter affordability bill she has championed. The details will decide whether it reads as an incentive or a mandate.",
      pathway: "statute", senate: "mixed", legal: "low", cost: "med", appeal: "med", sources: ["kprcVG"] },
    { id: "g-abortion", leader: "goodwin", theme: "abortion", priority: 2, when: "long-term",
      title: "Repeal the state's abortion ban",
      detail: "Would need the GOP Senate. Supporters may turn to a ballot initiative, but Texas has none, so even a constitutional route needs 21 senators.",
      pathway: "statute", senate: "oppose", legal: "low", cost: "low", appeal: "med", sources: ["kprcVG"] },

    // Johnson
    { id: "j-basics", leader: "johnson", theme: "ag-office", priority: 3, when: "first-year",
      title: "Return the attorney general's office to \"back to basics\" work",
      detail: "Consumer protection, child support and open-government rulings, with less political litigation. This is within his own office's control.",
      pathway: "agency", senate: "n/a", legal: "low", cost: "low", appeal: "high", sources: ["ttAG", "ksatMeet"] },
    { id: "j-federal", leader: "johnson", theme: "federal-suits", priority: 2, when: "first-year",
      title: "Challenge Trump administration actions in court",
      detail: "Filing is in his control. Winning depends on federal courts. The rating reflects bringing and sustaining the cases, not winning every one.",
      pathway: "agency", senate: "n/a", legal: "med", cost: "low", appeal: "med", sources: ["dmnDems"] },

    // Eckhardt
    { id: "e-audit", leader: "eckhardt", theme: "vouchers", priority: 3, when: "first-year",
      title: "Audit the $1 billion voucher program",
      detail: "The comptroller administers the program, so an audit is squarely within her power. What follows from its findings is a separate fight.",
      pathway: "agency", senate: "n/a", legal: "low", cost: "low", appeal: "high", sources: ["dmnDems", "ksatMeet"] },

    // Talarico (federal track)
    { id: "t-fuel", leader: "talarico", theme: "fuel-tax", priority: 3, when: "long-term",
      title: "Suspend federal gas and diesel taxes",
      detail: "Federal gas tax holidays have been proposed before and stalled. A Democratic Senate helps, but it still needs the House and the president.",
      pathway: "federal", senate: "n/a", legal: "low", cost: "med", appeal: "high", sources: ["ksatTal"] },
    { id: "t-stocks", leader: "talarico", theme: "ethics", priority: 2, when: "long-term",
      title: "Ban stock trading by members of Congress",
      detail: "Popular in both parties and repeatedly proposed. It has stalled over details and leadership reluctance.",
      pathway: "federal", senate: "n/a", legal: "low", cost: "low", appeal: "high", sources: ["ksatTal", "ttTal"] },
    { id: "t-pacs", leader: "talarico", theme: "ethics", priority: 2, when: "long-term",
      title: "Ban super PACs and corporate PACs",
      detail: "Runs into Citizens United. Realistically requires a constitutional amendment or a change at the Supreme Court.",
      pathway: "federal", senate: "n/a", legal: "high", cost: "low", appeal: "med", sources: ["ksatTal"] },
    { id: "t-gerry", leader: "talarico", theme: "ethics", priority: 2, when: "long-term",
      title: "End partisan gerrymandering",
      detail: "National redistricting standards have failed in Congress before. Texas's 2025 mid-decade map fight raised the issue's profile.",
      pathway: "federal", senate: "n/a", legal: "med", cost: "low", appeal: "med", sources: ["ksatTal"] },
    { id: "t-vets", leader: "talarico", theme: "veterans", priority: 2, when: "long-term",
      title: "Expand VA telemedicine and the mental health workforce",
      detail: "Veterans' care is one of the most bipartisan areas in Congress, and pieces can ride on the annual defense or VA bills.",
      pathway: "federal", senate: "n/a", legal: "low", cost: "med", appeal: "high", sources: ["tprVet"] },
    { id: "t-ice", leader: "talarico", theme: "immigration", priority: 1, when: "first-year",
      title: "Investigate ICE and require agents to identify themselves",
      detail: "Oversight hearings are achievable in a Democratic Senate. An identification mandate would need a law the president signs.",
      pathway: "oversight", senate: "n/a", legal: "low", cost: "low", appeal: "med", sources: ["ksatTal"] },
  ];

  // ---- Historical baseline: Texas governors' and leaders' promises ----------
  // control: "unified"  = governor's party held both chambers
  //          "split"    = at least one chamber held by the other party, or the
  //                       presiding officer of a chamber opposed the promise
  // outcome: "kept" | "partial" | "broken"
  const HISTORY = [
    { who: "Mark White (D)", year: 1984, title: "Raise teacher pay and overhaul schools (HB 72, \"no pass, no play\")", pathway: "statute", control: "unified", outcome: "kept",
      note: "Passed in a 1984 special session with a tax increase." },
    { who: "Mark White (D)", year: 1983, title: "Make utility regulators elected rather than appointed", pathway: "statute", control: "unified", outcome: "broken",
      note: "The Public Utility Commission stayed appointed." },
    { who: "Ann Richards (D)", year: 1991, title: "Create a state lottery", pathway: "constitutional", control: "unified", outcome: "kept",
      note: "Voters approved the amendment in November 1991." },
    { who: "Ann Richards (D)", year: 1991, title: "Create an independent ethics commission", pathway: "constitutional", control: "unified", outcome: "kept",
      note: "The Texas Ethics Commission was approved by voters in 1991." },
    { who: "Ann Richards (D)", year: 1993, title: "Equalize school funding between rich and poor districts", pathway: "statute", control: "unified", outcome: "partial",
      note: "Voters rejected the amendment in May 1993; the Legislature then passed the \"Robin Hood\" recapture law." },
    { who: "Ann Richards (D)", year: 1991, title: "Reform auto and homeowners insurance regulation", pathway: "statute", control: "unified", outcome: "partial",
      note: "A reform package passed, weaker than she sought." },
    { who: "George W. Bush (R)", year: 1995, title: "Limit civil lawsuits (tort reform)", pathway: "statute", control: "split", outcome: "kept",
      note: "Passed by a Democratic Legislature in his first session." },
    { who: "George W. Bush (R)", year: 1995, title: "Toughen the juvenile justice system", pathway: "statute", control: "split", outcome: "kept",
      note: "Passed with Lt. Gov. Bob Bullock (D) as a key ally." },
    { who: "George W. Bush (R)", year: 1995, title: "Return more control to local school districts", pathway: "statute", control: "split", outcome: "kept",
      note: "The 1995 rewrite of the Education Code." },
    { who: "George W. Bush (R)", year: 1997, title: "Cut school property taxes by shifting to business and sales taxes", pathway: "statute", control: "split", outcome: "partial",
      note: "The tax swap died; lawmakers passed a smaller homestead exemption increase instead." },
    { who: "Rick Perry (R)", year: 2003, title: "Cap medical malpractice damages", pathway: "constitutional", control: "unified", outcome: "kept",
      note: "Proposition 12 passed narrowly." },
    { who: "Rick Perry (R)", year: 2006, title: "Cut school property taxes, offset by a new business margins tax", pathway: "statute", control: "unified", outcome: "kept",
      note: "Passed in a 2006 special session." },
    { who: "Rick Perry (R)", year: 2007, title: "Require HPV vaccination by executive order", pathway: "executive", control: "unified", outcome: "broken",
      note: "His own party's Legislature overrode the order." },
    { who: "Rick Perry (R)", year: 2002, title: "Build the Trans-Texas Corridor", pathway: "executive", control: "unified", outcome: "broken",
      note: "Abandoned in 2009 after rural opposition." },
    { who: "Greg Abbott (R)", year: 2015, title: "Fund high-quality pre-K", pathway: "budget", control: "unified", outcome: "partial",
      note: "Grant program created, then left unfunded in 2017." },
    { who: "Greg Abbott (R)", year: 2019, title: "School finance overhaul with property tax compression (HB 3)", pathway: "budget", control: "unified", outcome: "kept",
      note: "Passed with large bipartisan majorities." },
    { who: "Greg Abbott (R)", year: 2017, title: "Pass school vouchers (2017-2023 attempts)", pathway: "statute", control: "split", outcome: "broken",
      note: "The House, controlled by his own party but with a rural bloc opposed, blocked vouchers for years." },
    { who: "Greg Abbott (R)", year: 2025, title: "Pass school vouchers (SB 2)", pathway: "statute", control: "unified", outcome: "kept",
      note: "Passed after he backed primary challengers to House opponents." },
    { who: "Greg Abbott (R)", year: 2021, title: "Fund state border barrier construction", pathway: "budget", control: "unified", outcome: "kept",
      note: "Billions appropriated across sessions." },
    { who: "Greg Abbott (R)", year: 2020, title: "Override local pandemic rules by executive order", pathway: "executive", control: "unified", outcome: "partial",
      note: "Orders largely stood but were tied up in years of litigation." },
    { who: "Dan Patrick (R, Lt. Gov.)", year: 2017, title: "Pass the \"bathroom bill\"", pathway: "statute", control: "split", outcome: "broken",
      note: "Passed the Senate twice; Speaker Joe Straus's House refused." },
    { who: "Dan Patrick (R, Lt. Gov.)", year: 2025, title: "Ban consumable THC", pathway: "statute", control: "split", outcome: "broken",
      note: "Passed the Legislature; Abbott vetoed it." },
    { who: "Greg Abbott (R)", year: 2025, title: "Regulate THC sales by executive order after his veto", pathway: "executive", control: "split", outcome: "kept",
      note: "Ordered age-21 limits through state agencies." },
    { who: "Ann Richards (D)", year: 1993, title: "Expand prison capacity", pathway: "budget", control: "unified", outcome: "kept",
      note: "Voters approved prison bonds and capacity grew rapidly." },
  ];

  const DATA = { ASOF, POWER, LEADERS, PATHWAYS, THEMES, SRC, PROMISES, HISTORY };
  if (typeof module !== "undefined" && module.exports) module.exports = DATA;
  else root.TX_DATA = DATA;
})(typeof window !== "undefined" ? window : globalThis);
