const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchJsonOnce(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'ChessMoveAnalyzerFullArchiver/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fetchJson(url, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const data = await fetchJsonOnce(url);
    if (data !== null) return data;
    if (attempt < maxRetries) {
      const backoffMs = (attempt + 1) * 800;
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
  return null;
}

// Concurrency pool runner
async function pMap(array, fn, concurrency = 5) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < array.length) {
      const i = index++;
      results[i] = await fn(array[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, array.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function downloadUserGames(username) {
  console.log(`\nFetching full archive index for "${username}"...`);
  const archiveIndex = await fetchJson(`https://api.chess.com/pub/player/${username.toLowerCase()}/games/archives`);
  const urls = archiveIndex?.archives || [];
  console.log(`Found ${urls.length} archive months for "${username}". Downloading all months...`);

  const monthlyResults = await pMap(urls, async (url, idx) => {
    const monthData = await fetchJson(url);
    const monthStr = url.split('/').slice(-2).join('-');
    if (!monthData) {
      console.warn(`[${username}] WARNING: Failed to fetch month ${monthStr} (${idx + 1}/${urls.length}) after retries.`);
      return [];
    }
    const games = monthData.games || [];
    const pgns = games.map(g => g.pgn).filter(Boolean);
    console.log(`[${username}] Month ${monthStr} (${idx + 1}/${urls.length}): ${pgns.length} games`);
    return pgns;
  }, 4);

  const allPgns = monthlyResults.flat();
  return allPgns;
}

const targetDir = path.join(__dirname, '..', 'test_pgns');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function main() {
  console.log('====================================================');
  console.log('DOWNLOADING 100% COMPLETE MATCH HISTORIES LOCALLY');
  console.log('====================================================');

  // 1. 100LoseStreak
  const loseStreakPgns = await downloadUserGames('100LoseStreak');
  const loseStreakFile = path.join(targetDir, '100losestreak_all_games.pgn');
  fs.writeFileSync(loseStreakFile, loseStreakPgns.join('\n\n\n'), 'utf8');
  console.log(`\n-> SAVED 100LoseStreak: ${loseStreakPgns.length} games to ${loseStreakFile} (${(fs.statSync(loseStreakFile).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 2. demonexe2
  const demonexePgns = await downloadUserGames('demonexe2');
  const demonexeFile = path.join(targetDir, 'demonexe2_all_games.pgn');
  fs.writeFileSync(demonexeFile, demonexePgns.join('\n\n\n'), 'utf8');
  console.log(`\n-> SAVED demonexe2: ${demonexePgns.length} games to ${demonexeFile} (${(fs.statSync(demonexeFile).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 3. ccobb09
  const ccobbPgns = await downloadUserGames('ccobb09');
  const ccobbFile = path.join(targetDir, 'ccobb09_all_games.pgn');
  fs.writeFileSync(ccobbFile, ccobbPgns.join('\n\n\n'), 'utf8');
  console.log(`\n-> SAVED ccobb09: ${ccobbPgns.length} games to ${ccobbFile} (${(fs.statSync(ccobbFile).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 4. Combined Master Archive
  const masterList = [...loseStreakPgns, ...demonexePgns, ...ccobbPgns];
  const masterFile = path.join(targetDir, 'all_users_complete_archive.pgn');
  fs.writeFileSync(masterFile, masterList.join('\n\n\n'), 'utf8');
  console.log(`\n-> SAVED MASTER ARCHIVE: ${masterList.length} total games to ${masterFile} (${(fs.statSync(masterFile).size / (1024 * 1024)).toFixed(2)} MB)`);

  // Create a summary manifest JSON
  const manifest = {
    downloadedAt: new Date().toISOString(),
    totalGames: masterList.length,
    users: {
      '100LoseStreak': {
        gamesCount: loseStreakPgns.length,
        file: '100losestreak_all_games.pgn',
        sizeBytes: fs.statSync(loseStreakFile).size,
      },
      'demonexe2': {
        gamesCount: demonexePgns.length,
        file: 'demonexe2_all_games.pgn',
        sizeBytes: fs.statSync(demonexeFile).size,
      },
      'ccobb09': {
        gamesCount: ccobbPgns.length,
        file: 'ccobb09_all_games.pgn',
        sizeBytes: fs.statSync(ccobbFile).size,
      },
    },
  };

  const manifestFile = path.join(targetDir, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest written to ${manifestFile}`);

  console.log('\n====================================================');
  console.log(`FINISHED! All ${masterList.length} matches across all history are saved locally.`);
  console.log('====================================================');
}

main();
