import React, { useEffect, useState } from "react";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Spinner from "../../components/spinner/Spinner";
import Carousel from "../../components/carousel/Carousel";
import { extractSearchParams } from "../../utils/gemini";
import { fetchDataFromApi, getFallbackResults } from "../../utils/api";
import "./style.scss";

const SUGGESTIONS = [
  "horror movies 2024",
  "cozy romances for weekend",
  "mind-bending sci-fi",
  "feel-good comedies",
  "korean thrillers",
  "pixar movies for kids",
];

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
  params = applyDateParams(params, mediaType, year);

  const lang = detectLanguageCode(rawQuery);
  if (lang) params.with_original_language = lang;

  delete params.query;
  delete params.with_keywords;

  if (!params.sort_by) params.sort_by = "popularity.desc";

  return params;
};

const AIPlaylists = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [subtitle, setSubtitle] = useState("");
  const [mediaType, setMediaType] = useState("movie");
  const [error, setError] = useState("");
  const pageTitle = "AI Playlists";

  const runSearch = async (q) => {
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const ai = await extractSearchParams(q);
      const mt = detectMediaType(ai, q);
      setMediaType(mt);

      const discoverParams = buildDiscoverParams(ai, mt, q);
      const endpoint = mt === "tv" ? "/discover/tv" : "/discover/movie";

      let data = await fetchDataFromApi(endpoint, {
        ...discoverParams,
        page: 1,
      });

      if (!data || (data.results || []).length < 6) {
        const searchText = ai?.tmdbParams?.query || q;
        const searchEndpoint = mt === "tv" ? "/search/tv" : "/search/movie";
        const searchData = await fetchDataFromApi(searchEndpoint, {
          query: searchText,
          page: 1,
        });
        if (searchData?.results?.length) {
          data = searchData;
        }
      }

      if (
        (!data || !data.results || data.results.length === 0) &&
        mt === "movie"
      ) {
        const fb = await getFallbackResults(q);
        data = fb;
      }

      const items = (data?.results || []).slice(0, 10);
      setResults(items.map((i) => ({ ...i, media_type: mt })));
      setSubtitle("");
    } catch (e) {
      setError("We couldn't create a playlist for that. Try rephrasing.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    if (!query.trim()) return;
    runSearch(query.trim());
  };

  useEffect(() => {
    runSearch("horror movies 2024");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="aiPlaylistsPage">
      <ContentWrapper>
        <div className="pageHeader">
          <h1 className="pageTitle">{pageTitle}</h1>
          <div className="searchBar">
            <input
              type="text"
              placeholder="e.g. 'horror movies 2024' or 'korean thrillers'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && onSubmit()}
            />
            <button onClick={onSubmit}>
              {loading ? <Spinner inline size={22} /> : "Create"}
            </button>
          </div>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => {
                  setQuery(s);
                  runSearch(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {null}
        </div>
      </ContentWrapper>

      <div className="carouselSection">
        <ContentWrapper>
          <div className="carouselTitle">Playlist</div>
        </ContentWrapper>
        <Carousel data={results} loading={loading} endpoint={mediaType} />
      </div>
    </div>
  );
};

export default AIPlaylists;
