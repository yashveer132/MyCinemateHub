import axios from "axios";

const BASE_URL = "https://api.themoviedb.org/3";
const OMDB_BASE_URL = import.meta.env.DEV
  ? "/api/omdb"
  : "https://www.omdbapi.com/";

const TMDB_TOKEN = import.meta.env.VITE_APP_TMDB_TOKEN;

const OMDB_API_KEYS = (import.meta.env.VITE_OMDB_API_KEY || "")
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

let currentOmdbKeyIndex = 0;
const rateLimitedKeys = new Set();

const getOmdbApiKey = () => {
  const activeKeys = OMDB_API_KEYS.filter((key) => !rateLimitedKeys.has(key));
  if (activeKeys.length === 0) return null;
  const key = activeKeys[currentOmdbKeyIndex % activeKeys.length];
  currentOmdbKeyIndex = (currentOmdbKeyIndex + 1) % activeKeys.length;
  return key;
};

const fetchFromOmdb = async (params) => {
  const activeKeysCount = OMDB_API_KEYS.filter(
    (key) => !rateLimitedKeys.has(key),
  ).length;
  if (activeKeysCount === 0) {
    return {
      data: { Response: "False", Error: "All OMDb API keys are rate-limited" },
    };
  }

  for (let i = 0; i < activeKeysCount; i++) {
    const apikey = getOmdbApiKey();
    if (!apikey) break;
    try {
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          ...params,
          apikey,
        },
      });

      if (
        response.data?.Response === "False" &&
        response.data?.Error?.toLowerCase().includes("limit reached")
      ) {
        console.warn(
          `[OMDB] Key ${apikey} reached rate limit. Disabling it for this session.`,
        );
        rateLimitedKeys.add(apikey);
        continue;
      }
      return response;
    } catch (error) {
      console.error(
        `[OMDB] Error fetching from OMDb with key ${apikey}:`,
        error.message,
      );
    }
  }

  return {
    data: {
      Response: "False",
      Error: "All OMDb API keys are rate-limited or failed",
    },
  };
};

const normalizeTitle = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const titlesMatch = (omdbTitle, expectedTitle) => {
  if (!omdbTitle || !expectedTitle) return true;
  const norm1 = normalizeTitle(omdbTitle);
  const norm2 = normalizeTitle(expectedTitle);
  if (!norm1 || !norm2) return true;

  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");
  const commonWords = words1.filter((w) => words2.includes(w));
  const overlapRatio =
    commonWords.length / Math.max(words1.length, words2.length);
  return overlapRatio >= 0.5;
};

const extractApiKey = (token) => {
  if (!token || token === "undefined") return null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      return payload.aud;
    }
  } catch (e) {
    console.error("[TMDB] Failed to parse JWT token to extract API key:", e);
  }
  return null;
};

const TMDB_API_KEY =
  import.meta.env.VITE_APP_TMDB_API_KEY || extractApiKey(TMDB_TOKEN);

const loadCache = () => {
  try {
    const saved = localStorage.getItem("imdb_ratings_cache");
    if (saved) {
      return new Map(JSON.parse(saved));
    }
  } catch (e) {
    console.error("[IMDB] Failed to load ratings cache from localStorage:", e);
  }
  return new Map();
};

const imdbRatingsCache = loadCache();

const saveCache = () => {
  try {
    localStorage.setItem(
      "imdb_ratings_cache",
      JSON.stringify(Array.from(imdbRatingsCache.entries())),
    );
  } catch (e) {
    console.error("[IMDB] Failed to save ratings cache to localStorage:", e);
  }
};

const setCacheItem = (key, value) => {
  imdbRatingsCache.set(key, value);
  saveCache();
};

export const clearImdbRatingsCache = () => {
  imdbRatingsCache.clear();
  try {
    localStorage.removeItem("imdb_ratings_cache");
  } catch (e) {}
};

