import { getAwardsById } from "./awardsDatabase";

const awardsCache = new Map();

export const fetchAwardsData = async (data) => {
  const cacheKey = `${data.id}_${data.media_type || "movie"}`;

  if (awardsCache.has(cacheKey)) {
    return awardsCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const awardsData = getAwardsById(data.id);

      awardsCache.set(cacheKey, awardsData);

      resolve(awardsData);
    }, 100);
  });
};

export const clearAwardsCache = () => {
  awardsCache.clear();
};

export const hasAwardsInCache = (data) => {
  const cacheKey = `${data.id}_${data.media_type || "movie"}`;
  return awardsCache.has(cacheKey);
};
