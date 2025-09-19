import { generateUserInsights, GENRE_MAP } from "./gemini";
import { fetchDataFromApi } from "./api";

const CACHE_KEY = "cinemate_ai_insights_cache_v1";

const hashInput = (obj) => {
  try {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  } catch {
    return String(Date.now());
  }
};

const genreIdToNameMap = () => {
  const reverse = {};
  Object.entries(GENRE_MAP).forEach(([name, id]) => {
    reverse[id] = name;
  });
  return reverse;
};

const topGenreIds = (allItems, max = 5) => {
  const counts = {};
  (allItems || []).forEach((m) => {
    (m.genre_ids || []).forEach((gid) => {
      counts[gid] = (counts[gid] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([gid]) => Number(gid));
};

const sampleTitles = (allItems, max = 20) => {
  return (allItems || [])
    .slice(-max)
    .map((m) => m.title || m.name)
    .filter(Boolean);
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (obj) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {}
};

export const clearAIInsightsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
};

const buildDiscoverParams = (keywords = [], genreNames = [], mediaType) => {
  const genreIds = (genreNames || [])
    .map((name) => GENRE_MAP[(name || "").toLowerCase()])
    .filter(Boolean);
  const params = {
    sort_by: "popularity.desc",
    with_genres: genreIds.slice(0, 3).join(","),
    page: 1,
  };
  return params;
};

const uniqueById = (arr) => {
  const seen = new Set();
  const out = [];
  (arr || []).forEach((it) => {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  });
  return out;
};

export const computeInsightsInput = (
  favorites = [],
  watchLater = [],
  watched = []
) => {
  const all = [...favorites, ...watchLater, ...watched];
  return {
    counts: {
      favorites: favorites.length,
      watchLater: watchLater.length,
      watched: watched.length,
    },
    topGenresById: topGenreIds(all, 5),
    titlesSample: sampleTitles(all, 20),
    genreIdToName: genreIdToNameMap(),
  };
};

export const getAIInsightsWithRecommendations = async (
  favorites,
  watchLater,
  watched,
  { mediaType = "movie" } = {}
) => {
  const input = computeInsightsInput(favorites, watchLater, watched);
  const stableKey = hashInput({ ...input, mediaType });
  const cache = readCache();
  if (cache[stableKey]) {
    return cache[stableKey];
  }

  const insights = await generateUserInsights(input);
  if (!insights) return null;

  let results = [];
  try {
    const params = buildDiscoverParams(
      insights.suggestedKeywords,
      insights.topGenres,
      mediaType
    );
    const endpoint = mediaType === "tv" ? "/discover/tv" : "/discover/movie";
    const data = await fetchDataFromApi(endpoint, params);
    if (data?.results?.length) results = data.results;
  } catch {}

  if (!results.length) {
    try {
      const endpoint =
        mediaType === "tv" ? "/tv/top_rated" : "/movie/top_rated";
      const data = await fetchDataFromApi(endpoint, { page: 1 });
      results = data?.results || [];
    } catch {}
  }

  const ownedIds = new Set(
    [...favorites, ...watchLater, ...watched].map((m) => m.id)
  );
  const recommended = uniqueById(results)
    .filter((r) => !ownedIds.has(r.id))
    .slice(0, 20);

  const payload = { insights, recommended };
  cache[stableKey] = payload;
  writeCache(cache);
  return payload;
};
