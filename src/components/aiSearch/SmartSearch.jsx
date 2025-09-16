import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAiSearchQuery, setAiSearchResults } from "../../store/homeSlice";
import { extractSearchParams, correctSpelling } from "../../utils/gemini";
import {
  fetchDataFromApi,
  getFallbackResults,
  getSimilarityResults,
  getMoviesByPerson,
} from "../../utils/api";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Carousel from "../carousel/Carousel";
import Spinner from "../spinner/Spinner";
import { FaRobot, FaSearch } from "react-icons/fa";
import { RiMovieFill } from "react-icons/ri";
import "./style.scss";

const SmartSearch = () => {
  const dispatch = useDispatch();
  const { query, results } = useSelector((state) => state.home.aiSearch);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const LANGUAGE_MAP = {
    korean: "ko",
    japanese: "ja",
    french: "fr",
    spanish: "es",
    hindi: "hi",
    tamil: "ta",
    telugu: "te",
    german: "de",
    italian: "it",
    chinese: "zh",
  };

  const detectLanguageCode = (q) => {
    const lower = q.toLowerCase();
    for (const [word, code] of Object.entries(LANGUAGE_MAP)) {
      if (lower.includes(word)) return code;
    }
    return null;
  };

  const detectMediaType = (ai, q) => {
    const lower = q.toLowerCase();
    if (ai?.aiParams?.mediaType === "tv") return "tv";
    if (
      lower.includes("tv show") ||
      lower.includes("tv ") ||
      lower.includes("series")
    )
      return "tv";
    return "movie";
  };

  const applyDateParams = (params, mediaType, year) => {
    const p = { ...params };
    if (mediaType === "tv") {
      if (p.primary_release_date_gte) {
        p.first_air_date_gte = p.primary_release_date_gte;
        delete p.primary_release_date_gte;
      }
      if (p.primary_release_date_lte) {
        p.first_air_date_lte = p.primary_release_date_lte;
        delete p.primary_release_date_lte;
      }
      if (year) {
        p.first_air_date_year = year;
      }
    } else if (mediaType === "movie" && year) {
      p.primary_release_year = year;
    }
    return p;
  };

  const buildDiscoverParams = (ai, mediaType, rawQuery) => {
    let params = ai?.tmdbParams ? { ...ai.tmdbParams } : {};

    const q = rawQuery.toLowerCase();
    if (q.match(/best|top|highest rated|rating|imdb/)) {
      params.sort_by = "vote_average.desc";
      params["vote_count.gte"] = 200;
    } else if (q.match(/trending|popular|hot|buzz/)) {
      params.sort_by = "popularity.desc";
    }

    const yearMatch = rawQuery.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;

    const decadeMatch = rawQuery.match(/\b(19|20)?\d{1,2}s\b/);
    if (decadeMatch) {
      const decadeStr = decadeMatch[0];
      const decadeNum = parseInt(decadeStr.replace("s", ""));
      const startYear = decadeNum < 100 ? 1900 + decadeNum : decadeNum;
      const endYear = startYear + 9;
      if (mediaType === "movie") {
        params.primary_release_date_gte = `${startYear}-01-01`;
        params.primary_release_date_lte = `${endYear}-12-31`;
      } else {
        params.first_air_date_gte = `${startYear}-01-01`;
        params.first_air_date_lte = `${endYear}-12-31`;
      }
    } else if (year) {
      params = applyDateParams(params, mediaType, year);
    }

    const lang = detectLanguageCode(rawQuery);
    if (lang) params.with_original_language = lang;

    delete params.query;
    delete params.with_keywords;

    if (!params.sort_by) params.sort_by = "popularity.desc";

    return params;
  };

  const extractSimilarityTitles = (raw) => {
    const q = raw.toLowerCase().trim();
    const likeIdx = q.indexOf(" like ");
    const similarIdx = q.indexOf("similar to ");
    let tail = "";
    if (similarIdx !== -1) {
      tail = raw.substring(similarIdx + "similar to ".length).trim();
    } else if (likeIdx !== -1) {
      tail = raw.substring(likeIdx + " like ".length).trim();
    }
    if (!tail) return [];
    tail = tail.replace(/^(:|=)/, "").trim();
    tail = tail.split(/[\.|\?|!]/)[0];
    const parts = tail
      .split(/,|\band\b|\bor\b/gi)
      .map((s) => s.replace(/['"“”‘’]/g, "").trim())
      .filter(Boolean);
    return parts;
  };

  const exampleQueries = [
    "Mind-bending psychological thrillers",
    "Historical war films",
    "Sci-fi thrillers",
    "Best family movies",
  ];

  const handleQueryChange = (e) => {
    const newQuery = e.target.value;
    dispatch(setAiSearchQuery(newQuery));
    if (!newQuery.trim()) {
      dispatch(setAiSearchResults(null));
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);

      const correctedQuery = await correctSpelling(query);
      const ai = await extractSearchParams(correctedQuery);

      let mediaType = "movie";
      if (ai) mediaType = detectMediaType(ai, correctedQuery);

      let data = null;
      let usedSimilarity = false;
      let originTitle = null;
      let desiredGenreIds = [];
      const heuristicSimilarTitles = extractSimilarityTitles(correctedQuery);
      if (heuristicSimilarTitles.length > 0) {
        usedSimilarity = true;
        originTitle = heuristicSimilarTitles[0];
        try {
          const baseSearchEndpoint =
            mediaType === "tv" ? "/search/tv" : "/search/movie";
          const baseSearch = await fetchDataFromApi(baseSearchEndpoint, {
            query: originTitle,
            page: 1,
          });
          if (baseSearch?.results?.length) {
            desiredGenreIds = baseSearch.results[0].genre_ids || [];
          }
        } catch (e) {}
        data = await getSimilarityResults(heuristicSimilarTitles, mediaType);
      } else if (ai?.aiParams?.person) {
        data = await getMoviesByPerson(
          ai.aiParams.person,
          mediaType,
          ai.aiParams.sort || "popularity",
          ai.aiParams.role || "director"
        );
      } else if (
        ai?.aiParams?.isSimilarity &&
        ai.aiParams.similarTitles.length > 0
      ) {
        usedSimilarity = true;
        originTitle = ai.aiParams.similarTitles[0];
        try {
          const baseSearchEndpoint =
            mediaType === "tv" ? "/search/tv" : "/search/movie";
          const baseSearch = await fetchDataFromApi(baseSearchEndpoint, {
            query: originTitle,
            page: 1,
          });
          if (baseSearch?.results?.length) {
            desiredGenreIds = baseSearch.results[0].genre_ids || [];
          }
        } catch (e) {}
        data = await getSimilarityResults(ai.aiParams.similarTitles, mediaType);
      } else {
        const discoverParams = buildDiscoverParams(
          ai,
          mediaType,
          correctedQuery
        );
        const endpoint =
          mediaType === "tv" ? "/discover/tv" : "/discover/movie";
        data = await fetchDataFromApi(endpoint, { ...discoverParams, page: 1 });

        if (!data || (data.results || []).length < 6) {
          const searchText = ai?.tmdbParams?.query || correctedQuery;
          const searchEndpoint =
            mediaType === "tv" ? "/search/tv" : "/search/movie";
          const searchData = await fetchDataFromApi(searchEndpoint, {
            query: searchText,
            page: 1,
          });
          if (searchData?.results?.length) {
            data = searchData;
          }
        }
      }

      if (
        usedSimilarity &&
        data?.results?.length &&
        Array.isArray(desiredGenreIds) &&
        desiredGenreIds.length > 0
      ) {
        const filtered = data.results.filter(
          (r) =>
            Array.isArray(r.genre_ids) &&
            r.genre_ids.some((id) => desiredGenreIds.includes(id))
        );
        if (filtered.length >= Math.min(6, data.results.length)) {
          data = { ...data, results: filtered };
        }
      }

      if (!data || !data.results || data.results.length === 0) {
        data = await getFallbackResults(correctedQuery, mediaType);
      }

      if (data) {
        const items = (data.results || []).slice(0, 10).map((i) => ({
          ...i,
          media_type: i.media_type || mediaType,
        }));
        const payload = {
          results: items,
          mediaType,
          fallbackMessage:
            data.fallbackMessage ||
            (originTitle || heuristicSimilarTitles.length > 0
              ? `Because you asked for titles like "${
                  originTitle || heuristicSimilarTitles[0]
                }"`
              : `AI-Curated ${correctedQuery} ${
                  mediaType === "tv" ? "TV" : "Movie"
                } Picks`),
        };
        dispatch(setAiSearchResults(payload));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery) => {
    dispatch(setAiSearchQuery(exampleQuery));
    handleSearch();
  };

  return (
    <div className="smartSearchSection">
      <div className="searchBackground">
        <div className="glowEffect"></div>
      </div>
      <ContentWrapper>
        <div className="searchContainer">
          <div className="headerSection">
            <div className="iconWrapper">
              <FaRobot className="aiIcon" />
            </div>
            <h2 className="sectionHeading">AI-Powered Movie Discovery</h2>
            <p className="searchDescription">
              Experience next-gen movie search. Describe what you're looking for
              in natural language, and let our AI curate the perfect watchlist
              for you.
            </p>
          </div>

          <div className={`searchInput ${loading ? "loading" : ""}`}>
            <FaSearch className="searchIcon" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyUp={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Try: Show me romantic comedies'"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              className="searchButton"
              disabled={loading}
            >
              <RiMovieFill className="buttonIcon" />
              <span>{loading ? "Searching..." : "Discover"}</span>
            </button>
          </div>

          {loading && (
            <div className="loadingMessage">
              <span>Analyzing your request...</span>
              <div className="spinnerWrapper">
                <Spinner />
              </div>
            </div>
          )}

          {!loading && hasSearched && !results?.results?.length && query && (
            <div className="noResults">
              <FaRobot className="icon" />
              <div className="message">No matches found for your request</div>
              <div className="suggestion">
                Try being more specific or use different keywords
              </div>
            </div>
          )}

          {!loading && !query && (
            <div className="exampleSection">
              <span className="exampleLabel">Try these:</span>
              <div className="exampleQueries">
                {exampleQueries.map((q, index) => (
                  <div
                    key={index}
                    className="queryTag"
                    onClick={() => handleExampleClick(q)}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {results?.results?.length > 0 && (
          <div className="searchResults">
            <ContentWrapper>
              <div className="resultsHeader">
                <RiMovieFill className="resultIcon" />
                <h3>{results.fallbackMessage || "AI-Curated Discoveries"}</h3>
              </div>
            </ContentWrapper>
            <Carousel
              data={results.results}
              loading={loading}
              endpoint={results.mediaType || "movie"}
            />
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default SmartSearch;
