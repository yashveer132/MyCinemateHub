import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

import "./style.scss";

import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Img from "../../components/lazyLoadImage/Img";
import PersonCard from "../../components/personCard/PersonCard";
import Spinner from "../../components/spinner/Spinner";
import avatar from "../../assets/avatar.png";
import noResults from "../../assets/no-results.png";

const genderData = [
  { value: "all", label: "All Genders" },
  { value: "2", label: "Male" },
  { value: "1", label: "Female" },
  { value: "0", label: "Not Specified" },
];

const sortByData = [
  { value: "popularity", label: "Popularity" },
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
];

const SearchPeople = () => {
  const [data, setData] = useState(null);
  const [popularData, setPopularData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [popularPageNum, setPopularPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const { query: urlQuery } = useParams();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setPageNum(1);
      setData(null);
      fetchInitialData();
    } else {
      if (!popularData) {
        fetchPopularPeople();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await fetchDataFromApi(
        `/search/person?query=${searchQuery}&page=1`
      );
      if (response && response.results) {
        setSuggestions(response.results.slice(0, 5));
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback(
    (searchQuery) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    },
    [fetchSuggestions]
  );

  const fetchPopularPeople = () => {
    const initialLoad = !popularData;
    if (initialLoad) setPopularLoading(true);
    fetchDataFromApi(`/person/popular?page=${popularPageNum}`).then((res) => {
      if (!res) {
        if (initialLoad) setPopularLoading(false);
        return;
      }
      if (popularData?.results) {
        setPopularData({
          ...popularData,
          results: [...popularData.results, ...(res.results || [])],
          total_pages: res.total_pages,
          total_results: res.total_results,
        });
      } else {
        setPopularData(res);
      }
      setPopularPageNum((prev) => prev + 1);
      if (initialLoad) setPopularLoading(false);
    });
  };

  const fetchInitialData = () => {
    if (!urlQuery) return;
    setLoading(true);
    const firstPage = 1;
    fetchDataFromApi(
      `/search/person?query=${encodeURIComponent(urlQuery)}&page=${firstPage}`
    )
      .then((res) => {
        setData(res);
        setPageNum(firstPage + 1);
        setLoading(false);
      })
      .catch(() => {
        setData({ results: [] });
        setLoading(false);
      });
  };

  const fetchNextPageData = () => {
    if (urlQuery) {
      if (data?.total_pages && pageNum > data.total_pages) return;
      const thisPage = pageNum;
      fetchDataFromApi(
        `/search/person?query=${encodeURIComponent(urlQuery)}&page=${thisPage}`
      ).then((res) => {
        if (!res) return;
        if (data?.results) {
          setData({
            ...data,
            results: [...data?.results, ...(res.results || [])],
            total_pages: res.total_pages || data.total_pages,
          });
        } else {
          setData(res);
        }
        setPageNum((prev) => prev + 1);
      });
    } else {
      fetchPopularPeople();
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/searchPeople/${query.trim()}`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      if (urlQuery) {
        navigate("/searchPeople");
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      debouncedFetchSuggestions(value);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setData(null);
    setPageNum(1);
    setSuggestions([]);
    setShowSuggestions(false);
    navigate("/searchPeople");
  };

  const handlePersonClick = useCallback(
    (personId) => {
      navigate(`/person/${personId}`);
    },
    [navigate]
  );

  const handleSuggestionClick = useCallback(
    (person) => {
      setQuery(person.name);
      setShowSuggestions(false);
      navigate(`/searchPeople/${person.name}`);
    },
    [navigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const currentData = urlQuery ? data : popularData;
  const currentLoading = urlQuery ? loading : popularLoading;
  const hasMore = urlQuery
    ? data && pageNum <= (data?.total_pages || 0)
    : popularPageNum <= 10;

  const filteredAndSortedData = useMemo(() => {
    if (!currentData?.results) return [];
    return currentData.results;
  }, [currentData?.results]);

  return (
    <div className="searchPeoplePage">
      <ContentWrapper>
        {!urlQuery && <div className="pageTitle">Popular People</div>}
        {urlQuery && (
          <div className="pageTitle">Search results for '{urlQuery}'</div>
        )}

        <div className="searchSection">
          <div className="searchBox">
            <div className="inputContainer">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for People..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
              />
              {query && (
                <button className="clearBtn" onClick={handleClearSearch}>
                  ×
                </button>
              )}

              {showSuggestions && (
                <div className="suggestionsDropdown" ref={suggestionsRef}>
                  {suggestionsLoading ? (
                    <div className="suggestionItem loading">
                      <div className="suggestionSpinner">Loading...</div>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((person) => (
                      <div
                        key={person.id}
                        className="suggestionItem"
                        onClick={() => handleSuggestionClick(person)}
                      >
                        <div className="suggestionImage">
                          <Img
                            src={
                              person.profile_path
                                ? `https://image.tmdb.org/t/p/w92${person.profile_path}`
                                : avatar
                            }
                            alt={person.name}
                          />
                        </div>
                        <div className="suggestionInfo">
                          <div className="suggestionName">{person.name}</div>
                          <div className="suggestionDepartment">
                            {person.known_for_department || "Actor"}
                          </div>
                          {person.known_for && person.known_for.length > 0 && (
                            <div className="suggestionKnownFor">
                              Known for:{" "}
                              {person.known_for[0].title ||
                                person.known_for[0].name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="suggestionItem noResults">
                      <div className="suggestionInfo">
                        <div className="suggestionName">
                          No suggestions found
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="searchBtn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        {currentLoading && <Spinner initial={true} />}
        {!currentLoading && currentData && (
          <>
            {(currentData?.results?.length > 0 || !urlQuery) && null}
            <InfiniteScroll
              className="content"
              dataLength={currentData?.results?.length || 0}
              next={fetchNextPageData}
              hasMore={hasMore}
              loader={<Spinner />}
            >
              <div className="peopleGrid">
                {filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((item) => (
                    <PersonCard
                      key={`person-${item.id}`}
                      person={item}
                      onClick={handlePersonClick}
                    />
                  ))
                ) : (
                  <div className="noFilterResults">
                    <div className="noFilterResultsIcon">🔍</div>
                    <div className="noFilterResultsText">
                      No people match your filters
                    </div>
                    <div className="noFilterResultsSubtext">
                      Try adjusting your filter criteria to see more results
                    </div>
                  </div>
                )}
              </div>
            </InfiniteScroll>
          </>
        )}
        {!currentLoading && urlQuery && currentData?.results?.length === 0 && (
          <div className="noResultsCard">
            <div className="noResultsIcon">🔍</div>
            <div className="noResultsText">No people found</div>
            <div className="noResultsSubtext">
              We couldn't find any people matching "{urlQuery}". Try adjusting
              your search terms or check for typos.
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default SearchPeople;
