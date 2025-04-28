import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAiSearchQuery, setAiSearchResults } from "../../store/homeSlice";
import { extractSearchParams } from "../../utils/gemini";
import { fetchDataFromApi } from "../../utils/api";
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

  const exampleQueries = [
    "Mind-bending psychological thrillers",
    "Historical war films",
    "Sci-fi thrillers",
    "Best family movies",
  ];

  const handleQueryChange = (e) => {
    dispatch(setAiSearchQuery(e.target.value));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const searchParams = await extractSearchParams(query);

      if (searchParams?.tmdbParams) {
        const endpoint = "/discover/movie";
        const data = await fetchDataFromApi(endpoint, {
          ...searchParams.tmdbParams,
          page: 1,
          sort_by: "vote_average.desc",
          "vote_count.gte": 100,
        });

        data.fallbackMessage = `AI-Curated ${query} Collection`;
        dispatch(setAiSearchResults(data));
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
              <span>AI is analyzing your request...</span>
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
              endpoint="movie"
            />
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default SmartSearch;
