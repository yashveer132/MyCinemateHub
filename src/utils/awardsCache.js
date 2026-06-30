import { getAwardsById } from "./awardsDatabase";
import { fetchAwardsFromOMDb } from "./api";
import { fetchAwardsFromWikidata } from "./wikidata";

const CACHE_PREFIX = "cinemate_awards_";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const getPersistentCache = (key) => {
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = Date.now();

    if (now - item.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return item.data;
  } catch (e) {
    console.warn("[AWARDS CACHE] Error reading from localStorage:", e);
    return null;
  }
};

const cleanExpiredOrExcessCache = () => {
  try {
    const keys = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    const activeEntries = [];
    keys.forEach((key) => {
      try {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (now - item.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
          } else {
            activeEntries.push({ key, timestamp: item.timestamp });
          }
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });

    const MAX_ENTRIES = 100;
    if (activeEntries.length > MAX_ENTRIES) {
      activeEntries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemoveCount = activeEntries.length - MAX_ENTRIES;
      for (let i = 0; i < toRemoveCount; i++) {
        localStorage.removeItem(activeEntries[i].key);
      }
    }
  } catch (e) {
    console.warn("[AWARDS CACHE] Cache cleanup error:", e);
  }
};

const setPersistentCache = (key, data) => {
  try {
    cleanExpiredOrExcessCache();

    const item = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    console.warn("[AWARDS CACHE] Error writing to localStorage:", e);
  }
};

export const fetchAwardsData = async (data) => {
  const cacheKey = `${data.id}_${data.media_type || "movie"}`;

  const cachedData = getPersistentCache(cacheKey);
  if (cachedData) {
    if (
      cachedData.source === "omdb_ai" ||
      cachedData.source === "ai_only" ||
      (typeof cachedData.summary === "string" &&
        cachedData.summary.includes("AI"))
    ) {
      try {
        localStorage.removeItem(CACHE_PREFIX + cacheKey);
      } catch (e) {}
    } else {
      return {
        ...cachedData,
        isComplete: true,
        source: "cached",
      };
    }
  }

  try {
    const [omdbAwards, manualAwards] = await Promise.all([
      fetchAwardsFromOMDb(
        data.id,
        data.media_type || "movie",
        data.title || null,
        data.year || null,
      ),
      getAwardsById(data.id),
    ]);

    const omdbSummary = omdbAwards?.summary || null;
    const imdbId = omdbAwards?.imdbId || null;

    const initialAwards = manualAwards?.awards || [];
    const initialSummary =
      manualAwards?.summary || omdbSummary || "No award information available";

    return {
      awards: initialAwards,
      summary: initialSummary,
      imdbId: imdbId,
      isComplete: false,
      source: manualAwards ? "local_db" : "omdb",
    };
  } catch (error) {
    console.error("[AWARDS CACHE] Error fetching initial awards:", error);
    const manualAwards = getAwardsById(data.id);
    return {
      awards: manualAwards?.awards || [],
      summary: manualAwards?.summary || "No award information available",
      imdbId: null,
      isComplete: true,
      source: "error_fallback",
    };
  }
};

export const fetchWikidataBackground = async (
  tmdbId,
  mediaType,
  imdbId,
  initialData,
) => {
  const cacheKey = `${tmdbId}_${mediaType || "movie"}`;

  try {
    if (!imdbId) return initialData;

    const wikidataAwards = await fetchAwardsFromWikidata(imdbId);

    if (!wikidataAwards || wikidataAwards.length === 0) {
      const completeData = {
        awards: initialData.awards,
        summary: initialData.summary,
        source: initialData.source,
      };
      setPersistentCache(cacheKey, completeData);
      return { ...completeData, isComplete: true };
    }

    const mergedAwards = [...initialData.awards];

    wikidataAwards.forEach((wikiAward) => {
      const exists = mergedAwards.some(
        (localAward) =>
          localAward.award.toLowerCase() === wikiAward.award.toLowerCase() &&
          localAward.category.toLowerCase() ===
            wikiAward.category.toLowerCase(),
      );
      if (!exists) {
        mergedAwards.push(wikiAward);
      }
    });

    mergedAwards.sort((a, b) => {
      if (a.result !== b.result) {
        return a.result === "Won" ? -1 : 1;
      }
      return b.year - a.year;
    });

    const completeData = {
      awards: mergedAwards,
      summary: initialData.summary,
      source: "omdb_wikidata",
    };

    setPersistentCache(cacheKey, completeData);
    return {
      ...completeData,
      isComplete: true,
    };
  } catch (error) {
    console.error("[WIKIDATA] Background enrichment failed:", error);
    return {
      ...initialData,
      isComplete: true,
    };
  }
};

export const clearAwardsCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.error("[AWARDS CACHE] Failed to clear persistent cache:", e);
  }
};
