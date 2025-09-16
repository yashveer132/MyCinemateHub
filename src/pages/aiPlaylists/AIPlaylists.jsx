import React, { useEffect, useState } from "react";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Carousel from "../../components/carousel/Carousel";
import { extractSearchParams } from "../../utils/gemini";
import {
  fetchDataFromApi,
  getFallbackResults,
  getSimilarityResults,
  getMoviesByPerson,
} from "../../utils/api";
import { playlistStorage } from "../../utils/playlistStorage";
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

const AIPlaylists = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [subtitle, setSubtitle] = useState("");
  const [mediaType, setMediaType] = useState("movie");
  const [error, setError] = useState("");
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [showSavedPlaylists, setShowSavedPlaylists] = useState(false);
  const [saveDialog, setSaveDialog] = useState({ show: false, name: "" });
  const [playlistTitle, setPlaylistTitle] = useState(
    "Sample Playlist: Horror Movies 2024"
  );
  const pageTitle = "AI Playlists";

  const runSearch = async (q) => {
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const ai = await extractSearchParams(q);
      const mt = detectMediaType(ai, q);
      setMediaType(mt);

      let data;
      if (ai?.aiParams?.person) {
        data = await getMoviesByPerson(
          ai.aiParams.person,
          mt,
          ai.aiParams.sort || "popularity",
          ai.aiParams.role || "director"
        );
      } else if (
        ai?.aiParams?.isSimilarity &&
        ai.aiParams.similarTitles.length > 0
      ) {
        data = await getSimilarityResults(ai.aiParams.similarTitles, mt);
      } else {
        const discoverParams = buildDiscoverParams(ai, mt, q);
        const endpoint = mt === "tv" ? "/discover/tv" : "/discover/movie";

        data = await fetchDataFromApi(endpoint, {
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
      }

      if (!data || !data.results || data.results.length === 0) {
        const fb = await getFallbackResults(q, mt);
        data = fb;
      }

      const items = (data?.results || []).slice(0, 10);
      setResults(items.map((i) => ({ ...i, media_type: mt })));
      setSubtitle("");
      setPlaylistTitle(
        q ? `Playlist: ${q}` : "Sample Playlist: Horror Movies 2024"
      );
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

  const loadSavedPlaylists = () => {
    try {
      const playlists = playlistStorage.getAllPlaylists();
      setSavedPlaylists(playlists);
    } catch (error) {
      console.error("Failed to load playlists:", error);
      setError("Failed to load saved playlists. Please refresh the page.");
    }
  };

  const saveCurrentPlaylist = (name) => {
    if (!results.length) {
      setError("No playlist to save. Generate a playlist first.");
      return;
    }

    try {
      const saved = playlistStorage.savePlaylist(
        name,
        results,
        query,
        mediaType
      );
      setSaveDialog({ show: false, name: "" });
      loadSavedPlaylists();
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const loadPlaylist = (playlist) => {
    try {
      setResults(playlist.items);
      setQuery(playlist.query);
      setMediaType(playlist.mediaType);
      setShowSavedPlaylists(false);
      setPlaylistTitle(`Playlist: ${playlist.query}`);
      setError("");
    } catch (error) {
      console.error("Failed to load playlist:", error);
      setError("Failed to load the selected playlist.");
    }
  };

  const deletePlaylist = (id) => {
    try {
      if (playlistStorage.deletePlaylist(id)) {
        loadSavedPlaylists();
      } else {
        setError("Failed to delete playlist.");
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      setError("Failed to delete playlist.");
    }
  };

  useEffect(() => {
    runSearch("horror movies 2024");
    loadSavedPlaylists();
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
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === "") {
                  runSearch("horror movies 2024");
                  setPlaylistTitle("Sample Playlist: Horror Movies 2024");
                }
              }}
              onKeyUp={(e) => e.key === "Enter" && onSubmit()}
            />
            <button onClick={onSubmit} disabled={!query.trim()}>
              {loading ? (
                <svg
                  className="button-spinner"
                  viewBox="0 0 20 20"
                  width="20"
                  height="20"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              ) : (
                "Create"
              )}
            </button>
            <button
              className="save-btn"
              onClick={() =>
                setSaveDialog({ show: true, name: query || "My Playlist" })
              }
              disabled={!query.trim() || !results.length}
            >
              💾 Save
            </button>
            <button
              className="saved-btn"
              onClick={() => setShowSavedPlaylists(!showSavedPlaylists)}
            >
              📂 Saved ({savedPlaylists.length})
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

          {saveDialog.show && (
            <div className="save-dialog-overlay">
              <div className="save-dialog">
                <h3>Save Playlist</h3>
                <input
                  type="text"
                  placeholder="Enter playlist name"
                  value={saveDialog.name}
                  onChange={(e) =>
                    setSaveDialog({ ...saveDialog, name: e.target.value })
                  }
                  onKeyUp={(e) =>
                    e.key === "Enter" && saveCurrentPlaylist(saveDialog.name)
                  }
                />
                <div className="dialog-buttons">
                  <button
                    onClick={() => setSaveDialog({ show: false, name: "" })}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveCurrentPlaylist(saveDialog.name)}
                    disabled={!saveDialog.name.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSavedPlaylists && (
            <div className="saved-playlists-section">
              <h3>Your Saved Playlists</h3>
              {savedPlaylists.length === 0 ? (
                <p>No saved playlists yet. Create and save one!</p>
              ) : (
                <div className="saved-playlists-grid">
                  {savedPlaylists.map((playlist) => (
                    <div key={playlist.id} className="saved-playlist-card">
                      <div className="playlist-info">
                        <h4>{playlist.name}</h4>
                        <p>{playlist.query}</p>
                        <small>
                          {playlist.items.length} items • {playlist.mediaType} •
                          {new Date(playlist.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="playlist-actions">
                        <button
                          onClick={() => loadPlaylist(playlist)}
                          className="load-btn"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deletePlaylist(playlist.id)}
                          className="delete-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </ContentWrapper>

      <div className="carouselSection">
        <ContentWrapper>
          <div className="carouselTitle">{playlistTitle}</div>
        </ContentWrapper>
        <Carousel data={results} loading={loading} endpoint={mediaType} />
      </div>
    </div>
  );
};

export default AIPlaylists;
