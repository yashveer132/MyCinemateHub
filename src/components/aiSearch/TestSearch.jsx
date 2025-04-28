import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAiSearchQuery, setAiSearchResults } from "../../store/homeSlice";
import { extractSearchParams } from "../../utils/gemini";
import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Carousel from "../carousel/Carousel";
import Spinner from "../spinner/Spinner";

const TestSearch = () => {
  const dispatch = useDispatch();
  const { query, results } = useSelector((state) => state.home.aiSearch);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      setLoading(true);
      const searchParams = await extractSearchParams(query);

      if (searchParams?.tmdbParams) {
        const endpoint =
          searchParams.aiParams.mediaType === "all"
            ? "/search/multi"
            : `/search/${searchParams.aiParams.mediaType}`;

        const data = await fetchDataFromApi(endpoint, searchParams.tmdbParams);
        dispatch(setAiSearchResults(data));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    dispatch(setAiSearchQuery(e.target.value));
  };

  return (
    <div className="aiSearchPage">
      <ContentWrapper>
        <div className="searchInput">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyUp={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Try: show me action movies from the 90s"
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {loading && <Spinner />}

        {results?.results?.length > 0 && (
          <div className="searchResults">
            <Carousel
              data={results.results}
              loading={loading}
              title={results.fallbackMessage || "AI Search Results"}
            />
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TestSearch;
