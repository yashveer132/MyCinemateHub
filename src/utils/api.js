import axios from "axios";

const BASE_URL = "https://api.themoviedb.org/3";

const TMDB_TOKEN = import.meta.env.VITE_APP_TMDB_TOKEN;

const headers = {
  Authorization: "bearer " + TMDB_TOKEN,
};

export const fetchDataFromApi = async (url, params) => {
  try {
    const { data } = await axios.get(BASE_URL + url, {
      headers,
      params,
    });
    return data;
  } catch (error) {
    return null;
  }
};

const TMDB_GENRES = {
  action: { id: 28, keywords: ["action", "fighting", "explosive", "combat"] },
  adventure: {
    id: 12,
    keywords: ["adventure", "quest", "journey", "expedition"],
  },
  animation: {
    id: 16,
    keywords: ["animation", "animated", "cartoon", "anime"],
  },
  comedy: {
    id: 35,
    keywords: ["comedy", "funny", "humor", "hilarious", "laugh"],
  },
  crime: {
    id: 80,
    keywords: ["crime", "criminal", "heist", "police", "detective"],
  },
  documentary: { id: 99, keywords: ["documentary", "real", "true story"] },
  drama: { id: 18, keywords: ["drama", "dramatic", "emotional"] },
  family: { id: 10751, keywords: ["family", "kids", "children"] },
  fantasy: { id: 14, keywords: ["fantasy", "magical", "myth", "mythical"] },
  history: { id: 36, keywords: ["history", "historical", "period"] },
  horror: {
    id: 27,
    keywords: ["horror", "scary", "spooky", "terror", "frightening"],
  },
  music: { id: 10402, keywords: ["music", "musical", "song", "concert"] },
  mystery: {
    id: 9648,
    keywords: ["mystery", "mysterious", "puzzle", "suspense"],
  },
  romance: {
    id: 10749,
    keywords: ["romance", "romantic", "love", "relationship"],
  },
  scifi: {
    id: 878,
    keywords: ["sci-fi", "science fiction", "future", "space"],
  },
  thriller: { id: 53, keywords: ["thriller", "suspense", "tension"] },
  war: { id: 10752, keywords: ["war", "military", "battle", "soldier"] },
  western: { id: 37, keywords: ["western", "cowboy", "wild west"] },
};

export const getFallbackResults = async (query) => {
  try {
    const words = query.toLowerCase().split(" ");

    const matchedGenres = [];
    Object.entries(TMDB_GENRES).forEach(([genre, data]) => {
      if (data.keywords.some((keyword) => words.includes(keyword))) {
        matchedGenres.push(data.id);
      }
    });

    const yearMatch = query.match(/\b(19|20)\d{2}\b/);
    const searchYear = yearMatch
      ? parseInt(yearMatch[0])
      : new Date().getFullYear();

    const searchStrategies = [
      async () => {
        if (matchedGenres.length > 0) {
          return fetchDataFromApi("/discover/movie", {
            with_genres: matchedGenres.join(","),
            primary_release_year: searchYear,
            sort_by: "popularity.desc",
          });
        }
        return null;
      },

      async () => {
        if (matchedGenres.length > 0) {
          return fetchDataFromApi("/discover/movie", {
            with_genres: matchedGenres.join(","),
            primary_release_year: searchYear - 1,
            sort_by: "popularity.desc",
          });
        }
        return null;
      },

      async () => {
        for (const genreId of matchedGenres) {
          const result = await fetchDataFromApi("/discover/movie", {
            with_genres: genreId,
            primary_release_year: searchYear,
            sort_by: "popularity.desc",
          });
          if (result?.results?.length > 0) return result;
        }
        return null;
      },

      async () => {
        return fetchDataFromApi("/search/movie", { query });
      },
    ];

    for (const strategy of searchStrategies) {
      const result = await strategy();
      if (result?.results?.length > 0) {
        const strategyDescription =
          matchedGenres.length > 0
            ? `Showing ${
                matchedGenres.length > 1 ? "multi-genre" : "genre"
              } results for "${query}"`
            : `Showing results for "${query}"`;
        result.fallbackMessage = strategyDescription;
        return result;
      }
    }

    const result = await fetchDataFromApi("/movie/popular");
    result.fallbackMessage =
      "No specific matches found. Here are some popular movies:";
    return result;
  } catch (error) {
    return null;
  }
};

export const getAIDiscoverResults = async (query, searchParams) => {
  try {
    const endpoint = "/discover/movie";
    const data = await fetchDataFromApi(endpoint, {
      ...searchParams.tmdbParams,
      page: 1,
      sort_by: "vote_average.desc",
      vote_count: { gte: 100 },
    });

    const queryTitle = query
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    data.fallbackMessage = `AI-Curated: ${queryTitle}`;
    return data;
  } catch (error) {
    return null;
  }
};
