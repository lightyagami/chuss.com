const fs = require('fs');
const path = require('path');
const https = require('https');
const { Chess } = require('chess.js');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ChessMoveAnalyzerTest/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Ensure test_pgns directory exists
const targetDir = path.join(__dirname, '..', 'test_pgns');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function main() {
  console.log('=== SCRAPING & SAVING ALL TEST PGNS ===');

  // 1. Fetch 100LoseStreak games (recent months 2026/07, 2026/06, 2026/05, 2026/04, 2026/03, etc.)
  console.log('Fetching games for user "100LoseStreak"...');
  const loseStreakPgns = [];
  const loseStreakMonths = [
    'https://api.chess.com/pub/player/100losestreak/games/2026/08',
    'https://api.chess.com/pub/player/100losestreak/games/2026/07',
    'https://api.chess.com/pub/player/100losestreak/games/2026/06',
    'https://api.chess.com/pub/player/100losestreak/games/2026/05',
    'https://api.chess.com/pub/player/100losestreak/games/2026/04',
    'https://api.chess.com/pub/player/100losestreak/games/2026/03',
  ];

  for (const url of loseStreakMonths) {
    try {
      const data = await fetchJson(url);
      if (data?.games) {
        for (const g of data.games) {
          if (g.pgn) loseStreakPgns.push(g.pgn);
        }
      }
    } catch (e) {
      console.warn(`Could not fetch ${url}:`, e.message);
    }
  }

  console.log(`Fetched ${loseStreakPgns.length} games for 100LoseStreak.`);
  const loseStreakFile = path.join(targetDir, '100losestreak_games.pgn');
  fs.writeFileSync(loseStreakFile, loseStreakPgns.join('\n\n\n'), 'utf8');
  console.log(`Saved to ${loseStreakFile} (${(fs.statSync(loseStreakFile).size / 1024).toFixed(1)} KB)`);

  // 2. Fetch demonexe2 games
  console.log('Fetching games for user "demonexe2"...');
  const demonexePgns = [];
  try {
    const data = await fetchJson('https://api.chess.com/pub/player/demonexe2/games/2026/08');
    if (data?.games) {
      for (const g of data.games) {
        if (g.pgn) demonexePgns.push(g.pgn);
      }
    }
  } catch (e) {
    console.warn('Could not fetch demonexe2:', e.message);
  }
  const demonexeFile = path.join(targetDir, 'demonexe2_games.pgn');
  fs.writeFileSync(demonexeFile, demonexePgns.join('\n\n\n'), 'utf8');
  console.log(`Saved ${demonexePgns.length} games to ${demonexeFile} (${(fs.statSync(demonexeFile).size / 1024).toFixed(1)} KB)`);

  // 3. Fetch Hikaru GM games
  console.log('Fetching games for user "hikaru"...');
  const hikaruPgns = [];
  try {
    const data = await fetchJson('https://api.chess.com/pub/player/hikaru/games/2024/01');
    if (data?.games) {
      for (let i = 0; i < Math.min(100, data.games.length); i++) {
        const g = data.games[i];
        if (g.pgn) hikaruPgns.push(g.pgn);
      }
    }
  } catch (e) {
    console.warn('Could not fetch hikaru:', e.message);
  }
  const hikaruFile = path.join(targetDir, 'hikaru_gm_games.pgn');
  fs.writeFileSync(hikaruFile, hikaruPgns.join('\n\n\n'), 'utf8');
  console.log(`Saved ${hikaruPgns.length} games to ${hikaruFile} (${(fs.statSync(hikaruFile).size / 1024).toFixed(1)} KB)`);

  // 4. Save master combined dataset
  const allPgns = [...loseStreakPgns, ...demonexePgns, ...hikaruPgns];
  const allCombinedFile = path.join(targetDir, 'all_combined_test_games.pgn');
  fs.writeFileSync(allCombinedFile, allPgns.join('\n\n\n'), 'utf8');
  console.log(`Saved ALL ${allPgns.length} games to ${allCombinedFile} (${(fs.statSync(allCombinedFile).size / 1024).toFixed(1)} KB)`);

  // 5. Run full stress test on 100LoseStreak games!
  console.log(`\n=== STRESS TESTING ${loseStreakPgns.length} 100LoseStreak GAMES ===`);
  let passed = 0;
  let pliesTested = 0;
  const issues = [];

  for (let i = 0; i < loseStreakPgns.length; i++) {
    const raw = loseStreakPgns[i];
    try {
      const c = new Chess();
      c.loadPgn(raw);
      const moves = c.history({ verbose: true });
      if (moves.length === 0) {
        issues.push({ index: i, note: 'Game with 0 moves (forfeit / abort)' });
        continue;
      }

      const replay = new Chess();
      for (const m of moves) {
        pliesTested++;
        replay.move(m);
        // Ensure legal FEN
        const fen = replay.fen();
        if (!fen || fen.split(' ').length < 4) {
          issues.push({ index: i, error: `Corrupt FEN: ${fen}` });
        }
      }
      passed++;
    } catch (err) {
      issues.push({ index: i, error: err.message });
    }
  }

  console.log(`\n100LoseStreak Results:`);
  console.log(`Passed: ${passed}/${loseStreakPgns.length}`);
  console.log(`Total Moves Tested: ${pliesTested}`);
  console.log(`Aborted / 0-move games: ${issues.filter(x => x.note).length}`);
  console.log(`Errors / Crashes: ${issues.filter(x => x.error).length}`);
  if (issues.filter(x => x.error).length > 0) {
    console.error('Errors found:', issues.filter(x => x.error));
  } else {
    console.log('Zero errors! All valid games parsed and simulated 100% cleanly.');
  }
}

main();
