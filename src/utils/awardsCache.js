import { getAwardsById } from "./awardsDatabase";
import { fetchAwardsFromOMDb } from "./api";

const awardsCache = new Map();

export const fetchAwardsData = async (data) => {
  const cacheKey = `${data.id}_${data.media_type || "movie"}`;

  if (awardsCache.has(cacheKey)) {
    return awardsCache.get(cacheKey);
  }

  try {
    const omdbAwards = await fetchAwardsFromOMDb(
      data.id,
      data.media_type || "movie"
    );

    if (omdbAwards && omdbAwards.summary) {
      awardsCache.set(cacheKey, omdbAwards);
      return omdbAwards;
    }

    const manualAwards = getAwardsById(data.id);
    if (manualAwards) {
      awardsCache.set(cacheKey, manualAwards);
      return manualAwards;
    }

    const noAwards = { awards: [], summary: null };
    awardsCache.set(cacheKey, noAwards);
    return noAwards;
  } catch (error) {
    console.error("Error fetching awards data:", error);
    const manualAwards = getAwardsById(data.id) || {
      awards: [],
      summary: null,
    };
    awardsCache.set(cacheKey, manualAwards);
    return manualAwards;
  }
};

export const clearAwardsCache = () => {
  awardsCache.clear();
};

export const hasAwardsInCache = (data) => {
  const cacheKey = `${data.id}_${data.media_type || "movie"}`;
  return awardsCache.has(cacheKey);
};
