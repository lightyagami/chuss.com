export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time?: number;
  white: {
    username: string;
    rating?: number;
    result?: string;
  };
  black: {
    username: string;
    rating?: number;
    result?: string;
  };
}

export interface ChessComLiveGame {
  url: string;
  fen: string;
  turn: 'white' | 'black';
  move_by?: number;
  time_control: string;
  time_class?: string;
  rated?: boolean;
  pgn?: string;
  white: string;
  black: string;
}

export async function fetchLatestGameByUsername(username: string): Promise<{ pgn: string; game: ChessComGame }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    throw new Error('Please enter a valid Chess.com username.');
  }

  const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUsername)}/games/archives`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (archivesRes.status === 404) {
    throw new Error(`User "${cleanUsername}" was not found on Chess.com.`);
  }

  if (!archivesRes.ok) {
    throw new Error(`Failed to fetch archives for "${cleanUsername}" (status ${archivesRes.status}).`);
  }

  const archivesData = await archivesRes.json();
  const archives: string[] = archivesData?.archives || [];

  if (archives.length === 0) {
    throw new Error(`No games found in the archive for "${cleanUsername}".`);
  }

  for (let i = archives.length - 1; i >= 0; i--) {
    const monthUrl = archives[i];
    const monthRes = await fetch(monthUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!monthRes.ok) continue;

    const monthData = await monthRes.json();
    const games: ChessComGame[] = monthData?.games || [];

    if (games.length > 0) {
      const latestGame = games[games.length - 1];
      if (latestGame.pgn) {
        return {
          pgn: latestGame.pgn,
          game: latestGame,
        };
      }
    }
  }

  throw new Error(`No games with PGN data found for "${cleanUsername}".`);
}

export async function fetchOngoingGames(username: string): Promise<ChessComLiveGame[]> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) return [];

  try {
    const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUsername)}/games`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data?.games || [];
  } catch {
    return [];
  }
}