export const fetchDataFromApi = async (url, params) => {
  try {
    const queryParams = { ...params };
    const requestHeaders = {};

    if (TMDB_API_KEY) {
      queryParams.api_key = TMDB_API_KEY;
    } else if (TMDB_TOKEN && TMDB_TOKEN !== "undefined") {
      requestHeaders.Authorization = "bearer " + TMDB_TOKEN;
    }

    const { data } = await axios.get(BASE_URL + url, {
      headers: requestHeaders,
      params: queryParams,
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

export const getFallbackResults = async (query, mediaType = "movie") => {
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

    const discoverEndpoint =
      mediaType === "tv" ? "/discover/tv" : "/discover/movie";
    const searchEndpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
    const popularEndpoint =
      mediaType === "tv" ? "/tv/popular" : "/movie/popular";

    const searchStrategies = [
      async () => {
        if (matchedGenres.length > 0) {
          return fetchDataFromApi(discoverEndpoint, {
            with_genres: matchedGenres.join(","),
            ...(mediaType === "tv"
              ? { first_air_date_year: searchYear }
              : { primary_release_year: searchYear }),
            sort_by: "popularity.desc",
          });
        }
        return null;
      },

      async () => {
        if (matchedGenres.length > 0) {
          return fetchDataFromApi(discoverEndpoint, {
            with_genres: matchedGenres.join(","),
            ...(mediaType === "tv"
              ? { first_air_date_year: searchYear - 1 }
              : { primary_release_year: searchYear - 1 }),
            sort_by: "popularity.desc",
          });
        }
        return null;
      },

      async () => {
        for (const genreId of matchedGenres) {
          const result = await fetchDataFromApi(discoverEndpoint, {
            with_genres: genreId,
            ...(mediaType === "tv"
              ? { first_air_date_year: searchYear }
              : { primary_release_year: searchYear }),
            sort_by: "popularity.desc",
          });
          if (result?.results?.length > 0) return result;
        }
        return null;
      },

      async () => {
        return fetchDataFromApi(searchEndpoint, { query });
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

    const result = await fetchDataFromApi(popularEndpoint);
    result.fallbackMessage =
      "No specific matches found. Here are some popular " +
      (mediaType === "tv" ? "TV shows" : "movies") +
      ":";
    return result;
  } catch (error) {
    return null;
  }
};

export const getSimilarityResults = async (titles, mediaType) => {
  try {
    const allResults = [];
    for (const title of titles) {
      let item = null;
      let searchEndpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
      let searchData = await fetchDataFromApi(searchEndpoint, {
        query: title,
        page: 1,
      });
      if (searchData?.results?.length > 0) {
        item = searchData.results[0];
      } else {
        searchEndpoint = mediaType === "tv" ? "/search/movie" : "/search/tv";
        searchData = await fetchDataFromApi(searchEndpoint, {
          query: title,
          page: 1,
        });
        if (searchData?.results?.length > 0) {
          item = searchData.results[0];
        }
      }
      if (item) {
        const recEndpoint =
          item.media_type === "tv"
            ? `/tv/${item.id}/recommendations`
            : `/movie/${item.id}/recommendations`;
        const recData = await fetchDataFromApi(recEndpoint, { page: 1 });
        if (recData?.results) {
          const filtered = recData.results.filter(
            (r) =>
              r.media_type === mediaType ||
              (!r.media_type && mediaType === "movie"),
          );
          allResults.push(...filtered);
        }
      }
    }
    const unique = allResults
      .filter(
        (item, index, self) =>
          self.findIndex((i) => i.id === item.id) === index,
      )
      .slice(0, 20);
    return { results: unique, total_results: unique.length };
  } catch (error) {
    return null;
  }
};

export const getMoviesByPerson = async (personName, mediaType, sort, role) => {
  try {
    const personSearch = await fetchDataFromApi("/search/person", {
      query: personName,
      page: 1,
    });
    if (!personSearch?.results?.length) return null;

    const person = personSearch.results[0];
    const personId = person.id;

    const endpoint = mediaType === "tv" ? "/discover/tv" : "/discover/movie";
    const sortBy =
      sort === "rating"
        ? "vote_average.desc"
        : sort === "date"
          ? "primary_release_date.desc"
          : "popularity.desc";
    const params = {
      sort_by: sortBy,
      page: 1,
    };
    if (role === "actor") {
      params.with_cast = personId;
    } else {
      params.with_crew = personId;
    }
    if (sort === "rating") params["vote_count.gte"] = 100;

    const data = await fetchDataFromApi(endpoint, params);
    return data;
  } catch (error) {
    return null;
  }
};

export const getTopRatedMovies = async (page = 1) => {
  try {
    const data = await fetchDataFromApi("/movie/top_rated", {
      page,
    });
    return data;
  } catch (error) {
    return null;
  }
};

export const getTopRatedTVShows = async (page = 1) => {
  try {
    const data = await fetchDataFromApi("/tv/top_rated", {
      page,
    });
    return data;
  } catch (error) {
    return null;
  }
};

export const fetchImdbRating = async (tmdbId, mediaType = "movie") => {
  try {
    const cacheKey = `${mediaType}-${tmdbId}`;
    if (imdbRatingsCache.has(cacheKey)) {
      const cachedData = imdbRatingsCache.get(cacheKey);
      return cachedData;
    }

    const externalIds = await fetchDataFromApi(
      `/${mediaType}/${tmdbId}/external_ids`,
    );

    if (!externalIds?.imdb_id) {

      const movieDetails = await fetchDataFromApi(`/${mediaType}/${tmdbId}`);
      if (movieDetails && (movieDetails.title || movieDetails.name)) {
        const title = movieDetails.title || movieDetails.name;
        const releaseDate =
          movieDetails.release_date || movieDetails.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

        const fallbackResponse = await fetchFromOmdb({
          t: title,
          y: year,
          type: mediaType === "tv" ? "series" : "movie",
        });

        if (
          fallbackResponse.data &&
          fallbackResponse.data.Response === "True"
        ) {
          if (
            fallbackResponse.data.imdbRating &&
            fallbackResponse.data.imdbRating !== "N/A"
          ) {

            const additionalRatings = {};
            if (
              fallbackResponse.data.Ratings &&
              Array.isArray(fallbackResponse.data.Ratings)
            ) {
              fallbackResponse.data.Ratings.forEach((rating) => {
                if (rating.Source === "Rotten Tomatoes") {
                  additionalRatings.rottenTomatoes = rating.Value;
                } else if (rating.Source === "Metacritic") {
                  additionalRatings.metacritic = rating.Value;
                }
              });
            }

            const result = {
              rating: fallbackResponse.data.imdbRating,
              votes: fallbackResponse.data.imdbVotes,
              imdbId: fallbackResponse.data.imdbID,
              additionalRatings,
            };
            setCacheItem(cacheKey, result);
            return result;
          } else {
          }
        } else {
        }
      }

      const result = {
        rating: null,
        votes: null,
        error: "No IMDB ID found and title search failed",
      };
      setCacheItem(cacheKey, result);
      return result;
    }

    const response = await fetchFromOmdb({
      i: externalIds.imdb_id,
    });

    if (response.data && response.data.Response === "True") {
      if (response.data.imdbRating && response.data.imdbRating !== "N/A") {
        const additionalRatings = {};
        if (response.data.Ratings && Array.isArray(response.data.Ratings)) {
          response.data.Ratings.forEach((rating) => {
            if (rating.Source === "Rotten Tomatoes") {
              additionalRatings.rottenTomatoes = rating.Value;
            } else if (rating.Source === "Metacritic") {
              additionalRatings.metacritic = rating.Value;
            }
          });
        }

        const result = {
          rating: response.data.imdbRating,
          votes: response.data.imdbVotes,
          imdbId: externalIds.imdb_id,
          additionalRatings,
        };
        setCacheItem(cacheKey, result);
        return result;
      } else {
      }
    } else {
    }

    const result = {
      rating: null,
      votes: null,
      error: "Rating not available",
      imdbId: externalIds.imdb_id,
    };
    setCacheItem(cacheKey, result);
    return result;
  } catch (error) {
    console.error(
      `[IMDB] Error fetching rating for ${mediaType} ${tmdbId}:`,
      error.message,
    );
    return { rating: null, votes: null, error: error.message };
  }
};

export const fetchAwardsFromOMDb = async (
  tmdbId,
  mediaType = "movie",
  expectedTitle = null,
  expectedYear = null,
) => {
  try {
    const externalIds = await fetchDataFromApi(
      `/${mediaType}/${tmdbId}/external_ids`,
    );

    let omdbData = null;

    if (externalIds?.imdb_id) {
      const response = await fetchFromOmdb({
        i: externalIds.imdb_id,
      });

      if (response.data && response.data.Response === "True") {
        omdbData = response.data;
      }
    }

    if (!omdbData) {
      const movieDetails = await fetchDataFromApi(`/${mediaType}/${tmdbId}`);
      if (movieDetails && (movieDetails.title || movieDetails.name)) {
        const title = movieDetails.title || movieDetails.name;
        const releaseDate =
          movieDetails.release_date || movieDetails.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

        const fallbackResponse = await fetchFromOmdb({
          t: title,
          y: year,
          type: mediaType === "tv" ? "series" : "movie",
        });

        if (
          fallbackResponse.data &&
          fallbackResponse.data.Response === "True"
        ) {
          omdbData = fallbackResponse.data;
        }
      }
    }

    if (omdbData && expectedTitle) {
      if (!titlesMatch(omdbData.Title, expectedTitle)) {
        console.warn(
          `[AWARDS] Title mismatch: OMDb returned "${omdbData.Title}" but expected "${expectedTitle}". Discarding awards.`,
        );
        omdbData = null;
      } else if (expectedYear && omdbData.Year) {
        const omdbYear = parseInt(omdbData.Year);
        if (!isNaN(omdbYear) && Math.abs(omdbYear - expectedYear) > 1) {
          console.warn(
            `[AWARDS] Year mismatch: OMDb returned ${omdbYear} but expected ${expectedYear}. Discarding awards.`,
          );
          omdbData = null;
        }
      }
    }

    if (omdbData && omdbData.Awards && omdbData.Awards !== "N/A") {
      const result = {
        awards: [],
        summary: omdbData.Awards,
        rawAwards: omdbData.Awards,
        source: "omdb",
        imdbId: externalIds?.imdb_id || omdbData.imdbID || null,
      };
      return result;
    }

    return {
      awards: [],
      summary: null,
      source: "omdb",
      imdbId: externalIds?.imdb_id || omdbData?.imdbID || null,
    };
  } catch (error) {
    console.error(
      `[AWARDS] Error fetching awards for ${mediaType} ${tmdbId}:`,
      error.message,
    );
    return {
      awards: [],
      summary: null,
      error: error.message,
      source: "omdb",
      imdbId: null,
    };
  }
};
