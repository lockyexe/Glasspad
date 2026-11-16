/* Glasspad businesses: buy real-world style small businesses that earn (or lose) money every day.
   Numbers are based on 2025–26 US small-business benchmarks (BizBuySell / BizQuest sale data and industry reports):
   revenue ranges, owner-earnings (SDE) margins, cost splits, sale multiples, manager salaries.
   Each business runs a daily P&L with fixed + variable costs, weekly and yearly seasonality, weather, random events,
   marketing with uncertain return, and a realistic exit (multiple of trailing earnings minus a 10% broker fee). */
(function (G) {
  'use strict';
  const Art = G.Art, Sim = G.Sim; if (!Art || !Art.hctx) return;
  const shade = Art.shade;
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f = n => (Math.round(n * 10) / 10).toString();
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
  const money = n => { const a = Math.abs(n), s = n < 0 ? '-$' : '$'; return a >= 1e6 ? s + (a / 1e6).toFixed(2) + 'M' : a >= 1e4 ? s + Math.round(a / 1e3) + 'K' : s + Math.round(a).toLocaleString('en-US'); };
  const full = n => (n < 0 ? '-$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-US');

  // ---------------- seasonality profiles: [Sun..Sat], [Jan..Dec] ----------------
  const SEAS = {
    food: [[1.25, .85, .88, .92, 1, 1.25, 1.35], [.9, .92, 1, 1, 1.03, 1.05, 1.05, 1.04, 1, 1, .98, 1.08]],
    coffee: [[.85, 1.08, 1.08, 1.05, 1.05, 1.02, .9], [1, 1, 1, .98, .97, .95, .93, .95, 1.02, 1.04, 1.04, 1.1]],
    night: [[.35, .2, .25, .4, 1.1, 2.4, 2.7], [.85, .9, 1, 1, 1.05, 1.05, 1.08, 1.05, 1, 1, .95, 1.15]],
    wash: [[1.35, .8, .85, .9, .95, 1.1, 1.45], [.85, .85, 1.05, 1.15, 1.1, 1.05, 1, 1, 1, 1, .95, .95]],
    laundry: [[1.35, .9, .9, .9, .95, 1, 1.25], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    gym: [[.7, 1.15, 1.12, 1.1, 1.08, .95, .8], [1.25, 1.12, 1.05, 1, .98, .92, .9, .92, 1.02, 1, .96, .88]],
    flat: [[.95, 1, 1, 1, 1, 1.02, 1.02], [.98, .98, 1, 1, 1.02, 1.04, 1.05, 1.04, 1, 1, 1, .99]],
    retail: [[.9, .95, .95, 1, 1, 1.15, 1.2], [.9, .92, .98, 1, 1.02, 1.05, 1.07, 1.05, 1, 1, 1.02, 1.2]],
    hotel: [[1.05, .82, .85, .9, 1, 1.25, 1.3], [.78, .82, .95, 1, 1.05, 1.22, 1.3, 1.25, 1, .98, .85, .88]],
    ecom: [[1, 1, 1, 1, 1, 1, 1], [.85, .82, .88, .9, .92, .9, .92, .95, .95, 1, 1.6, 1.55]],
    week: [[0, 1.2, 1.2, 1.2, 1.2, 1.2, 0], [1, 1, 1, 1, 1, .92, .88, .95, 1.02, 1, 1, .9]],
    shop6: [[0, 1.1, 1.1, 1.1, 1.1, 1.1, .6], [1, 1, 1.02, 1.02, 1, 1, 1, 1, 1, 1, 1, .98]],
    barber: [[.25, .55, 1.05, 1.05, 1.15, 1.35, 1.5], [1, 1, 1, 1, 1, 1.02, 1, 1.05, 1, 1, 1, 1.08]],
    dealer: [[.6, .85, .85, .9, .95, 1.15, 1.6], [.85, .95, 1.12, 1.05, 1.02, 1, 1, 1, .98, .98, .95, 1.1]]
  };

  // ---------------- 25 business types ----------------
  // rev: annual revenue range; sde: owner earnings (before paying a manager) as % of revenue;
  // mult: sale price as a multiple of SDE (storage and motels: of NOI, i.e. 1 / cap rate, real estate included);
  // mgr: what a manager costs per year so you can own it hands-off; cost: cogs / labor / rent share of revenue.
  const T = {
    coffee: { l: 'Coffee shop', ic: '☕', rev: [260e3, 620e3], sde: [.1, .18], mult: [1.6, 2.4], mgr: 48e3, cost: [.3, .33, .1], vol: .12, seas: 'coffee', ev: ['espresso', 'staff', 'review', 'badreview', 'inspection', 'rent', 'competitor'], n: ['Copper Cup', 'Morning Ritual', 'Bean Theory', 'Steam & Co', 'Daily Grind', 'Third Wave'], why: 'Independent café, regulars every morning.' },
    restaurant: { l: 'Sit-down restaurant', ic: '🍽️', rev: [850e3, 2.1e6], sde: [.06, .12], mult: [1.5, 2.5], mgr: 68e3, cost: [.32, .36, .08], vol: .14, seas: 'food', ev: ['walkin', 'staff', 'review', 'badreview', 'inspection', 'rent', 'competitor', 'lawsuit'], n: ['Olive & Ash', 'The Long Table', 'Marlowe\'s', 'Harbor Kitchen', 'Saffron Room'], why: 'Full-service, beer & wine license, 90 seats.' },
    pizza: { l: 'Pizzeria', ic: '🍕', rev: [420e3, 1.1e6], sde: [.12, .18], mult: [1.8, 2.6], mgr: 50e3, cost: [.29, .3, .08], vol: .13, seas: 'food', ev: ['oven', 'staff', 'review', 'badreview', 'inspection', 'rent', 'competitor'], n: ['Slice Republic', 'Brick Oven Bros', 'Nonna\'s', 'Crust & Co', 'Big Pie Pizza'], why: 'Takeout and delivery heavy, strong weekends.' },
    truck: { l: 'Food truck', ic: '🚚', rev: [130e3, 340e3], sde: [.15, .25], mult: [1.4, 2.2], mgr: 40e3, cost: [.3, .28, .05], vol: .2, seas: 'food', ev: ['truck', 'staff', 'review', 'permit', 'event', 'rain'], n: ['Taco Signal', 'Rolling Smash', 'Curbside Bao', 'Wheelhouse Eats'], why: 'Truck, permits and route included.' },
    bar: { l: 'Neighborhood bar', ic: '🍺', rev: [420e3, 1.2e6], sde: [.12, .2], mult: [1.6, 2.6], mgr: 55e3, cost: [.24, .28, .08], vol: .16, seas: 'night', ev: ['cooler', 'staff', 'review', 'fight', 'inspection', 'rent', 'event'], n: ['The Last Call', 'Copper Tap', 'Foxhole', 'Night Owl Tavern', 'Rusty Anchor'], why: 'Full liquor license, pool tables, sports nights.' },
    club: { l: 'Nightclub', ic: '🪩', rev: [1.1e6, 3.8e6], sde: [.12, .22], mult: [1.5, 2.5], mgr: 90e3, cost: [.22, .3, .1], vol: .3, seas: 'night', ev: ['sound', 'staff', 'celebrity', 'fight', 'license', 'rent', 'competitor'], n: ['VOLT', 'Prism', 'Midnight Room', 'Halo', 'Neon Garden'], why: 'Bottle service, DJ booth, 600 capacity.' },
    laundromat: { l: 'Laundromat', ic: '🧺', rev: [150e3, 480e3], sde: [.25, .38], mult: [3, 4.2], mgr: 30e3, cost: [.08, .14, .12], vol: .08, seas: 'laundry', ev: ['washer', 'washer', 'review', 'utility', 'rent', 'theft'], n: ['Spin City', 'Suds & Duds', 'Fresh Fold', 'Bubble Wash', 'Clean Cycle'], why: 'Mostly coin/card ops, attendant part-time.' },
    selfwash: { l: 'Self-serve car wash', ic: '🧽', rev: [120e3, 340e3], sde: [.35, .52], mult: [3.5, 5], mgr: 20e3, cost: [.12, .08, .0], vol: .2, seas: 'wash', ev: ['pump', 'rain', 'rain', 'drought', 'vandal', 'review'], n: ['Bay Wash', 'Shine Station', 'Coin Op Clean', 'Wand Wash'], why: '4 bays + vacuums, land owned.' },
    tunnelwash: { l: 'Express tunnel car wash', ic: '🚿', rev: [1.4e6, 3e6], sde: [.3, .42], mult: [5, 7.5], mgr: 85e3, cost: [.1, .22, .06], vol: .16, seas: 'wash', ev: ['brushes', 'rain', 'rain', 'members', 'competitor', 'drought', 'review'], n: ['Gloss Tunnel', 'Hydro Express', 'Rapid Shine', 'Wave Wash', 'Clean Lane'], why: 'Unlimited membership program, 2,000+ members.' },
    gas: { l: 'Gas station & store', ic: '⛽', rev: [1.6e6, 4e6], sde: [.05, .08], mult: [1.5, 2.6], mgr: 55e3, cost: [.78, .07, .03], vol: .07, seas: 'retail', ev: ['fuel', 'fuel', 'theft', 'pump', 'inspection', 'lottery', 'rent'], n: ['Corner Fuel', 'Route 9 Gas', 'Stop & Go', 'Mile Marker', 'Quick Fill'], why: 'Branded fuel, ~45k gallons a month + c-store.' },
    cstore: { l: 'Convenience store', ic: '🏪', rev: [600e3, 1.5e6], sde: [.07, .12], mult: [1.6, 2.4], mgr: 50e3, cost: [.68, .1, .06], vol: .07, seas: 'retail', ev: ['cooler', 'theft', 'lottery', 'inspection', 'rent', 'competitor'], n: ['Daily Mart', 'Corner Stop', '24 Seven', 'Block Market'], why: 'Beer & wine, lottery, ATM.' },
    barber: { l: 'Barbershop', ic: '💈', rev: [180e3, 450e3], sde: [.18, .28], mult: [1.6, 2.4], mgr: 45e3, cost: [.06, .45, .1], vol: .12, seas: 'barber', ev: ['staff', 'staff', 'review', 'badreview', 'rent'], n: ['Sharp Line', 'Fade District', 'Kings Cuts', 'The Chair', 'Clean Taper'], why: '6 chairs, booth renters + walk-ins.' },
    gym: { l: 'Gym', ic: '🏋️', rev: [260e3, 900e3], sde: [.18, .28], mult: [2.2, 3], mgr: 55e3, cost: [.03, .25, .18], vol: .05, seas: 'gym', ev: ['equipment', 'staff', 'review', 'members', 'rent', 'competitor'], n: ['Iron Temple', 'Forge Fitness', 'Rep Lab', 'Lift House', 'Pulse Gym'], why: 'Memberships auto-renew monthly, 900 members.' },
    vending: { l: 'Vending route', ic: '🥤', rev: [60e3, 210e3], sde: [.35, .5], mult: [2, 2.8], mgr: 25e3, cost: [.45, .08, .02], vol: .1, seas: 'flat', ev: ['vandal', 'machine', 'location', 'location'], n: ['Snack Route', 'Coin Drop Vending', 'Fizz Route'], why: '40 machines in offices and gyms.' },
    storage: { l: 'Self-storage facility', ic: '📦', rev: [300e3, 900e3], sde: [.55, .65], mult: [13.3, 16.7], mgr: 0, cost: [.02, .12, .0], vol: .02, seas: 'flat', ev: ['auction', 'roof', 'occupancy', 'tax'], n: ['Safe Keep Storage', 'Lock & Leave', 'Box Yard', 'Stash Space'], why: '350 units, ~88% occupied. Land and buildings included (priced on a ~6–7.5% cap rate).' },
    bakery: { l: 'Bakery', ic: '🥐', rev: [250e3, 700e3], sde: [.12, .18], mult: [1.7, 2.5], mgr: 46e3, cost: [.28, .34, .09], vol: .1, seas: 'coffee', ev: ['oven', 'staff', 'review', 'wholesale', 'rent'], n: ['Rise & Crumb', 'Golden Loaf', 'Butter Lane', 'Flour Child'], why: 'Retail counter + wholesale to 6 cafés.' },
    autorepair: { l: 'Auto repair shop', ic: '🔧', rev: [520e3, 1.2e6], sde: [.15, .22], mult: [2.2, 3.2], mgr: 72e3, cost: [.33, .3, .07], vol: .1, seas: 'shop6', ev: ['lift', 'staff', 'review', 'fleet', 'lawsuit'], n: ['Torque Bros', 'Precision Auto', 'Gearhead Garage', 'Lugnut Repair'], why: '5 bays, 2 lifts, ASE techs.' },
    liquor: { l: 'Liquor store', ic: '🍾', rev: [700e3, 2e6], sde: [.08, .12], mult: [2, 3], mgr: 50e3, cost: [.75, .07, .05], vol: .08, seas: 'retail', ev: ['theft', 'cooler', 'license', 'inspection', 'rent'], n: ['Top Shelf', 'Bottle Shop', 'Spirits & Co', 'Corner Cellar'], why: 'Package license, wine tastings Fridays.' },
    smoke: { l: 'Smoke & vape shop', ic: '💨', rev: [300e3, 900e3], sde: [.15, .22], mult: [1.6, 2.4], mgr: 42e3, cost: [.55, .12, .07], vol: .09, seas: 'retail', ev: ['regulation', 'theft', 'inspection', 'rent', 'competitor'], n: ['Cloud Nine', 'Haze Supply', 'Vapor Lane', 'Smoke Signal'], why: 'High-traffic strip mall location.' },
    ecom: { l: 'Online store (DTC brand)', ic: '🛒', rev: [300e3, 2e6], sde: [.15, .25], mult: [2.8, 3.6], mgr: 52e3, cost: [.38, .08, .03], vol: .18, seas: 'ecom', ev: ['ads', 'viral', 'stock', 'chargeback', 'platform'], n: ['Nightshift Apparel', 'Pawsome Supply', 'Glowkit', 'Trail Grain', 'Desk Hero'], why: 'Shopify store, 60% repeat customers, 3PL fulfillment.' },
    saas: { l: 'Software / SaaS', ic: '💻', rev: [150e3, 1.4e6], sde: [.3, .5], mult: [3, 4.5], mgr: 75e3, cost: [.08, .25, .02], vol: .03, seas: 'flat', ev: ['churn', 'bigclient', 'outage', 'growth'], n: ['Ledgerly', 'ShiftPilot', 'FormForge', 'Ping Desk', 'RoutePad'], why: 'B2B subscription, ~3% monthly churn.' },
    motel: { l: 'Roadside motel', ic: '🏨', rev: [700e3, 1.8e6], sde: [.25, .35], mult: [10, 12.5], mgr: 0, cost: [.1, .28, .0], vol: .1, seas: 'hotel', ev: ['hvac', 'staff', 'convention', 'badreview', 'review', 'tax'], n: ['Starlite Inn', 'Desert Rose Motel', 'Highway 66 Lodge', 'Blue Moon Motor Inn'], why: '42 rooms, pool, land and building included (priced on an ~8–10% cap rate).' },
    dealer: { l: 'Used car lot', ic: '🚗', rev: [2e6, 6e6], sde: [.03, .05], mult: [2, 2.6], mgr: 70e3, cost: [.86, .05, .02], vol: .25, seas: 'dealer', ev: ['repo', 'auction', 'staff', 'review', 'lawsuit'], n: ['Prime Auto Sales', 'Route One Motors', 'Value Lot', 'Drive Away Autos'], why: '60 cars on the lot, buy-here-pay-here financing.' },
    daycare: { l: 'Daycare center', ic: '🧸', rev: [420e3, 1.2e6], sde: [.15, .22], mult: [2.2, 3], mgr: 60e3, cost: [.08, .48, .1], vol: .03, seas: 'week', ev: ['staff', 'license', 'review', 'enroll', 'rent'], n: ['Little Sprouts', 'Sunny Steps', 'Tiny Explorers', 'Bright Beginnings'], why: 'Licensed for 80 kids, waitlist.' },
    burger: { l: 'Burger franchise', ic: '🍔', rev: [1e6, 2.1e6], sde: [.08, .12], mult: [2.5, 3.5], mgr: 62e3, cost: [.3, .3, .08], vol: .1, seas: 'food', ev: ['fryer', 'staff', 'review', 'inspection', 'royalty', 'competitor'], n: ['Smash Stack', 'Double Patty', 'Grill Republic', 'Flame Burger'], why: 'Drive-thru, franchise royalties (5%) already in the numbers.' }
  };
  const KEYS = Object.keys(T);
  KEYS.forEach(k => T[k].ev = T[k].ev.concat(['regulars', 'priceup', 'vendor']));

  // ---------------- random events (real things that hit small businesses) ----------------
  // c: one-time cash hit (fraction of a day's revenue or $ range), m: revenue multiplier for d days, perm: permanent margin change
  const EV = {
    espresso: { ic: '🔧', t: 'Espresso machine broke — repair', cost: [1800, 6500] },
    walkin: { ic: '🧊', t: 'Walk-in cooler failed, food tossed', cost: [3500, 14000] },
    oven: { ic: '🔥', t: 'Oven needs a new burner', cost: [1500, 7000] },
    truck: { ic: '🛞', t: 'Truck in the shop — closed', cost: [2000, 9000], m: 0, d: [3, 8] },
    cooler: { ic: '🧊', t: 'Cooler compressor replaced', cost: [2500, 8000] },
    sound: { ic: '🔊', t: 'Sound system blew', cost: [6000, 30000] },
    washer: { ic: '🌀', t: 'Washer bearings went — repair', cost: [800, 3500] },
    pump: { ic: '🔧', t: 'Pump / equipment repair', cost: [1500, 9000] },
    brushes: { ic: '🧽', t: 'Tunnel brushes & conveyor service', cost: [6000, 28000] },
    equipment: { ic: '🏋️', t: 'Replaced worn cardio machines', cost: [6000, 25000] },
    machine: { ic: '🥤', t: 'Two machines replaced', cost: [2500, 7000] },
    lift: { ic: '🔧', t: 'Car lift inspection & repair', cost: [2000, 8000] },
    fryer: { ic: '🍟', t: 'Fryer replaced', cost: [3000, 9000] },
    hvac: { ic: '❄️', t: 'Rooftop AC unit replaced', cost: [9000, 26000] },
    roof: { ic: '🏚️', t: 'Roof patch on building C', cost: [7000, 30000] },
    staff: { ic: '👋', t: 'Key employee quit — service slower', m: .91, d: [7, 16] },
    review: { ic: '⭐', t: 'Viral 5-star review — more customers', m: 1.18, d: [15, 35] },
    regulars: { ic: '🔁', t: 'Word of mouth — more regulars', m: 1.07, d: [30, 70] },
    priceup: { ic: '🏷️', t: 'Raised prices a bit — customers barely noticed', perm: .007 },
    vendor: { ic: '🤝', t: 'Negotiated better supplier prices', perm: .005 },
    badreview: { ic: '👎', t: 'Bad reviews piling up', m: .93, d: [10, 20] },
    inspection: { ic: '📋', t: 'Health / safety inspection fine', cost: [500, 4500] },
    rent: { ic: '🏢', t: 'Landlord raised the rent', perm: -.006 },
    competitor: { ic: '🆕', t: 'New competitor opened nearby', m: .94, d: [30, 75] },
    lawsuit: { ic: '⚖️', t: 'Slip-and-fall claim settled', cost: [5000, 25000] },
    theft: { ic: '🕵️', t: 'Theft / shrinkage discovered', cost: [800, 7000] },
    utility: { ic: '💡', t: 'Water & power bill spike', cost: [900, 4000] },
    rain: { ic: '🌧️', t: 'Rainy week — barely anyone came', m: .35, d: [3, 7] },
    drought: { ic: '🚱', t: 'City water restrictions', m: .7, d: [10, 30] },
    vandal: { ic: '🪛', t: 'Vandalism repair', cost: [700, 4000] },
    members: { ic: '📈', t: 'Membership drive worked', m: 1.12, d: [30, 60] },
    fuel: { ic: '⛽', t: 'Fuel price swing squeezed margins', m: .9, d: [7, 20] },
    lottery: { ic: '🎟️', t: 'Sold a winning lottery ticket — bonus commission', gain: [2000, 15000] },
    permit: { ic: '📄', t: 'Permit renewal fees', cost: [600, 3000] },
    event: { ic: '🎪', t: 'Big local event — slammed all weekend', m: 1.6, d: [2, 4] },
    fight: { ic: '🚨', t: 'Fight on the floor — security bill + bad press', cost: [1500, 6000], m: .94, d: [4, 9] },
    celebrity: { ic: '🌟', t: 'A celebrity showed up — line around the block', m: 1.5, d: [5, 12] },
    license: { ic: '⛔', t: 'License suspended — closed', m: 0, d: [2, 6] },
    wholesale: { ic: '🤝', t: 'Signed a new wholesale account', m: 1.1, d: [60, 120] },
    fleet: { ic: '🚐', t: 'Won a local fleet maintenance contract', m: 1.15, d: [60, 150] },
    regulation: { ic: '📜', t: 'New flavor ban hit sales', m: .8, d: [30, 90] },
    ads: { ic: '🚫', t: 'Ad account paused for review', m: .5, d: [5, 14] },
    viral: { ic: '📱', t: 'A product video went viral', m: 2.6, d: [4, 9] },
    stock: { ic: '📦', t: 'Best seller out of stock', m: .75, d: [10, 25] },
    chargeback: { ic: '💳', t: 'Chargebacks and returns', cost: [1000, 8000] },
    platform: { ic: '🛒', t: 'Platform fee increase', perm: -.01 },
    churn: { ic: '📉', t: 'Churn spike — two big customers left', m: .93, d: [45, 120] },
    bigclient: { ic: '🏢', t: 'Signed a big annual contract', m: 1.15, d: [120, 240] },
    outage: { ic: '🛑', t: 'Outage — credits issued to customers', cost: [1500, 9000] },
    growth: { ic: '🚀', t: 'Organic signups growing', m: 1.08, d: [90, 200] },
    auction: { ic: '🔨', t: 'Lien auction on abandoned units', gain: [800, 5000] },
    occupancy: { ic: '📦', t: 'Occupancy up after a street-rate increase', m: 1.06, d: [90, 200] },
    tax: { ic: '🧾', t: 'Property tax bill', cost: [4000, 22000] },
    convention: { ic: '🎫', t: 'Convention in town — fully booked', m: 1.45, d: [3, 6] },
    repo: { ic: '🔁', t: 'Repossessions — losses on loans', cost: [4000, 20000] },
    royalty: { ic: '🧾', t: 'Franchise required remodel', cost: [12000, 40000] },
    enroll: { ic: '🧸', t: 'Fall enrollment filled the waitlist', m: 1.08, d: [90, 200] },
    location: { ic: '📍', t: 'Lost a location — machine pulled', m: .92, d: [60, 200] }
  };

  // ---------------- listings ----------------
  const CITY = [['Austin', 1.05], ['Miami', 1.1], ['Phoenix', .95], ['Denver', 1.05], ['Chicago', 1], ['Atlanta', 1], ['Nashville', 1.02], ['Dallas', 1], ['Las Vegas', 1], ['Seattle', 1.1], ['Boston', 1.12], ['New York', 1.2], ['Los Angeles', 1.15], ['Tampa', .97], ['Charlotte', .97], ['Columbus', .9], ['San Diego', 1.12], ['Houston', .98]];
  const WHY = ['Owner retiring', 'Owner relocating out of state', 'Partners splitting up', 'Owner focusing on another business', 'Health reasons', 'Second location owner selling one'];
  const LIST = [];
  (function gen() {
    const r = rng(77551), R = (a, b) => a + r() * (b - a), pick = a => a[Math.floor(r() * a.length)];
    KEYS.forEach((k, ti) => {
      const t = T[k], used = new Set();
      for (let i = 0; i < 3; i++) {
        let nm = pick(t.n), g = 0; while (used.has(nm) && g++ < 8) nm = pick(t.n); used.add(nm);
        const city = pick(CITY), size = Math.pow(r(), 1.3);
        const rev = Math.round((t.rev[0] + (t.rev[1] - t.rev[0]) * size) * city[1] / 1000) * 1000;
        const m = +R(t.sde[0], t.sde[1]).toFixed(3), sde = rev * m;
        const mult = +R(t.mult[0], t.mult[1]).toFixed(2), price = Math.round(sde * mult / 5000) * 5000;
        const id = 'b' + ti + '_' + i;
        LIST.push({ id, type: k, name: nm, place: city[0], rev, m, mult, price, sde: Math.round(sde), mgr: Math.round(t.mgr * city[1] / 1000) * 1000,
          yrs: Math.floor(R(2, 31)), emp: Math.max(1, Math.round(rev / (t.cost[1] > .3 ? 55e3 : t.cost[1] > .15 ? 90e3 : 220e3))), why: pick(WHY), tod: pick(['day', 'day', 'sunset', 'night']), seed: ti * 10 + i });
      }
    });
  })();
  const BY = {}; LIST.forEach(x => BY[x.id] = x);

  // ---------------- storefront art ----------------
  const FONT = 'font-family="Inter,Arial" font-weight="900"';
  function sign(C, x, y, w, h, txt, bg, fg, neon) {
    const fs = Math.min(h * .72, (w - 8) / Math.max(4, txt.length * .62));
    return C.r(x, y, w, h, bg, ' rx="2"') + '<text x="' + f(x + w / 2) + '" y="' + f(y + h / 2 + fs * .36) + '" font-size="' + f(fs) + '" ' + FONT + ' text-anchor="middle" fill="' + fg + '"' + (neon && !C.day ? ' style="filter:drop-shadow(0 0 3px ' + fg + ')"' : '') + '>' + txt.replace(/&/g, '&amp;').replace(/</g, '') + '</text>';
  }
  function awning(C, x, y, w, c1, c2) { let s = ''; const n = Math.max(4, Math.round(w / 14)), sw = w / n; for (let k = 0; k < n; k++) s += '<path d="M' + f(x + k * sw) + ',' + f(y) + ' l' + f(sw) + ',0 l2,10 q' + f(-sw / 2 - 1) + ',5 ' + f(-sw - 2) + ',0 Z" fill="' + (k % 2 ? c2 : c1) + '"/>'; return s; }
  // generic storefront: o = {w,h,wall,sign,sbg,sfg,aw:[c1,c2],up (upper floor height),brick,fill(x,y,w,h)}
  function store(C, o) {
    const w = o.w, h = o.h, x = o.x != null ? o.x : 160 - w / 2, y = C.gY - h; let s = C.r(x, y, w, h, o.wall);
    if (o.brick) for (let yy = y + 4; yy < C.gY; yy += 4) s += C.L([[x, yy], [x + w, yy]], shade(o.wall, -.25), .5, ' opacity=".6"');
    let top = y; if (o.up) { s += C.grid(x, y, w, o.up, Math.max(2, Math.floor(w / 26)), 1, 12, o.up * .5, '#f4f4f4'); top = y + o.up; }
    s += C.r(x - 2, top, w + 4, 3, shade(o.wall, -.4));
    s += sign(C, x + 6, top + 5, w - 12, 15, o.sign, o.sbg, o.sfg, o.neon);
    const wy = top + 24 + (o.aw ? 6 : 0), wh = C.gY - 5 - wy, gw = w * .64;
    s += C.r(x + 7, wy, gw, wh, C.day ? '#a9cdeb' : '#ffe1a0', ' opacity="' + (C.day ? .9 : .85) + '"');
    if (o.fill) s += o.fill(x + 7, wy, gw, wh);
    s += C.r(x + 7, wy, gw, wh, 'none', ' stroke="' + shade(o.wall, -.5) + '" stroke-width="2"') + C.L([[x + 7, wy + wh * .55], [x + 7 + gw, wy + wh * .55]], 'rgba(255,255,255,.35)', 2);
    s += C.r(x + w * .76, wy, w * .17, C.gY - wy, C.day ? '#7fa9cc' : '#ffd27a', ' opacity=".9"') + C.r(x + w * .76, wy, w * .17, C.gY - wy, 'none', ' stroke="' + shade(o.wall, -.5) + '" stroke-width="2"') + C.r(x + w * .78, wy + (C.gY - wy) * .5, 2, 5, '#d4a64a');
    if (o.aw) s += awning(C, x + 2, top + 22, w - 4, o.aw[0], o.aw[1]);
    return s + C.glow(x + w / 2, wy + wh / 2, w * .7, 30, .5);
  }
  const ppl = (C, x, y, n, sc) => { let s = ''; for (let k = 0; k < n; k++) { const px = x + k * 9 * (sc || 1), c = C.pk(['#2a2c36', '#3a2a40', '#16181f', '#4a3a3a', '#1d2747']); s += C.E(px, y - 17 * (sc || 1), 3.4 * (sc || 1), 3.4 * (sc || 1), c) + C.r(px - 3.5 * (sc || 1), y - 13 * (sc || 1), 7 * (sc || 1), 13 * (sc || 1), c, ' rx="2"'); } return s; };
  const car = (x, y, w, m) => { const cm = m || Art.CARS[Math.floor(Math.random() * 400)]; return Art.carArt(cm, cm.color).replace('<svg ', '<svg x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(w * 145 / 320) + '" '); };
  const ART = {
    coffee: C => store(C, { w: 150, h: 76, up: 22, wall: C.pk(['#2a3a2a', '#3a2a22', '#f0e2cf', '#1d2747']), sign: C.h.name.toUpperCase(), sbg: '#16181f', sfg: '#e8d8b8', aw: ['#2f6b3a', '#f4f1e8'], fill: (x, y, w, h) => { let s = ''; for (let k = 0; k < 5; k++) s += C.r(x + 6 + k * (w - 12) / 5, y + h - 12, 7, 8, '#f4f4f4') + C.L([[x + 13 + k * (w - 12) / 5, y + h - 10], [x + 15 + k * (w - 12) / 5, y + h - 8]], '#f4f4f4', 1.2); return s + C.r(x + 4, y + h - 4, w - 8, 3, '#5a3a24'); } }) + C.r(250, C.gY - 18, 14, 18, '#16181f') + '<text x="257" y="' + f(C.gY - 8) + '" font-size="4" text-anchor="middle" fill="#fff" ' + FONT + '>LATTE</text>' + C.r(40, C.gY - 12, 18, 2, '#3a3d48') + C.L([[49, C.gY - 10], [49, C.gY]], '#3a3d48', 1.5),
    restaurant: C => store(C, { w: 210, h: 84, up: 26, wall: C.pk(['#7a3b2a', '#2a2e3a', '#e2d3c2']), brick: true, sign: C.h.name.toUpperCase(), sbg: '#16181f', sfg: '#ffd27a', neon: true, aw: ['#7a2f1f', '#5a1f14'], fill: (x, y, w, h) => { let s = ''; for (let k = 0; k < 4; k++) s += C.r(x + 8 + k * (w - 16) / 4, y + h - 10, 14, 4, '#f4f4f4') + C.r(x + 14 + k * (w - 16) / 4, y + h - 6, 2, 6, '#3a2a20'); return s; } }) + [30, 280].map(px => C.P([[px - 14, C.gY - 26], [px, C.gY - 34], [px + 14, C.gY - 26]], '#e8e2d4') + C.L([[px, C.gY - 26], [px, C.gY]], '#3a3a40', 1.5)).join(''),
    pizza: C => store(C, { w: 150, h: 72, up: 0, wall: C.pk(['#f4f1e8', '#2a7a3a', '#c2352b']), sign: C.h.name.toUpperCase(), sbg: '#c2352b', sfg: '#ffffff', aw: ['#c2352b', '#ffffff'], fill: (x, y, w, h) => C.E(x + w / 2, y + h / 2, h * .35, h * .35, '#e8b04a') + C.E(x + w / 2, y + h / 2, h * .29, h * .29, '#d9542b') + [[-.1, -.1], [.12, .05], [-.05, .14], [.1, -.15]].map(q => C.E(x + w / 2 + q[0] * h, y + h / 2 + q[1] * h, 2.4, 2.4, '#8a2a22')).join('') }) + C.r(250, C.gY - 14, 26, 10, '#c2352b', ' rx="2"') + C.E(257, C.gY - 3, 3, 3, '#111') + C.E(272, C.gY - 3, 3, 3, '#111'),
    truck: C => { const x = C.R2(70, 110); let s = C.r(x, C.gY - 58, 150, 44, C.pk(['#ffc21a', '#1fb5a8', '#e2577a', '#f4f4f4']), ' rx="5"') + C.r(x + 150, C.gY - 46, 34, 32, '#e9e4dc', ' rx="4"') + C.r(x + 158, C.gY - 42, 20, 12, '#1a2036') + C.r(x + 30, C.gY - 50, 70, 22, C.day ? '#16181f' : '#ffd27a') + awning(C, x + 26, C.gY - 58, 78, '#16181f', '#f4f4f4') + sign(C, x + 10, C.gY - 72, 130, 13, C.h.name.toUpperCase(), '#16181f', '#ffc21a') + C.r(x + 104, C.gY - 50, 30, 30, '#16181f', ' rx="2"');
      for (let k = 0; k < 4; k++) s += C.L([[x + 108, C.gY - 44 + k * 6], [x + 128, C.gY - 44 + k * 6]], '#f4f4f4', 1); s += C.E(x + 30, C.gY - 10, 10, 10, '#111') + C.E(x + 160, C.gY - 10, 10, 10, '#111') + C.E(x + 30, C.gY - 10, 4, 4, '#8a8f9c') + C.E(x + 160, C.gY - 10, 4, 4, '#8a8f9c');
      s += '<path d="M10,' + f(C.gY - 90) + ' Q160,' + f(C.gY - 70) + ' 310,' + f(C.gY - 92) + '" stroke="#2a2c36" stroke-width=".8" fill="none"/>'; for (let k = 0; k < 14; k++) s += C.E(10 + k * 22, C.gY - 90 + Math.sin(k / 13 * 3.14) * 18, 2, 2, C.day ? '#f4f1e0' : '#ffd27a'); return s + ppl(C, 20, C.gY + 2, 3) + C.glow(x + 70, C.gY - 40, 90, 30, .5); },
    bar: C => store(C, { w: 160, h: 78, up: 24, wall: C.pk(['#3a2a22', '#2a2228', '#5a3528']), brick: true, sign: C.h.name.toUpperCase(), sbg: '#16181f', sfg: '#ff7a1a', neon: true, fill: (x, y, w, h) => C.r(x + w * .2, y + h * .2, w * .25, h * .3, '#ff3355', ' opacity=".85" rx="3"') + '<text x="' + f(x + w * .325) + '" y="' + f(y + h * .4) + '" font-size="6" text-anchor="middle" fill="#fff" ' + FONT + '>BEER</text>' + C.r(x + w * .6, y + h * .25, w * .2, h * .25, '#1fd3ff', ' opacity=".8" rx="3"') }) + ppl(C, 255, C.gY + 1, 2),
    club: C => { const s = store(C, { w: 200, h: 92, up: 26, wall: '#16181f', sign: C.h.name.toUpperCase(), sbg: '#0b0c12', sfg: C.pk(['#ff2a6d', '#1fd3ff', '#b46cff']), neon: true, fill: (x, y, w, h) => C.r(x, y, w, h, '#2a0e3a', ' opacity=".7"') + [0, 1, 2].map(k => C.E(x + w * (.2 + k * .3), y + h * .4, 8, 8, C.pk(['#ff2a6d', '#1fd3ff', '#ffc21a', '#b46cff']), ' opacity=".6"')).join('') });
      return s + [60, 260].map(px => '<path d="M' + px + ',' + f(C.gY) + ' L' + (px - 40) + ',0 L' + (px - 20) + ',0 Z" fill="#fff" opacity=".08"/>').join('') + C.r(20, C.gY - 10, 60, 2, '#d4a64a') + C.L([[20, C.gY - 9], [20, C.gY]], '#d4a64a', 2) + ppl(C, 26, C.gY + 1, 6, .9); },
    laundromat: C => store(C, { w: 170, h: 70, up: 0, wall: C.pk(['#cfe3e0', '#a9c8ff', '#f4f1e8', '#ffe08a']), sign: C.h.name.toUpperCase(), sbg: '#2f6bff', sfg: '#ffffff', fill: (x, y, w, h) => { let s = ''; for (let k = 0; k < 5; k++) { const cx = x + 12 + k * (w - 24) / 4, cy = y + h * .55; s += C.r(cx - 10, cy - 12, 20, 24, '#f4f4f4', ' rx="2"') + C.E(cx, cy + 2, 7, 7, '#5a6a7a') + C.E(cx, cy + 2, 5, 5, '#9cc8ee'); } return s; } }) + C.r(255, C.gY - 20, 26, 6, '#f4f4f4') + '<text x="268" y="' + f(C.gY - 15.5) + '" font-size="4" text-anchor="middle" fill="#2f6bff" ' + FONT + '>WASH 3.50</text>',
    selfwash: C => { let s = sign(C, 30, C.gY - 96, 60, 18, C.h.name.toUpperCase(), '#2f6bff', '#fff') + C.r(57, C.gY - 78, 6, 78, '#8a8f9c'); const x0 = 100; s += C.r(x0, C.gY - 64, 200, 6, '#e9e4dc') + C.r(x0, C.gY - 58, 200, 4, '#2f6bff');
      for (let k = 0; k <= 4; k++) s += C.r(x0 + k * 49, C.gY - 58, 5, 58, '#c9ced9'); for (let k = 0; k < 4; k++) { s += C.r(x0 + 10 + k * 49, C.gY - 48, 10, 14, '#3a3d48') + C.L([[x0 + 15 + k * 49, C.gY - 34], [x0 + 30 + k * 49, C.gY - 12]], '#16181f', 1.4); if (C.R() < .5) s += car(x0 + 8 + k * 49, C.gY - 22, 44); } return s; },
    tunnelwash: C => { const x = 70, w = 210, h = 54; let s = C.r(x, C.gY - h, w, h, '#f4f6fb') + C.r(x, C.gY - h, w, 8, C.pk(['#2f6bff', '#e2577a', '#1fb5a8'])) + sign(C, x + 50, C.gY - h - 18, 110, 16, C.h.name.toUpperCase(), '#16181f', '#1fd3ff', true);
      s += '<path d="M' + (x + 20) + ',' + f(C.gY) + ' L' + (x + 20) + ',' + f(C.gY - 30) + ' A20,20 0 0 1 ' + (x + 60) + ',' + f(C.gY - 30) + ' L' + (x + 60) + ',' + f(C.gY) + ' Z" fill="#1a2036"/>'; for (let k = 0; k < 4; k++) s += C.r(x + 24 + k * 8, C.gY - 28, 5, 24, C.pk(['#ff5fa2', '#1fd3ff', '#ffc21a', '#1fd38c']), ' rx="2"');
      s += C.glass(x + 90, C.gY - h + 14, 110, 26, 6) + car(x - 60, C.gY - 26, 58); for (let k = 0; k < 6; k++) s += C.L([[20 + k * 50, C.gY - 40], [20 + k * 50, C.gY]], '#8a8f9c', 1) + C.P([[20 + k * 50, C.gY - 40], [34 + k * 50, C.gY - 36], [20 + k * 50, C.gY - 32]], C.pk(['#ff3355', '#2f6bff', '#ffc21a'])); return s; },
    gas: C => { let s = C.r(40, C.gY - 70, 150, 8, '#f4f4f4') + C.r(40, C.gY - 62, 150, 5, '#c2352b') + C.r(60, C.gY - 57, 5, 57, '#d8dbe6') + C.r(165, C.gY - 57, 5, 57, '#d8dbe6');
      for (let k = 0; k < 2; k++) s += C.r(90 + k * 40, C.gY - 26, 14, 26, '#e9e4dc', ' rx="2"') + C.r(92 + k * 40, C.gY - 22, 10, 6, '#1a2036'); s += car(100, C.gY - 24, 52);
      s += store(C, { x: 200, w: 100, h: 50, wall: '#e9e4dc', sign: 'MART', sbg: '#c2352b', sfg: '#fff', fill: (x, y, w, h) => C.r(x + 4, y + 4, w * .4, h * .5, '#ffc21a', ' opacity=".8"') });
      return s + C.r(14, C.gY - 96, 30, 40, '#16181f', ' rx="3"') + C.r(27, C.gY - 56, 4, 56, '#8a8f9c') + '<text x="29" y="' + f(C.gY - 84) + '" font-size="5" text-anchor="middle" fill="#fff" ' + FONT + '>REG</text><text x="29" y="' + f(C.gY - 74) + '" font-size="8" text-anchor="middle" fill="#ffc21a" ' + FONT + '>3.' + C.RI2(19, 89) + '</text>' + sign(C, 70, C.gY - 82, 90, 10, C.h.name.toUpperCase(), '#c2352b', '#fff'); },
    cstore: C => store(C, { w: 160, h: 68, wall: C.pk(['#e9e4dc', '#f4f1e8', '#d8dbe6']), sign: C.h.name.toUpperCase(), sbg: '#2f6bff', sfg: '#ffc21a', fill: (x, y, w, h) => C.r(x + 4, y + 4, w * .3, h * .55, '#ff3355', ' opacity=".8"') + C.r(x + w * .4, y + 4, w * .25, h * .55, '#1fd38c', ' opacity=".7"') + C.r(x + w * .7, y + 4, w * .25, h * .4, '#ffc21a', ' opacity=".75"') }) + C.r(255, C.gY - 24, 22, 24, '#e9eef5') + '<text x="266" y="' + f(C.gY - 14) + '" font-size="4.5" text-anchor="middle" fill="#2f6bff" ' + FONT + '>ICE</text>' + C.r(30, C.gY - 26, 14, 26, '#2a2e3a') + C.r(32, C.gY - 22, 10, 6, '#1fd38c'),
    barber: C => { let s = store(C, { w: 150, h: 70, up: 0, wall: C.pk(['#16181f', '#2a3a5a', '#f4f1e8']), sign: C.h.name.toUpperCase(), sbg: '#f4f4f4', sfg: '#16181f', fill: (x, y, w, h) => { let o = ''; for (let k = 0; k < 3; k++) o += C.r(x + 10 + k * (w - 20) / 3, y + h - 22, 16, 14, '#c2352b', ' rx="3"') + C.r(x + 15 + k * (w - 20) / 3, y + h - 8, 5, 8, '#8a8f9c') + C.r(x + 8 + k * (w - 20) / 3, y + 6, 20, 14, '#e9eef5', ' opacity=".6"'); return o; } });
      const px = 160 - 75 - 10; s += C.r(px, C.gY - 44, 8, 30, '#f4f4f4', ' rx="4"'); for (let k = 0; k < 5; k++) s += C.L([[px, C.gY - 42 + k * 6], [px + 8, C.gY - 38 + k * 6]], k % 2 ? '#2f6bff' : '#c2352b', 2); return s + C.E(px + 4, C.gY - 46, 4, 3, '#d8dbe6'); },
    gym: C => store(C, { w: 220, h: 80, up: 0, wall: C.pk(['#16181f', '#2a2e3a', '#3a3d48']), sign: C.h.name.toUpperCase(), sbg: '#ff3355', sfg: '#fff', fill: (x, y, w, h) => { let s = ''; for (let k = 0; k < 4; k++) s += C.r(x + 10 + k * (w - 20) / 4, y + h - 18, 26, 4, '#2a2c36') + C.L([[x + 30 + k * (w - 20) / 4, y + h - 18], [x + 34 + k * (w - 20) / 4, y + h - 32]], '#2a2c36', 3); s += C.L([[x + w * .6, y + h * .35], [x + w * .85, y + h * .35]], '#2a2c36', 2) + C.r(x + w * .6 - 3, y + h * .35 - 5, 4, 10, '#2a2c36') + C.r(x + w * .85 - 1, y + h * .35 - 5, 4, 10, '#2a2c36'); return s; } }),
    vending: C => { let s = C.r(40, C.gY - 90, 240, 90, C.pk(['#2a2e3a', '#e9e4dc', '#1d2747'])) + C.r(40, C.gY - 6, 240, 6, '#8a8f9c') + sign(C, 90, C.gY - 86, 140, 12, C.h.name.toUpperCase(), '#16181f', '#1fd3ff', true);
      for (let k = 0; k < 4; k++) { const x = 58 + k * 54, col = C.pk(['#c2352b', '#2f6bff', '#16181f', '#1f8a5a', '#ff7a1a']); s += C.r(x, C.gY - 66, 42, 62, col, ' rx="3"') + C.r(x + 4, C.gY - 60, 26, 40, C.day ? '#cfe3f5' : '#ffe9b0', ' opacity=".9"'); for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) s += C.r(x + 6 + b * 8, C.gY - 57 + a * 9, 6, 6, C.pk(['#ffc21a', '#ff3355', '#1fd38c', '#f4f4f4', '#7a3b2a'])); s += C.r(x + 33, C.gY - 56, 6, 14, '#16181f') + C.r(x + 6, C.gY - 16, 24, 6, '#0b0c12'); }
      return s + C.glow(160, C.gY - 40, 120, 40, .6); },
    storage: C => { let s = C.L([[0, C.gY - 30], [320, C.gY - 30]], '#8a8f9c', 1) + C.L([[0, C.gY - 18], [320, C.gY - 18]], '#8a8f9c', 1); for (let x = 0; x < 320; x += 12) s += C.L([[x, C.gY - 32], [x, C.gY]], '#8a8f9c', .8);
      for (let row = 0; row < 2; row++) { const y = C.gY - 70 + row * 30, x0 = 60 + row * 20; s += C.r(x0, y - 26, 240, 30, '#e9e4dc') + C.r(x0 - 2, y - 28, 244, 3, '#5a5f6e'); for (let k = 0; k < 9; k++) { s += C.r(x0 + 6 + k * 26, y - 20, 20, 22, C.pk(['#ff7a1a', '#ff7a1a', '#ff7a1a', '#2f6bff'])); for (let l = 0; l < 4; l++) s += C.L([[x0 + 6 + k * 26, y - 16 + l * 5], [x0 + 26 + k * 26, y - 16 + l * 5]], 'rgba(0,0,0,.25)', .8); } }
      return s + store(C, { x: 4, w: 62, h: 46, wall: '#f4f1e8', sign: 'OFFICE', sbg: '#ff7a1a', sfg: '#fff' }) + sign(C, 120, 22, 120, 16, C.h.name.toUpperCase(), '#16181f', '#ff7a1a'); },
    bakery: C => store(C, { w: 150, h: 74, up: 22, wall: C.pk(['#f7b2c4', '#ffe08a', '#f4f1e8', '#cfe3e0']), sign: C.h.name.toUpperCase(), sbg: '#7a4a2a', sfg: '#ffe9c4', aw: ['#f7b2c4', '#ffffff'], fill: (x, y, w, h) => { let s = C.r(x + 4, y + h * .62, w - 8, 3, '#8a6a4a'); for (let k = 0; k < 6; k++) s += C.E(x + 12 + k * (w - 20) / 6, y + h * .55, 7, 4, '#d9a35a') + C.E(x + 12 + k * (w - 20) / 6, y + h * .82, 5, 3.5, '#c98a40'); return s; } }),
    autorepair: C => { const x = 50, w = 230, h = 74; let s = C.r(x, C.gY - h, w, h, C.pk(['#e9e4dc', '#d8dbe6', '#2a2e3a'])) + sign(C, x + 40, C.gY - h + 6, 150, 14, C.h.name.toUpperCase(), '#c2352b', '#fff');
      for (let k = 0; k < 3; k++) { const bx = x + 12 + k * 72; s += C.r(bx, C.gY - 48, 62, 48, '#2a2c36') + C.r(bx + 2, C.gY - 46, 58, 44, C.day ? '#4a4e5a' : '#6a5a3a'); if (k === 1) s += C.r(bx + 8, C.gY - 30, 46, 3, '#ffc21a') + C.r(bx + 12, C.gY - 27, 3, 27, '#ffc21a') + C.r(bx + 47, C.gY - 27, 3, 27, '#ffc21a') + car(bx + 6, C.gY - 52, 50); else if (C.R() < .6) s += car(bx + 6, C.gY - 24, 50); }
      for (let k = 0; k < 4; k++) s += C.E(24, C.gY - 5 - k * 8, 10, 4.5, '#16181f') + C.E(24, C.gY - 5 - k * 8, 4, 2, '#3a3d48'); return s; },
    liquor: C => store(C, { w: 170, h: 70, wall: C.pk(['#2a2e3a', '#3a2a22', '#e9e4dc']), sign: 'LIQUOR · ' + C.h.name.toUpperCase(), sbg: '#16181f', sfg: '#ff3355', neon: true, fill: (x, y, w, h) => { let s = C.r(x + 3, y + h * .5, w - 6, 2, '#5a3a24') + C.r(x + 3, y + h * .85, w - 6, 2, '#5a3a24'); for (let k = 0; k < 12; k++) { const bx = x + 6 + k * (w - 12) / 12, by = k % 2 ? y + h * .5 : y + h * .85; s += C.r(bx, by - 12, 5, 12, C.pk(['#2a6a3a', '#7a3b2a', '#d9a35a', '#2a3a5a'])) + C.r(bx + 1.5, by - 16, 2, 4, '#16181f'); } return s; } }),
    smoke: C => store(C, { w: 130, h: 66, wall: C.pk(['#2a1a3a', '#16181f', '#3a2a40']), sign: C.h.name.toUpperCase(), sbg: '#0b0c12', sfg: '#b46cff', neon: true, fill: (x, y, w, h) => C.r(x + w * .15, y + h * .2, w * .7, h * .25, '#b46cff', ' opacity=".5" rx="4"') + '<text x="' + f(x + w / 2) + '" y="' + f(y + h * .37) + '" font-size="6" text-anchor="middle" fill="#fff" ' + FONT + '>VAPE · CBD · GLASS</text>' }) + C.r(20, C.gY - 30, 100, 30, '#3a3d48') + C.r(230, C.gY - 40, 80, 40, '#4a4e5a'),
    ecom: C => { const x = 40, w = 240, h = 80; let s = C.r(x, C.gY - h, w, h, '#c9ced9') + C.r(x, C.gY - h, w, 4, '#8a8f9c') + sign(C, x + 70, C.gY - h + 8, 100, 12, C.h.name.toUpperCase(), '#16181f', '#ffc21a');
      s += C.r(x + 14, C.gY - 54, 110, 54, '#2a2c36'); for (let r = 0; r < 3; r++) { s += C.r(x + 16, C.gY - 52 + r * 17, 106, 2, '#ffc21a'); for (let k = 0; k < 7; k++) s += C.r(x + 18 + k * 15, C.gY - 64 + r * 17 + 14, 12, 10, '#c98a40') + C.L([[x + 18 + k * 15, C.gY - 45 + r * 17], [x + 30 + k * 15, C.gY - 45 + r * 17]], '#8a5a2a', .6); }
      s += C.r(x + 140, C.gY - 30, 70, 26, '#f4f4f4', ' rx="3"') + C.r(x + 196, C.gY - 26, 18, 22, '#e9e4dc', ' rx="2"') + C.E(x + 156, C.gY - 4, 5, 5, '#111') + C.E(x + 200, C.gY - 4, 5, 5, '#111') + '<text x="' + f(x + 172) + '" y="' + f(C.gY - 15) + '" font-size="6" text-anchor="middle" fill="#2f6bff" ' + FONT + '>SHIPPING</text>';
      return s; },
    saas: C => { let s = C.r(0, 0, 320, 180, '#0d1020', ' opacity=".55"') + C.r(30, 30, 260, 100, C.day ? '#c9d4e0' : '#141a33', ' opacity=".55"'); s += C.r(60, C.gY - 30, 200, 6, '#8a6a4a') + C.r(70, C.gY - 24, 4, 24, '#5a4a3a') + C.r(246, C.gY - 24, 4, 24, '#5a4a3a');
      [[80, 70], [150, 70], [220, 60]].forEach((m, i) => { s += C.r(m[0], C.gY - 30 - m[1] * .75, m[1] * .9, m[1] * .55, '#16181f', ' rx="3"') + C.r(m[0] + 3, C.gY - 27 - m[1] * .75, m[1] * .9 - 6, m[1] * .55 - 6, '#0b1430'); const ox = m[0] + 6, oy = C.gY - 30 - m[1] * .75 + m[1] * .45; let pth = 'M' + ox + ',' + oy; for (let k = 1; k < 10; k++) pth += ' L' + f(ox + k * (m[1] * .9 - 12) / 9) + ',' + f(oy - k * 2.4 - C.R2(-3, 3)); s += '<path d="' + pth + '" stroke="' + (i === 1 ? '#1fd38c' : '#1fd3ff') + '" stroke-width="1.6" fill="none"/>' + C.r(m[0] + m[1] * .4, C.gY - 30 - m[1] * .2, 6, m[1] * .2, '#2a2c36'); });
      return s + sign(C, 110, 24, 100, 14, C.h.name.toUpperCase(), '#16181f', '#1fd3ff', true) + '<text x="160" y="52" font-size="6" text-anchor="middle" fill="#9aa0b0" ' + FONT + '>MRR ' + money(C.h.rev / 12) + '</text>'; },
    motel: C => { const x = 50, w = 220, h = 54; let s = C.r(x, C.gY - h, w, h, C.pk(['#f4f1e8', '#cfe3e0', '#f7d2a8'])) + C.r(x - 4, C.gY - h - 3, w + 8, 4, '#c2352b') + C.r(x - 4, C.gY - h / 2 - 2, w + 8, 3, '#c2352b');
      for (let fl = 0; fl < 2; fl++) for (let k = 0; k < 9; k++) { const dx = x + 8 + k * 24, dy = C.gY - h + 4 + fl * h / 2; s += C.r(dx, dy + 4, 8, h / 2 - 8, C.pk(['#2f6bff', '#1fb5a8', '#c2352b'])) + C.win(dx + 10, dy + 6, 8, 8); }
      s += C.L([[x - 4, C.gY - h / 2 - 8], [x + w + 4, C.gY - h / 2 - 8]], '#f4f4f4', 1); s += C.r(14, C.gY - 100, 34, 50, '#16181f', ' rx="3"') + C.r(29, C.gY - 50, 4, 50, '#8a8f9c') + '<text x="31" y="' + f(C.gY - 84) + '" font-size="5.5" text-anchor="middle" fill="#ff3355" ' + FONT + '>MOTEL</text><text x="31" y="' + f(C.gY - 70) + '" font-size="5" text-anchor="middle" fill="#1fd38c" ' + FONT + '>VACANCY</text>';
      return s + sign(C, x + 50, C.gY - h - 18, 120, 14, C.h.name.toUpperCase(), '#16181f', '#ffc21a', true) + C.r(x + w - 70, C.gY + 4, 60, 8, C.POOL, ' rx="3"'); },
    dealer: C => { let s = store(C, { x: 20, w: 90, h: 50, wall: '#f4f4f4', sign: 'SALES', sbg: '#2f6bff', sfg: '#fff' }) + sign(C, 120, C.gY - 90, 180, 14, C.h.name.toUpperCase(), '#2f6bff', '#ffc21a');
      s += '<path d="M115,' + f(C.gY - 70) + ' Q210,' + f(C.gY - 52) + ' 310,' + f(C.gY - 72) + '" stroke="#2a2c36" stroke-width=".8" fill="none"/>'; for (let k = 0; k < 12; k++) s += C.P([[118 + k * 16, C.gY - 68 + Math.sin(k / 11 * 3.14) * 8], [126 + k * 16, C.gY - 68 + Math.sin(k / 11 * 3.14) * 8], [122 + k * 16, C.gY - 60 + Math.sin(k / 11 * 3.14) * 8]], ['#ff3355', '#2f6bff', '#ffc21a'][k % 3]);
      const cars = Art.CARS.filter(m => m.cls === 'sedan' || m.cls === 'suv' || m.cls === 'truck' || m.cls === 'hatch'); for (let k = 0; k < 3; k++) { const m = cars[(C.h.seed * 7 + k * 13) % cars.length]; s += car(120 + k * 64, C.gY - 30, 66, m) + C.r(140 + k * 64, C.gY - 40, 18, 6, '#ffc21a') + '<text x="' + f(149 + k * 64) + '" y="' + f(C.gY - 35.6) + '" font-size="4" text-anchor="middle" fill="#16181f" ' + FONT + '>$' + C.RI2(6, 24) + ',9' + C.RI2(0, 9) + '9</text>'; }
      return s; },
    daycare: C => { let s = store(C, { x: 30, w: 160, h: 66, wall: C.pk(['#ffe08a', '#a8e0c8', '#a9c8ff']), sign: C.h.name.toUpperCase(), sbg: '#ff5fa2', sfg: '#fff', aw: ['#ff5fa2', '#ffc21a'], fill: (x, y, w, h) => { let o = ''; for (let k = 0; k < 5; k++) o += C.E(x + 10 + k * (w - 20) / 4, y + h * .4, 5, 5, C.pk(['#ff3355', '#2f6bff', '#1fd38c', '#ffc21a'])); return o; } });
      s += C.P([[220, C.gY], [232, C.gY - 40], [238, C.gY - 40], [262, C.gY]], '#ff7a1a', ' opacity=".9"') + C.L([[228, C.gY - 40], [228, C.gY]], '#2f6bff', 2) + C.L([[268, C.gY - 44], [268, C.gY], [300, C.gY], [300, C.gY - 44], [268, C.gY - 44]], '#2f6bff', 2) + C.L([[278, C.gY - 44], [278, C.gY - 14]], '#8a8f9c', 1) + C.r(274, C.gY - 14, 10, 3, '#ffc21a') + C.L([[290, C.gY - 44], [290, C.gY - 18]], '#8a8f9c', 1) + C.r(286, C.gY - 18, 10, 3, '#ff3355');
      let fence = ''; for (let x = 200; x < 316; x += 7) fence += C.r(x, C.gY - 12, 3, 12, '#f4f4f4'); return s + fence; },
    burger: C => { let s = store(C, { x: 70, w: 160, h: 60, wall: C.pk(['#c2352b', '#ffc21a', '#16181f']), sign: C.h.name.toUpperCase(), sbg: '#16181f', sfg: '#ffc21a', fill: (x, y, w, h) => ppl(C, x + 10, y + h, 4, .8) });
      s += C.r(16, C.gY - 110, 40, 30, '#c2352b', ' rx="4"') + C.r(33, C.gY - 80, 6, 80, '#8a8f9c') + C.E(36, C.gY - 98, 12, 6, '#e8b04a') + C.r(24, C.gY - 96, 24, 3, '#5a2a1a') + C.E(36, C.gY - 91, 12, 4, '#e8b04a');
      s += C.r(240, C.gY - 40, 30, 34, '#16181f', ' rx="2"'); for (let k = 0; k < 5; k++) s += C.r(243, C.gY - 37 + k * 6, 24, 3, '#ffc21a', ' opacity=".7"'); s += C.L([[200, C.gY + 8], [300, C.gY + 8]], '#ffc21a', 1.5, ' stroke-dasharray="6 5"') + car(250, C.gY - 18, 60);
      return s; }
  };
  const SETS = { coffee: 'city', restaurant: 'city', pizza: 'city', truck: 'city', bar: 'city', club: 'city', laundromat: 'suburb', selfwash: 'suburb', tunnelwash: 'suburb', gas: 'country', cstore: 'suburb', barber: 'city', gym: 'suburb', vending: 'city', storage: 'suburb', bakery: 'city', autorepair: 'suburb', liquor: 'suburb', smoke: 'suburb', ecom: 'suburb', saas: 'city', motel: 'desert', dealer: 'suburb', daycare: 'suburb', burger: 'suburb' };
  function art(L) {
    const tod = L.type === 'club' ? 'night' : L.tod;
    const C = Art.hctx({ id: 'h' + (900 + L.seed), tod, v: L.seed, name: L.name, rev: L.rev, seed: L.seed }, SETS[L.type] || 'suburb');
    C.h = { name: L.name, rev: L.rev, seed: L.seed };
    let b = ''; try { b = ART[L.type](C); } catch (e) { b = ''; }
    return Art.hsvg(C, b);
  }

  // ---------------- owned businesses ----------------
  const A = () => G.App, W = () => G.App.W;
  const SPEED = () => { try { return localStorage.getItem('gp_biz_speed') || 'real'; } catch (e) { return 'real'; } };
  const DAY = () => SPEED() === 'fast' ? 3600e3 : 86400e3;
  function owned() { const w = W(); w.biz = w.biz || []; return w.biz; }
  function profitParams(b) {
    const t = T[b.type], cogs = t.cost[0], lab = t.cost[1], rent = t.cost[2], m = b.m + (b.perm || 0);
    const other = Math.max(0, 1 - m - cogs - lab - rent);
    return { varRate: cogs + lab * .4, fixedFrac: rent + other + lab * .6, m };
  }
  function seasonal(b, ts) { const s = SEAS[T[b.type].seas] || SEAS.flat, d = new Date(ts); return s[0][d.getDay()] * s[1][d.getMonth()] / (s[0].reduce((a, x) => a + x, 0) / 7) / (s[1].reduce((a, x) => a + x, 0) / 12); }
  function oneDay(b, ts) {
    const t = T[b.type], P = profitParams(b), r0 = b.rev / 365;
    b.trend = Math.max(.6, Math.min(1.5, (b.trend || 1) * Math.exp(gauss() * .006 - .00001)));
    let mul = 1; b.mods = (b.mods || []).filter(x => x.until > ts); b.mods.forEach(x => mul *= x.m);
    const rev = Math.max(0, r0 * seasonal(b, ts) * b.trend * mul * Math.exp(gauss() * t.vol - t.vol * t.vol / 2));
    let profit = rev * (1 - P.varRate) - r0 * P.fixedFrac - b.mgr / 365 - (b.mktDay || 0);
    let note = null;
    if (Math.random() < .014) {
      const k = t.ev[Math.floor(Math.random() * t.ev.length)], E = EV[k];
      if (E) {
        const sc = Math.max(.4, Math.min(2, b.rev / 600e3));
        if (E.cost) { const c = (E.cost[0] + Math.random() * (E.cost[1] - E.cost[0])) * sc; profit -= c; note = { ic: E.ic, txt: E.t, amt: -c }; }
        if (E.gain) { const g2 = E.gain[0] + Math.random() * (E.gain[1] - E.gain[0]); profit += g2; note = { ic: E.ic, txt: E.t, amt: g2 }; }
        if (E.m != null) { const d = E.d[0] + Math.random() * (E.d[1] - E.d[0]); b.mods.push({ m: E.m, until: ts + d * 86400e3 * (DAY() / 86400e3) }); if (!note) note = { ic: E.ic, txt: E.t + ' (' + Math.round(d) + ' days)', amt: 0 }; }
        if (E.perm) { b.perm = (b.perm || 0) + E.perm; note = { ic: E.ic, txt: E.t + ' (margin ' + (E.perm * 100).toFixed(1) + ' pts)', amt: 0 }; }
      }
    }
    if (b.mktUntil && ts > b.mktUntil) { b.mktDay = 0; b.mktUntil = 0; }
    b.cash += profit; b.life = (b.life || 0) + profit; b.lifeRev = (b.lifeRev || 0) + rev;
    b.hist.push([ts, Math.round(rev), Math.round(profit)]); if (b.hist.length > 90) b.hist.shift();
    if (note) { note.t = ts; b.log.unshift(note); if (b.log.length > 20) b.log.length = 20; }
    return note;
  }
  function tick() {
    const L = owned(); if (!L.length) return false; const now = Date.now(), D = DAY(); let ch = false, notes = [];
    L.forEach(b => { let n = 0; while (now - b.last >= D && n < 400) { b.last += D; const nt = oneDay(b, b.last); if (nt) notes.push([b, nt]); n++; ch = true; } if (n >= 400) b.last = now; });
    if (ch) { A().saveW(); notes.slice(-2).forEach(x => A().toast(x[1].ic, x[0].name + ': ' + x[1].txt, x[1].amt ? (x[1].amt > 0 ? '+' : '') + full(x[1].amt) : null, x[1].amt < 0 ? 'bad' : 'info')); }
    return ch;
  }
  const solOf = usd => usd / Sim.solUsd;
  function trailing(b, days) { const h = b.hist.slice(-days); if (!h.length) return null; return { rev: h.reduce((a, x) => a + x[1], 0), pro: h.reduce((a, x) => a + x[2], 0), n: h.length }; }
  function annualSDE(b) { const t = trailing(b, 60); const base = b.rev * (b.m + (b.perm || 0)); if (!t || t.n < 20) return base; const est = (t.pro + b.mgr / 365 * t.n) / t.n * 365; return est * .6 + base * .4; }
  function value(b) { return Math.max(0, annualSDE(b) * b.mult * (b.mkt || 1)); }
  function offer(b) { return value(b) * .9; } // 10% broker fee
  const Biz = {
    T, LIST, BY, art, money, full, owned,
    netWorthSol() { return owned().reduce((a, b) => a + solOf(offer(b) + b.cash), 0); },
    count() { return owned().length; },
    chips() { const cats = [['all', 'All'], ['food', 'Food & drink'], ['auto', 'Car & fuel'], ['services', 'Services'], ['retail', 'Retail'], ['online', 'Online'], ['realestate', 'With real estate']]; return cats; },
    cat(k) { return { coffee: 'food', restaurant: 'food', pizza: 'food', truck: 'food', bar: 'food', club: 'food', bakery: 'food', burger: 'food', selfwash: 'auto', tunnelwash: 'auto', gas: 'auto', autorepair: 'auto', dealer: 'auto', laundromat: 'services', barber: 'services', gym: 'services', daycare: 'services', vending: 'services', cstore: 'retail', liquor: 'retail', smoke: 'retail', ecom: 'online', saas: 'online', storage: 'realestate', motel: 'realestate' }[k]; },
    list(SH) { const q = SH.q; let l = LIST.filter(x => (SH.f === 'all' || Biz.cat(x.type) === SH.f) && (!q || (x.name + ' ' + T[x.type].l + ' ' + x.place).toLowerCase().indexOf(q) >= 0)); const key = { pa: x => x.price, pd: x => -x.price, perf: x => -(x.sde - x.mgr), new: x => -((x.sde - x.mgr) / x.price) }[SH.sort] || (x => x.price); return l.sort((a, b) => key(a) - key(b)); },
    card(x) {
      const t = T[x.type], cf = x.sde - x.mgr, pb = cf > 0 ? x.price / cf : Infinity;
      return '<div class="shopc glass" data-m="' + x.id + '"><div class="art">' + art(x) + '</div><div class="sc-b"><div class="sc-t"><b>' + t.ic + ' ' + G.App.esc(x.name) + '</b><span class="mu">' + x.place + '</span></div>' +
        '<div class="specs"><span>' + t.l + '</span><span>' + x.yrs + ' yrs</span><span>' + x.emp + ' staff</span>' + risk(x) + '</div>' +
        '<div class="bizk"><div><span>Revenue / yr</span><b>' + money(x.rev) + '</b></div><div><span>Owner earnings</span><b>' + money(x.sde) + '</b></div><div><span>Your cash flow*</span><b class="' + (cf > 0 ? 'up' : 'dn') + '">' + money(cf) + '</b></div><div><span>Payback</span><b>' + (isFinite(pb) ? pb.toFixed(1) + ' yrs' : '—') + '</b></div></div>' +
        '<div class="mu" style="font-size:11.5px;margin-top:6px">' + t.why + ' ' + x.why + '. *After paying a manager ' + money(x.mgr) + '/yr.</div>' +
        '<div class="sc-p"><b>' + full(x.price) + '</b><span class="num">◎ ' + G.App.fSol(solOf(x.price * 1.03)) + ' incl. closing</span></div>' +
        '<div class="sc-btns"><button class="big-btn buy sm" data-a="buy">Buy business</button></div></div></div>';
    },
    buyFlow(id, btn) {
      const x = BY[id], t = T[x.type], App = A(); if (!x) return;
      if (owned().some(b => b.lid === id)) return App.toast('🏪', 'You already own ' + x.name, null, 'info');
      const close = x.price * .03, tot = x.price + close, cost = solOf(tot);
      const cf = x.sde - x.mgr;
      const o = ov('<h4>' + t.ic + ' Buy ' + App.esc(x.name) + '</h4><div class="pp-art">' + art(x) + '</div>' +
        '<div class="pl">' + row('Asking price', full(x.price)) + row('Closing, legal & due diligence (3%)', full(close)) + row('<b>Total</b>', '<b>' + full(tot) + ' · ◎ ' + App.fSol(cost) + '</b>') +
        '<div class="plh">Last 12 months (seller\'s books)</div>' + row('Revenue', full(x.rev)) + row('Cost of goods', '-' + full(x.rev * t.cost[0])) + row('Staff wages', '-' + full(x.rev * t.cost[1])) + row('Rent & occupancy', '-' + full(x.rev * t.cost[2])) + row('Other (utilities, insurance, fees…)', '-' + full(Math.max(0, x.rev - x.sde - x.rev * (t.cost[0] + t.cost[1] + t.cost[2])))) + row('<b>Owner earnings (SDE)</b>', '<b>' + full(x.sde) + '</b>') + row('Manager so you don\'t work there', '-' + full(x.mgr)) + row('<b>Your yearly cash flow</b>', '<b class="' + (cf > 0 ? 'up' : 'dn') + '">' + full(cf) + '</b>') + row('≈ per month', full(cf / 12)) + '</div>' +
        '<div class="mu" style="font-size:11.5px;margin:8px 2px 12px;line-height:1.45">Real businesses have slow days, repairs, staff turnover and good streaks. Daily results swing around the average. Clock: ' + (SPEED() === 'fast' ? '<b>fast</b> (1 hour = 1 business day)' : '<b>real time</b> (1 day = 1 day)') + '.</div>' +
        '<div class="mbtns"><button id="bzNo">Cancel</button><button id="bzGo" class="buyb">Buy · ◎ ' + App.fSol(cost) + '</button></div>');
      o.querySelector('#bzNo').onclick = () => o.classList.remove('on');
      o.querySelector('#bzGo').onclick = () => {
        if (cost > W().sol) { App.SND.err(); return App.toast('◎', 'Not enough SOL', 'You need ◎ ' + App.fSol(cost), 'bad'); }
        o.classList.remove('on'); W().sol -= cost;
        owned().push({ id: 'z' + Date.now(), lid: x.id, type: x.type, name: x.name, place: x.place, price: x.price, paid: tot, rev: x.rev, m: x.m, mult: x.mult, mgr: x.mgr, cash: 0, last: Date.now(), bought: Date.now(), hist: [], log: [{ ic: '🤝', txt: 'Bought for ' + full(tot), amt: 0, t: Date.now() }], mods: [], trend: 1, perm: 0 });
        App.saveW(); App.renderBal(true);
        if (btn) { const [bx, by] = App.center(btn); App.FX.burst(bx, by, { n: 60, cols: ['#1fd38c', App.T.a1, '#fff'], sp: 9, type: 'star', life: 60 }); App.FX.flash('#1fd38c'); }
        App.SND.cash(); App.hap(40); App.toast(t.ic, 'You own ' + x.name + ' now', 'Profits land in its cash balance. Collect them anytime.', 'ok');
        Biz.renderOwned(true);
      };
    },
    renderOwned(force) {
      const box = document.getElementById('ownBiz'); if (!box) return; const L = owned(), App = A();
      const k = L.map(b => b.id + ':' + Math.round(b.cash) + ':' + b.hist.length).join(',') + SPEED();
      if (box._k === k && !force) return; box._k = k;
      const clock = '<div class="bzclock"><span class="mu">Business clock</span><div class="minis" id="bzSpeed"><button data-v="real"' + (SPEED() === 'real' ? ' class="on"' : '') + '>Real time</button><button data-v="fast"' + (SPEED() === 'fast' ? ' class="on"' : '') + '>Fast · 1h = 1 day</button></div></div>';
      box.innerHTML = clock + (L.length ? L.map(b => { const t = T[b.type], m30 = trailing(b, 30), today = b.hist[b.hist.length - 1]; return '<div class="bzo glass" data-id="' + b.id + '"><div class="bzo-ic">' + t.ic + '</div><div class="bzo-b"><b>' + App.esc(b.name) + '</b><span class="mu">' + t.l + ' · ' + b.place + '</span>' + spark(b) + '</div><div class="bzo-r"><span class="mu">' + (m30 ? (m30.n < 30 ? m30.n + 'd' : '30d') + ' profit' : 'just bought') + '</span><b class="num ' + (m30 && m30.pro < 0 ? 'dn' : 'up') + '">' + (m30 ? money(m30.pro) : '—') + '</b><button class="sbtn sm bzcol"' + (Math.abs(b.cash) < 1 ? ' disabled' : '') + '>' + (b.cash >= 0 ? 'Collect ' + money(b.cash) : 'Cover ' + money(b.cash)) + '</button></div></div>'; }).join('') : '<div class="empty" style="padding:14px">No businesses yet. Buy one below and let it earn while you trade 🏪</div>');
    },
    collect(b, btn) {
      const App = A(), sol = solOf(b.cash);
      if (sol < 0 && -sol > W().sol) return App.toast('◎', 'Not enough SOL to cover the loss', null, 'bad');
      W().sol += sol; const amt = b.cash; b.cash = 0; b.log.unshift({ ic: amt >= 0 ? '💵' : '💸', txt: amt >= 0 ? 'Collected profits' : 'Covered losses', amt: -amt, t: Date.now() });
      App.saveW(); App.renderBal(true);
      if (btn && amt > 0) { const [x, y] = App.center(btn); App.FX.burst(x, y, { n: 30, cols: ['#1fd38c', '#ffc94d', '#fff'], sp: 6, type: 'star' }); App.SND.cash(); }
      App.toast(amt >= 0 ? '💵' : '💸', (amt >= 0 ? 'Collected ' : 'Covered ') + full(Math.abs(amt)) + ' from ' + b.name, (sol >= 0 ? '+' : '') + '◎ ' + App.fSol(sol), amt >= 0 ? 'ok' : 'bad');
      Biz.renderOwned(true);
    },
    menu(b) {
      const App = A(), t = T[b.type], L = BY[b.lid] || { type: b.type, seed: 1, name: b.name, rev: b.rev, tod: 'day' }, m30 = trailing(b, 30), all = trailing(b, 90), v = offer(b);
      const ys = annualSDE(b) - b.mgr;
      const o = ov('<h4>' + t.ic + ' ' + App.esc(b.name) + '</h4><div class="pp-art">' + art(L) + '</div>' +
        '<div class="bizk"><div><span>Cash in business</span><b class="' + (b.cash < 0 ? 'dn' : 'up') + '">' + full(b.cash) + '</b></div><div><span>Last 30 days</span><b class="' + (m30 && m30.pro < 0 ? 'dn' : 'up') + '">' + (m30 ? money(m30.pro) : '—') + '</b></div><div><span>Revenue 30d</span><b>' + (m30 ? money(m30.rev) : '—') + '</b></div><div><span>Run-rate / yr</span><b>' + money(ys) + '</b></div></div>' +
        bigSpark(b) +
        '<div class="plh">Recent events</div><div class="bzlog">' + (b.log.slice(0, 6).map(e => '<div><span>' + e.ic + '</span><span>' + App.esc(e.txt) + '</span><b class="' + (e.amt < 0 ? 'dn' : e.amt > 0 ? 'up' : '') + '">' + (e.amt ? (e.amt > 0 ? '+' : '') + money(e.amt) : '') + '</b></div>').join('') || '<div class="mu">Nothing yet.</div>') + '</div>' +
        '<div class="plh">Marketing</div><div class="mbtns" style="flex-wrap:wrap" id="bzMk">' + [.005, .015, .04].map(p2 => { const amt = Math.round(b.rev * p2 / 500) * 500; return '<button data-amt="' + amt + '">' + money(amt) + ' campaign</button>'; }).join('') + '</div>' +
        '<div class="mu" style="font-size:11px;margin:4px 2px 10px">Results vary: some campaigns pay back 3x, some barely cover the cost. Lasts 30 business days.</div>' +
        '<div class="mbtns" style="flex-wrap:wrap"><button id="bzCol" class="buyb"' + (Math.abs(b.cash) < 1 ? ' disabled' : '') + '>' + (b.cash >= 0 ? 'Collect ' + money(b.cash) : 'Cover ' + money(b.cash)) + '</button><button id="bzFlex">📸 Flex</button><button id="bzSell">Sell · ' + money(v) + '</button><button id="bzNo">Close</button></div>' +
        '<div class="mu" style="font-size:11px;margin-top:8px">Sale offer = trailing owner earnings × ' + b.mult.toFixed(1) + ' minus a 10% broker fee. Bought for ' + full(b.paid) + '.</div>');
      o.querySelector('#bzNo').onclick = () => o.classList.remove('on');
      o.querySelector('#bzCol').onclick = e => { o.classList.remove('on'); Biz.collect(b, e.target); };
      o.querySelector('#bzMk').onclick = e => { const bt = e.target.closest('button'); if (!bt) return; const amt = +bt.dataset.amt; if (solOf(amt) > W().sol) return App.toast('◎', 'Not enough SOL', null, 'bad'); W().sol -= solOf(amt); const roas = Math.exp(gauss() * .55 + Math.log(1.8)); const extra = amt * roas, days = 30, r0 = b.rev / 365; b.mods = b.mods || []; b.mods.push({ m: 1 + extra / (days * r0), until: Date.now() + days * DAY() }); b.log.unshift({ ic: '📣', txt: 'Ran a ' + money(amt) + ' marketing campaign', amt: -amt, t: Date.now() }); App.saveW(); App.renderBal(true); App.SND.ok(); App.toast('📣', 'Campaign live for ' + b.name, 'You\'ll see the effect in the daily numbers', 'ok'); o.classList.remove('on'); Biz.renderOwned(true); };
      o.querySelector('#bzSell').onclick = () => { o.classList.remove('on'); const net = v + b.cash; W().sol += solOf(net); const w = W(); w.biz = owned().filter(x => x.id !== b.id); App.saveW(); App.renderBal(true); App.SND.sell(); const gain = net - b.paid + (b.life || 0) - b.cash; App.toast('🤝', 'Sold ' + b.name + ' for ' + full(v), 'Total result incl. profits: ' + (gain >= 0 ? '+' : '') + full(gain), gain >= 0 ? 'ok' : 'bad'); Biz.renderOwned(true); };
      o.querySelector('#bzFlex').onclick = () => { o.classList.remove('on'); App.life.post(pick(['just bought a ' + t.l.toLowerCase() + ' in ' + b.place + ' 🏪 cash flow > memecoins', 'business owner era. ' + b.name + ' is mine now', 'took memecoin profits and bought ' + b.name + '. real yield', 'my ' + t.l.toLowerCase() + ' made ' + money(Math.max(0, (trailing(b, 30) || { pro: 0 }).pro)) + ' this month while i traded']), { img: { k: 'biz', id: b.lid } }); App.toast('📸', 'Posted on X', null, 'ok'); };
    },
    tick,
    setSpeed(v) { try { localStorage.setItem('gp_biz_speed', v); } catch (e) { } const n = Date.now(); owned().forEach(b => b.last = n); A().saveW(); Biz.renderOwned(true); }
  };
  if (typeof document !== 'undefined') setInterval(() => { const App = G.App; if (App && App.W && Biz.tick() && App.VIEW === 'life') Biz.renderOwned(); }, 5000);
  function risk(x) { const cm = (x.sde - x.mgr) / x.rev, v = T[x.type].vol; const r = cm < .04 || (cm < .08 && v > .15) ? ['High risk', 'rk-h'] : cm < .12 || v > .18 ? ['Medium risk', 'rk-m'] : ['Low risk', 'rk-l']; return '<span class="' + r[1] + '">' + r[0] + '</span>'; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function row(a, b) { return '<div class="plr"><span>' + a + '</span><span>' + b + '</span></div>'; }
  function spark(b) { const h = b.hist.slice(-30); if (h.length < 2) return '<div class="bzsp"></div>'; const v = h.map(x => x[2]), mx = Math.max(1, ...v.map(Math.abs)); return '<svg class="bzsp" viewBox="0 0 120 26" preserveAspectRatio="none"><path d="M0,13 L120,13" stroke="rgba(255,255,255,.15)"/>' + v.map((p2, i) => '<rect x="' + f(i * 120 / v.length) + '" y="' + f(p2 >= 0 ? 13 - p2 / mx * 12 : 13) + '" width="' + f(120 / v.length - 1) + '" height="' + f(Math.abs(p2) / mx * 12 + .5) + '" fill="' + (p2 >= 0 ? '#1fd38c' : '#ff3355') + '"/>').join('') + '</svg>'; }
  function bigSpark(b) { const h = b.hist.slice(-60); if (h.length < 2) return '<div class="mu" style="font-size:12px;margin:8px 0">Daily results will show up here.</div>'; return '<div class="plh">Daily profit (last ' + h.length + ' days)</div>' + spark({ hist: h }).replace('class="bzsp"', 'class="bzsp big"'); }
  function ov(html) { let o = document.getElementById('ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; document.body.appendChild(o); o.addEventListener('click', e => { if (e.target.id === 'ov') o.classList.remove('on'); }); } o.innerHTML = '<div class="mbox">' + html + '</div>'; o.classList.add('on'); return o; }
  G.Biz = Biz;
})(typeof window !== 'undefined' ? window : globalThis);
