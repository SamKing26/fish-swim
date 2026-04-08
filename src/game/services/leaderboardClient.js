const LEADERBOARD_ENDPOINT = "/api/leaderboard";
const REQUEST_TIMEOUT_MS = 2800;

function normalizeEntry(entry) {
  return {
    name: String(entry?.name || "Player").slice(0, 16),
    score: Number(entry?.score) || 0,
  };
}

async function requestLeaderboard(path = "", options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LEADERBOARD_ENDPOINT}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (!Array.isArray(payload?.entries)) {
      return null;
    }

    return payload.entries
      .map(normalizeEntry)
      .filter((entry) => entry.score > 0)
      .slice(0, 10);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchGlobalLeaderboard() {
  return requestLeaderboard();
}

export async function submitGlobalLeaderboardScore({ name, score }) {
  return requestLeaderboard("", {
    method: "POST",
    body: JSON.stringify({
      name: String(name || "Player").slice(0, 16),
      score: Math.max(0, Math.floor(Number(score) || 0)),
    }),
  });
}
