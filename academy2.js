/* Academy episodes 21–50 (seasons 3–5). Missions use the same flags as academy.js; m: null = quiz only. */
(function () {
  'use strict';
  const AC = window.Academy; if (!AC) return;
  AC.E.push(
    // ---------- Season 3: Don't get scammed ----------
    { t: 'Wallets & seed phrases', em: '🔐', c: [
      ['Your seed phrase IS your money', 'Whoever has your 12 or 24 words controls the wallet. No support team, no "undo". Write it on paper, never in a screenshot, cloud note or chat.'],
      ['Nobody legit asks for it', 'No exchange, dev, mod, "support agent" or airdrop ever needs your seed phrase or private key. Anyone asking is stealing.'],
      ['Burner wallets', 'Real traders keep a small "hot" wallet for trading and keep savings somewhere else, so one bad click can\'t take everything.']],
      q: ['A "support agent" DMs you to fix your wallet and asks for your seed phrase. You...', ['Send it, they\'re helping', 'Block them: real support never asks for it'], 1, 'Asking for a seed phrase is always a theft attempt.'], m: null },
    { t: 'Drainers & fake airdrops', em: '🪤', c: [
      ['Signing = permission', 'A malicious site asks you to "claim" an airdrop. The transaction you sign actually lets it move your tokens. One signature can empty a wallet.'],
      ['Free money is bait', '"Send 1 SOL, get 2 back", surprise tokens in your wallet with a link to "claim value", fake mint sites: all classic drainers.'],
      ['Rule', 'Never connect your wallet to links from DMs, replies or random tokens. Type known URLs yourself.']],
      q: ['A random token appears in your wallet with a website to "claim $500". What is it?', ['Lucky airdrop', 'Most likely a drainer trap'], 1, 'Unsolicited tokens with claim links are bait.'], m: null },
    { t: 'Signal groups & paid calls', em: '📢', c: [
      ['Who profits from calls', 'Many "VIP call" groups buy first, post the coin to paying members, then sell to them. Members are the exit liquidity, and they paid for the privilege.'],
      ['Fake proof', 'Screenshots of huge wins are cherry-picked or faked. You never see the 40 calls that went to zero.'],
      ['Better', 'Learn to read coins yourself. If a call is real, the chart and holder data will show it without paying anyone.']],
      q: ['Why do some call groups make money even when members lose?', ['Subscriptions plus selling to members', 'Luck'], 0, 'They earn from fees and from members buying their bags.'], m: null },
    { t: 'Honeypots & token authorities', em: '🍯', c: [
      ['Can you even sell?', 'A honeypot lets you buy but blocks selling. You watch the price go up and can\'t exit.'],
      ['Mint & freeze authority', 'If the creator can still mint new tokens or freeze wallets, they can dilute you or lock your tokens. Pump.fun coins have these revoked, other launches might not.'],
      ['Check the audit', 'Glasspad shows "Mint revoked / Freeze revoked". On real tools, always check these before buying anything off-launchpad.']],
      q: ['The creator still has mint authority. Risk?', ['None', 'They can print new tokens and dump them'], 1, 'Unlimited supply from the creator = unlimited dilution.'],
      m: ['Open a coin\'s audit and find "Mint revoked".', 'audit'] },
    { t: 'Fake socials & copycats', em: '🎭', c: [
      ['Same name, different coin', 'When a coin pumps, dozens of copies with the same name and ticker launch. Only the contract address (CA) identifies the real one.'],
      ['Fake websites & X accounts', 'Scammers copy a coin\'s site and socials and post a different CA. Always copy the CA from the original source.'],
      ['In Glasspad', 'Clips and posts mention tickers. Before buying, open the coin and check its age, holders and chart: copycats are usually seconds old.']],
      q: ['What actually identifies a token?', ['Its name', 'Its ticker', 'Its contract address'], 2, 'Names and tickers can be copied, the CA can\'t.'],
      m: ['Open a coin from a 🎬 Clip.', 'clipopen'] },
    { t: 'Volume vs market cap', em: '⚖️', c: [
      ['The ratio', 'Healthy new coins trade a lot relative to their size. $50K MC with $200K volume = active. $500K MC with $5K volume = nobody cares.'],
      ['But check who', 'High volume can be bots (🔁 bot volume). Real volume comes from many different wallets.'],
      ['Use it', 'Rising volume + rising unique buyers = attention growing. Falling volume while price holds = calm before a drop.']],
      q: ['$300K MC, $4K volume in the last hour. What does that suggest?', ['Strong coin', 'Very little real interest'], 1, 'Price without volume is easy to push down.'],
      m: ['Open a coin from Trending → 🔥 Hot.', 'open'] },
    { t: 'Holder growth', em: '👥', c: [
      ['Count real holders', 'Holders minus fake dust wallets = real holders. Watch whether that number grows minute by minute.'],
      ['Growth vs concentration', '+30 real holders in 5 minutes with top 10 under 30% = organic. +300 holders with top 10 at 60% = props.'],
      ['Exits', 'When holders start dropping while price looks fine, people are leaving quietly.']],
      q: ['Holders jumped from 50 to 400 in a minute, all tiny balances. Most likely?', ['Viral demand', 'Dust airdrop to fake popularity'], 1, 'Real buyers don\'t arrive as 350 identical micro wallets.'],
      m: ['Open the Holders tab of any coin.', 'holders'] },
    { t: 'The life of a launch', em: '⏱️', c: [
      ['First 60 seconds', 'Snipers and bundles buy, then many sell into the first wave. Most dangerous moment to buy.'],
      ['Minutes 1–10', 'Either real attention arrives (holders, volume, posts) or it fades. Most coins die here.'],
      ['The bonding push', 'Coins near 80–100% bonding attract "bond chasers". Many sell right at migration.']],
      q: ['When is a new coin usually most dangerous to buy?', ['In the first seconds, when snipers sell into buyers', 'After 2 hours'], 0, 'Early buyers are mostly bots waiting for someone to sell to.'], m: null },
    { t: 'Entry styles', em: '🚪', c: [
      ['Early (snipe)', 'Cheapest price, highest rug risk. You\'re competing with bots that are faster than you.'],
      ['Breakout', 'Buy when a coin with clean data breaks its high on rising volume. Higher price, better odds.'],
      ['Dip buy', 'Buy pullbacks on coins that already proved demand. Works in strong coins, kills you in dying ones.']],
      q: ['Which entry fights the fastest bots?', ['Sniping launches', 'Breakouts on clean coins'], 0, 'Sniping is a speed game you will usually lose to bots.'], m: null },
    { t: 'Narratives & metas', em: '🌊', c: [
      ['Themes move together', 'AI coins, animals, political memes, celebrity coins: attention moves in waves. When one theme runs, copies of it launch everywhere.'],
      ['Early vs late in a meta', 'The first good coin of a meta runs, the 50th copy rugs. By the time you see a theme everywhere, it\'s late.'],
      ['Watch the feed', 'Clips and posts show which themes are getting attention right now.']],
      q: ['The 40th copy of a hot meme launches. Typical outcome?', ['Same as the first', 'Usually fades or rugs'], 1, 'Late copies feed on leftover attention.'],
      m: ['Watch 5 clips in 🎬 Clips.', 'clip5'] },
    // ---------- Season 4: Strategy & risk ----------
    { t: 'Position sizing', em: '📏', c: [
      ['The 1–2% rule', 'Risk only 1–2% of your stack on one trade. With 10 SOL, that\'s 0.1–0.2 SOL at risk. Boring, and the reason good traders survive.'],
      ['Why it works', 'Ten losses in a row at 2% costs you ~18%. Ten losses at 25% each wipes you out.'],
      ['In memecoins', 'Assume any single coin can go to zero. Size so a full rug doesn\'t ruin your day.']],
      q: ['You have 10 SOL. A 2%-risk trade risks about...', ['0.2 SOL', '2 SOL', '5 SOL'], 0, '2% of 10 = 0.2.'],
      m: ['Buy with ◎0.1 or less on a coin.', 'smallbuy'] },
    { t: 'Expected value', em: '🧮', c: [
      ['The only number that matters', 'EV = (win rate × average win) − (loss rate × average loss). You can win only 30% of trades and still profit if wins are big and losses small.'],
      ['Example', '30% wins at +100%, 70% losses at −30%: 0.3×100 − 0.7×30 = +9% per trade. Same win rate with −60% losses: −12%.'],
      ['So', 'Cutting losses fast matters more than finding winners.']],
      q: ['40% win rate, avg win +50%, avg loss −50%. EV per trade?', ['+10%', '−10%', '0%'], 1, '0.4×50 − 0.6×50 = −10%.'], m: null },
    { t: 'Risk/reward & stops', em: '🎚️', c: [
      ['Set the stop first', 'Decide where you\'re wrong before buying. If the stop is −30%, the target should be at least +60% (2:1).'],
      ['Logical stops', 'Below the last support, or a time stop: "if it hasn\'t moved in 5 minutes, I\'m out".'],
      ['Never move it lower', 'Moving a stop down to "give it room" is how −30% becomes −90%.']],
      q: ['Your stop is −25%. Minimum sensible target for 2:1?', ['+25%', '+50%', '+10%'], 1, 'Twice the risk.'],
      m: ['Set a stop loss on a position.', 'tpsl'] },
    { t: 'Taking profits', em: '💰', c: [
      ['Scale out', 'Sell in parts: 50% at 2x (initials back), 25% at 3–4x, let the rest ride with a stop.'],
      ['Trailing', 'Raise your stop as price rises so a winner can\'t become a loser.'],
      ['Green is green', 'Nobody sells the top. Selling too early costs a little, never selling costs everything.']],
      q: ['A coin is 3x from your entry. Smart move?', ['Hold all, it can 100x', 'Take some profit, protect the rest'], 1, 'Locking profit removes the round-trip risk.'],
      m: ['Set a take profit on a position.', 'tpsl'] },
    { t: 'Keep a trade journal', em: '📓', c: [
      ['Log every trade', 'Entry reason, red flags, size, exit, result. Glasspad logs the numbers; the "Why you lost/won" card gives you the flags.'],
      ['Review weekly', 'Which setups win? Which lose? Most people find 1–2 habits causing most losses (chasing, oversizing, early snipes).'],
      ['Change one thing', 'Fix the biggest leak first. Then measure again.']],
      q: ['What\'s the point of a journal?', ['Find the habits that lose you money', 'Look cool'], 0, 'You can\'t fix what you don\'t measure.'],
      m: ['Open Wallet and scroll to Activity.', 'activity'] },
    { t: 'Sample size', em: '🎲', c: [
      ['10 trades means nothing', 'Memecoins are noisy. A bad strategy can win 10 in a row, a good one can lose 10 in a row.'],
      ['Think in 100s', 'Judge a strategy after 50–100 trades, not after one great day.'],
      ['That\'s why practice is free here', 'Glasspad lets you rack up hundreds of trades without paying tuition.']],
      q: ['You won 5 trades in a row with a new strategy. Proven?', ['Yes', 'No, sample is far too small'], 1, 'Five results are mostly luck.'],
      m: ['Complete 10 trades (buy + sell) in Glasspad.', 'trades10'] },
    { t: 'Hot vs cold markets', em: '🌡️', c: [
      ['Market heat', 'When SOL is pumping and launches are flying, more coins run. In cold markets, even good coins fade fast.'],
      ['Adjust', 'Hot: more trades, bigger targets. Cold: fewer trades, smaller targets, faster exits.'],
      ['In Glasspad', 'The Pulse bar shows SOL and market heat; the bot chatter follows it too.']],
      q: ['The trenches are cold and nothing is running. Best approach?', ['Trade more to make up for it', 'Trade less, take profits faster'], 1, 'Forcing trades in a dead market bleeds fees and losses.'], m: null },
    { t: 'After migration', em: '🏊', c: [
      ['New pool', 'After bonding, the coin trades in a DEX pool with deeper liquidity. Price moves are slower, bigger money can enter.'],
      ['Different game', 'Fewer snipers, more swing traders and whales. Charts trend longer, but dumps can be large.'],
      ['Same checks', 'Holders, top 10, linked wallets. A bonded coin can still be one cluster.']],
      q: ['Compared to the bonding curve, a migrated pool usually has...', ['Less liquidity', 'More liquidity, slower moves'], 1, 'Deeper pools absorb trades better.'],
      m: ['Open a coin from Pulse → Migrated.', 'migrated'] },
    { t: 'Fees, slippage & priority tuning', em: '🛠️', c: [
      ['Slippage', 'For new coins 15–30% is common so trades land; lower for calm, migrated coins. Too high invites sandwiches.'],
      ['Priority fee', 'Higher = faster and fewer drops, but it\'s paid on every trade. Scalping with high priority fees can cost more than you make.'],
      ['Count it', 'A round trip costs ~2–4% here. Your average win must beat that.']],
      q: ['Why can high priority fees hurt small scalps?', ['They\'re paid every trade and eat small profits', 'They make trades slower'], 0, 'Fees are certain, profits aren\'t.'],
      m: ['Change your slippage or priority fee in Settings.', 'fees'] },
    { t: 'Your edge', em: '🗡️', c: [
      ['What is an edge?', 'Something you do repeatedly that wins on average: a filter, a setup, an exit rule. Without one, you\'re paying fees to gamble.'],
      ['Find it in data', 'Your journal shows which setups have positive EV. Do more of those, stop the rest.'],
      ['Edges fade', 'When everyone uses the same trick, it stops working. Keep measuring.']],
      q: ['You have no setup with positive results after 100 trades. What\'s true?', ['You have no edge yet', 'You\'re due for a win'], 0, 'There\'s no "due": the next trade doesn\'t remember the last.'], m: null },
    // ---------- Season 5: Mind & money ----------
    { t: 'Trading vs gambling', em: '🎰', c: [
      ['The difference', 'Trading: a plan, sizing rules, an exit, a measured edge. Gambling: hoping, chasing, betting more after losses.'],
      ['Warning signs', 'Can\'t stop checking charts, hiding losses, trading with money you need, chasing losses, feeling sick when not trading.'],
      ['If that\'s you', 'Take a real break and talk to someone you trust. It happens to a lot of people, and it\'s better caught early.']],
      q: ['Which is a gambling sign?', ['Following a written plan', 'Doubling bets to win back losses'], 1, 'Loss chasing is the classic sign.'], m: null },
    { t: 'Tilt & loss limits', em: '🛑', c: [
      ['Daily stop', 'Pick a max loss per day (e.g. 5% of your stack). Hit it, you\'re done for the day. No exceptions.'],
      ['After big wins too', 'Overconfidence after a 10x leads to oversized dumb trades. Same rules.'],
      ['Walk away', 'The market is open 24/7. It will still be there tomorrow, your stack might not.']],
      q: ['You hit your daily loss limit. What now?', ['One more trade to get it back', 'Stop for the day'], 1, 'The limit only works if you respect it.'], m: null },
    { t: 'Survivorship bias', em: '🏆', c: [
      ['You only see winners', 'PnL screenshots, Lambo posts, "turned $100 into $1M": you never see the thousands who lost the $100.'],
      ['Larps', 'Many flex posts are faked, rented or cherry-picked. Even in Glasspad, bots larp cars they don\'t own.'],
      ['Real stats', 'The majority of memecoin traders lose money. Plan as if you\'re average until your data proves otherwise.']],
      q: ['Your feed is full of 100x screenshots. What\'s missing?', ['Nothing', 'All the people who lost'], 1, 'Losers don\'t post.'],
      m: ['Post something on X in the Life tab.', 'post'] },
    { t: 'The math of losses', em: '📉', c: [
      ['Losses hurt more', 'Lose 50%, you need +100% to get back. Lose 90%, you need +900%.'],
      ['Ruin', 'If you bet big enough, a normal losing streak wipes you out, even with a good strategy.'],
      ['So', 'Protecting the downside is the whole game. Big wins come to people who are still in the game.']],
      q: ['After a −50% loss, what gain gets you back to even?', ['+50%', '+100%', '+25%'], 1, '50 → 100 needs doubling.'], m: null },
    { t: 'Age, taxes & the law', em: '⚖️', c: [
      ['Age', 'Real exchanges and most crypto apps require you to be 18+ and verify your identity. Glasspad is a simulator, which is the right place to learn first.'],
      ['Taxes', 'In most countries crypto profits are taxable, and every trade can count. Rules differ by country, so check local guidance or ask an adult/advisor.'],
      ['Not legal advice', 'This is general info, not legal or financial advice.']],
      q: ['Are crypto trading profits usually taxable?', ['Never', 'In most countries, yes'], 1, 'Most tax systems treat them as income or gains.'], m: null },
    { t: 'How real wealth is built', em: '🏗️', c: [
      ['Boring works', 'Most wealthy people got there through income (skills, a business), saving, and investing for years, not one lucky trade.'],
      ['Compounding', 'Money that grows steadily keeps growing on its growth. Time is the biggest advantage young people have.'],
      ['Diversify', 'Never put everything in one coin, one app, or one bet. (General education, not financial advice.)']],
      q: ['What builds wealth most reliably over time?', ['One big memecoin bet', 'Skills/income + saving + long-term investing'], 1, 'Reliable beats lucky.'], m: null },
    { t: 'Skills that pay', em: '🧑‍💻', c: [
      ['You already have some', 'Reading data, managing risk, building things (like this app), making content, community building: these pay in real jobs and businesses.'],
      ['Earn, then invest', 'Raising your income is usually faster than growing a small stack by trading.'],
      ['Crypto skills too', 'Builders, designers, analysts and community managers in crypto earn without needing to win trades.']],
      q: ['Fastest way for most people to grow money early on?', ['Grow income with skills', 'Max leverage trades'], 0, 'More income = more to save and invest.'], m: null },
    { t: 'Protect your people', em: '🛡️', c: [
      ['Friends get targeted', 'Scams spread through friends: "I made 10x in this group, join". Often the friend was already scammed.'],
      ['Warn, don\'t shame', 'Share what you learned: seed phrases, drainers, paid calls, rugs.'],
      ['Play together', 'Glasspad has a shared market: compare trades with friends, learn from each other\'s losses for free.']],
      q: ['A friend pushes a "guaranteed 10x" group. Best response?', ['Join quickly', 'Warn them: guaranteed returns are a scam sign'], 1, 'Nothing in memecoins is guaranteed.'],
      m: ['Send a message in 💬 Chat.', 'chat'] },
    { t: 'Your 30-day practice plan', em: '🗓️', c: [
      ['Week 1', 'Only clean-audit coins, fixed size (◎0.1–0.2), TP and SL on every trade. Read every "why" card.'],
      ['Weeks 2–3', 'Pick ONE setup (breakouts on clean coins, or dip buys on bonded coins). 50 trades. Journal each.'],
      ['Week 4', 'Review: win rate, average win/loss, EV. Keep what works, drop what doesn\'t.']],
      q: ['Why fix your size during practice?', ['So results measure your decisions, not luck', 'It\'s required'], 0, 'Changing size hides whether the strategy works.'],
      m: ['Set default TP and SL in Settings.', 'plan'] },
    { t: 'Final exam: your rules', em: '🎓', c: [
      ['Write your rules', 'Max size per trade, daily loss limit, required checks before buying, exit plan, when you stop.'],
      ['Follow them for 100 trades', 'That\'s the real test. Not one great trade.'],
      ['Graduation', 'You now know more than most people trading real memecoins. The smartest thing you can do with that knowledge is protect your money from the people running the game.']],
      q: ['What makes someone last in the trenches?', ['Bigger bets', 'Rules + sizing + discipline', 'Following KOLs'], 1, 'Survive first, then the wins can come.'],
      m: ['Make a full trade with TP/SL on a clean coin.', 'roundtrip'] }
  );
})();
