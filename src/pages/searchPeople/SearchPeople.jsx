import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import Select from "react-select";

import "./style.scss";

import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Img from "../../components/lazyLoadImage/Img";
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
  const [gender, setGender] = useState({ value: "all", label: "All Genders" });
  const [sortBy, setSortBy] = useState({
    value: "popularity",
    label: "Popularity",
  });
  const { query: urlQuery } = useParams();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setPageNum(1);
      fetchInitialData();
    } else {
      if (!popularData) {
        fetchPopularPeople();
      }
    }
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
    setPopularLoading(true);
    fetchDataFromApi(`/person/popular?page=${popularPageNum}`).then((res) => {
      if (popularData?.results) {
        setPopularData({
          ...popularData,
          results: [...popularData.results, ...res.results],
        });
      } else {
        setPopularData(res);
      }
      setPopularPageNum((prev) => prev + 1);
      setPopularLoading(false);
    });
  };

  const fetchInitialData = () => {
    if (!urlQuery) return;
    setLoading(true);
    setData(null);
    fetchDataFromApi(`/search/person?query=${urlQuery}&page=${pageNum}`)
      .then((res) => {
        setData(res);
        setPageNum((prev) => prev + 1);
        setLoading(false);
      })
      .catch(() => {
        setData({ results: [] });
        setLoading(false);
      });
  };

  const fetchNextPageData = () => {
    if (urlQuery) {
      fetchDataFromApi(`/search/person?query=${urlQuery}&page=${pageNum}`).then(
        (res) => {
          if (data?.results) {
            setData({
              ...data,
              results: [...data?.results, ...res.results],
            });
          } else {
            setData(res);
          }
          setPageNum((prev) => prev + 1);
        }
      );
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

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  const handleSuggestionClick = (person) => {
    setQuery(person.name);
    setShowSuggestions(false);
    navigate(`/searchPeople/${person.name}`);
  };

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
    ? pageNum <= (data?.total_pages || 0)
    : popularPageNum <= 10;

  const filteredAndSortedData = useMemo(() => {
    if (!currentData?.results) return [];

    let filtered = [...currentData.results];

    if (gender.value !== "all") {
      filtered = filtered.filter(
        (person) => person.gender === parseInt(gender.value)
      );
    }

    if (sortBy.value === "name_asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy.value === "name_desc") {
      filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else {
    }

    return filtered;
  }, [currentData, gender, sortBy]);

  const handleFilterChange = (selectedItem, action) => {
    if (action.name === "gender") {
      setGender(selectedItem || { value: "all", label: "All Genders" });
    } else if (action.name === "sortBy") {
      setSortBy(selectedItem || { value: "popularity", label: "Popularity" });
    }
  };

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
            {(currentData?.results?.length > 0 || !urlQuery) && (
              <>
                <div className="filtersSection">
                  <div className="filtersRow twoColumns">
                    <Select
                      name="gender"
                      value={gender}
                      options={genderData}
                      onChange={handleFilterChange}
                      isClearable={false}
                      placeholder="Gender"
                      className="react-select-container filterItem"
                      classNamePrefix="react-select"
                    />
                    <Select
                      name="sortBy"
                      value={sortBy}
                      options={sortByData}
                      onChange={handleFilterChange}
                      isClearable={false}
                      placeholder="Sort By"
                      className="react-select-container filterItem"
                      classNamePrefix="react-select"
                    />
                  </div>
                </div>
              </>
            )}
            <InfiniteScroll
              className="content"
              dataLength={currentData?.results?.length || []}
              next={fetchNextPageData}
              hasMore={hasMore}
              loader={<Spinner />}
            >
              <div className="peopleGrid">
                {filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((item, index) => {
                    let imgUrl = item.profile_path
                      ? `https://image.tmdb.org/t/p/original${item.profile_path}`
                      : avatar;
                    return (
                      <div
                        key={item.id}
                        className="personCard"
                        onClick={() => handlePersonClick(item.id)}
                      >
                        <div className="profileImg">
                          <Img src={imgUrl} />
                        </div>
                        <div className="personInfo">
                          <div className="name">{item.name}</div>
                          <div className="knownFor">
                            {item.known_for_department || "Actor"}
                          </div>
                          {item.known_for && item.known_for.length > 0 && (
                            <div className="knownForTitles">
                              {item.known_for.slice(0, 2).map((media, idx) => (
                                <span key={idx}>
                                  {media.title || media.name}
                                  {idx < 1 && item.known_for.length > 1
                                    ? ", "
                                    : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
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
