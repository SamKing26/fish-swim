const LEADERBOARD_KEY = "fish-swim:leaderboard";
const MAX_ENTRIES = 10;
const MAX_STORED_ENTRIES = 200;

function isConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function sanitizeName(value) {
  return String(value || "Player")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .slice(0, 16) || "Player";
}

function sanitizeScore(value) {
  return Math.max(0, Math.min(9_999_999, Math.floor(Number(value) || 0)));
}

async function upstashCommand(...segments) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const url = `${baseUrl}/${segments.map((segment) => encodeURIComponent(String(segment))).join("/")}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload?.result;
}

function parseLeaderboardResult(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const entries = [];
  for (let index = 0; index < rawEntries.length; index += 2) {
    try {
      const parsed = JSON.parse(rawEntries[index]);
      entries.push({
        name: sanitizeName(parsed?.name),
        score: sanitizeScore(rawEntries[index + 1]),
      });
    } catch {
      // Ignore malformed rows to keep the endpoint resilient.
    }
  }

  return entries
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

async function readLeaderboard() {
  const rawEntries = await upstashCommand(
    "ZRANGE",
    LEADERBOARD_KEY,
    0,
    MAX_ENTRIES - 1,
    "REV",
    "WITHSCORES",
  );
  return parseLeaderboardResult(rawEntries);
}

async function trimLeaderboard() {
  await upstashCommand(
    "ZREMRANGEBYRANK",
    LEADERBOARD_KEY,
    0,
    -(MAX_STORED_ENTRIES + 1),
  );
}

async function writeScore(name, score) {
  const member = JSON.stringify({
    id: crypto.randomUUID(),
    name: sanitizeName(name),
    score: sanitizeScore(score),
    createdAt: Date.now(),
  });

  await upstashCommand("ZADD", LEADERBOARD_KEY, sanitizeScore(score), member);
  await trimLeaderboard();
  return readLeaderboard();
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!isConfigured()) {
      return res.status(200).json({ entries: [], configured: false });
    }

    try {
      const entries = await readLeaderboard();
      return res.status(200).json({ entries, configured: true });
    } catch {
      return res.status(500).json({ entries: [], configured: true });
    }
  }

  if (req.method === "POST") {
    const name = sanitizeName(req.body?.name);
    const score = sanitizeScore(req.body?.score);

    if (!score) {
      return res.status(400).json({ error: "Invalid score", entries: [] });
    }

    if (!isConfigured()) {
      return res.status(503).json({ error: "Leaderboard storage not configured", entries: [] });
    }

    try {
      const entries = await writeScore(name, score);
      return res.status(200).json({ entries, configured: true });
    } catch {
      return res.status(500).json({ error: "Failed to write leaderboard", entries: [] });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed", entries: [] });
}
