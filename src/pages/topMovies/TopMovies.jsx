import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Select from "react-select";

import "./style.scss";

import { fetchDataFromApi } from "../../utils/api";
import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";

let filters = {};

const sortbyData = [
  { value: "vote_average.desc", label: "Rating Descending" },
  { value: "vote_average.asc", label: "Rating Ascending" },
  { value: "popularity.desc", label: "Popularity Descending" },
  { value: "popularity.asc", label: "Popularity Ascending" },
  {
    value: "primary_release_date.desc",
    label: "Release Date Descending",
  },
  { value: "primary_release_date.asc", label: "Release Date Ascending" },
  { value: "original_title.asc", label: "Title (A-Z)" },
  { value: "revenue.desc", label: "Revenue Descending" },
];

const certificationData = [
  { value: "G", label: "G - General Audiences" },
  { value: "PG", label: "PG - Parental Guidance" },
  { value: "PG-13", label: "PG-13" },
  { value: "R", label: "R - Restricted" },
  { value: "NC-17", label: "NC-17 - Adults Only" },
];

const languageData = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "tr", label: "Turkish" },
  { value: "th", label: "Thai" },
];

const ratingData = [
  { value: "9", label: "9+ ⭐ Masterpiece" },
  { value: "8", label: "8+ ⭐ Excellent" },
  { value: "7", label: "7+ ⭐ Great" },
  { value: "6", label: "6+ ⭐ Good" },
  { value: "5", label: "5+ ⭐ Average" },
];

const voteCountData = [
  { value: "5000", label: "5000+ votes (Very Popular)" },
  { value: "3000", label: "3000+ votes (Popular)" },
  { value: "1000", label: "1000+ votes (Well-known)" },
  { value: "500", label: "500+ votes (Moderate)" },
  { value: "200", label: "200+ votes (Some reviews)" },
];

const runtimeData = [
  { value: "0-60", label: "Short (< 1 hour)" },
  { value: "60-90", label: "Standard (1-1.5 hours)" },
  { value: "90-120", label: "Medium (1.5-2 hours)" },
  { value: "120-150", label: "Long (2-2.5 hours)" },
  { value: "150-999", label: "Epic (2.5+ hours)" },
];

const TopMovies = () => {
  const [data, setData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(null);
  const [sortby, setSortby] = useState({
    value: "vote_average.desc",
    label: "Rating Descending",
  });
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [rating, setRating] = useState({ value: "7", label: "7+ ⭐ Great" });
  const [voteCount, setVoteCount] = useState({
    value: "1000",
    label: "1000+ votes (Well-known)",
  });
  const [language, setLanguage] = useState(null);
  const [certification, setCertification] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: genresData } = useFetch(`/genre/movie/list`);

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1900; year--) {
    yearOptions.push({ value: year.toString(), label: year.toString() });
  }

  const fetchInitialData = () => {
    setLoading(true);
    fetchDataFromApi(`/discover/movie`, filters)
      .then((res) => {
        if (res && res.results) {
          setData(res);
          setPageNum(2);
        } else {
          setData({ results: [], total_pages: 0, total_results: 0 });
          setPageNum(1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setData({ results: [], total_pages: 0, total_results: 0 });
        setLoading(false);
      });
  };

  const fetchNextPageData = () => {
    fetchDataFromApi(`/discover/movie?page=${pageNum}`, filters)
      .then((res) => {
        if (res && res.results) {
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
      })
      .catch((err) => {
        console.error("Error fetching next page:", err);
      });
  };

  useEffect(() => {
    filters = {
      sort_by: "vote_average.desc",
      "vote_average.gte": "7",
      "vote_count.gte": "1000",
    };
    setData(null);
    setPageNum(1);
    setShowFilters(false);
    fetchInitialData();
  }, []);

  const onChange = (selectedItems, action) => {
    if (action.name === "sortby") {
      setSortby(selectedItems);
      if (action.action !== "clear") {
        filters.sort_by = selectedItems.value;
      } else {
        filters.sort_by = "vote_average.desc";
      }
    }

    if (action.name === "genres") {
      setGenre(selectedItems);
      if (action.action !== "clear") {
        let genreId = selectedItems.map((g) => g.id);
        genreId = JSON.stringify(genreId).slice(1, -1);
        filters.with_genres = genreId;
      } else {
        delete filters.with_genres;
      }
    }

    if (action.name === "rating") {
      setRating(selectedItems);
      if (action.action !== "clear") {
        filters["vote_average.gte"] = selectedItems.value;
      } else {
        filters["vote_average.gte"] = "7";
      }
    }

    if (action.name === "voteCount") {
      setVoteCount(selectedItems);
      if (action.action !== "clear") {
        filters["vote_count.gte"] = selectedItems.value;
      } else {
        filters["vote_count.gte"] = "1000";
      }
    }

    if (action.name === "language") {
      setLanguage(selectedItems);
      if (action.action !== "clear") {
        filters.with_original_language = selectedItems.value;
      } else {
        delete filters.with_original_language;
      }
    }

    if (action.name === "certification") {
      setCertification(selectedItems);
      if (action.action !== "clear") {
        filters.certification_country = "US";
        filters.certification = selectedItems.value;
      } else {
        delete filters.certification_country;
        delete filters.certification;
      }
    }

    if (action.name === "runtime") {
      setRuntime(selectedItems);
      if (action.action !== "clear") {
        const [min, max] = selectedItems.value.split("-");
        filters["with_runtime.gte"] = min;
        if (max !== "999") {
          filters["with_runtime.lte"] = max;
        } else {
          delete filters["with_runtime.lte"];
        }
      } else {
        delete filters["with_runtime.gte"];
        delete filters["with_runtime.lte"];
      }
    }

    setPageNum(1);
    fetchInitialData();
  };

  const handleYearChange = (value, type) => {
    if (type === "from") {
      setFromYear(value);
      if (value) {
        filters["primary_release_date.gte"] = `${value}-01-01`;
      } else {
        delete filters["primary_release_date.gte"];
      }
    } else {
      setToYear(value);
      if (value) {
        filters["primary_release_date.lte"] = `${value}-12-31`;
      } else {
        delete filters["primary_release_date.lte"];
      }
    }
    setPageNum(1);
    fetchInitialData();
  };

  return (
    <div className="topMoviesPage">
      <ContentWrapper>
        <div className="pageHeader">
          <div className="pageTitle">🎬 Top Rated Movies</div>
          <button 
            className={`filterToggleBtn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters ✕" : "Filter & Sort 🎛️"}
          </button>
          <div className={`filters ${showFilters ? "show" : ""}`}>
            <div className="filtersRow fiveColumns">
              <Select
                isMulti
                name="genres"
                value={genre}
                closeMenuOnSelect={false}
                options={genresData?.genres}
                getOptionLabel={(option) => option.name}
                getOptionValue={(option) => option.id}
                onChange={onChange}
                placeholder="Genres"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="sortby"
                value={sortby}
                options={sortbyData}
                onChange={onChange}
                isClearable={true}
                placeholder="Sort By"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="fromYear"
                value={fromYear ? { value: fromYear, label: fromYear } : null}
                options={yearOptions}
                onChange={(selected) =>
                  handleYearChange(selected?.value || "", "from")
                }
                isClearable={true}
                placeholder="From Year"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="toYear"
                value={toYear ? { value: toYear, label: toYear } : null}
                options={yearOptions}
                onChange={(selected) =>
                  handleYearChange(selected?.value || "", "to")
                }
                isClearable={true}
                placeholder="To Year"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="rating"
                value={rating}
                options={ratingData}
                onChange={onChange}
                isClearable={true}
                placeholder="Min Rating"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
            </div>

            <div className="filtersRow fourColumns">
              <Select
                name="voteCount"
                value={voteCount}
                options={voteCountData}
                onChange={onChange}
                isClearable={true}
                placeholder="Min Votes"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="language"
                value={language}
                options={languageData}
                onChange={onChange}
                isClearable={true}
                placeholder="Language"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="certification"
                value={certification}
                options={certificationData}
                onChange={onChange}
                isClearable={true}
                placeholder="Content Rating"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="runtime"
                value={runtime}
                options={runtimeData}
                onChange={onChange}
                isClearable={true}
                placeholder="Runtime"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </div>
        {loading && <Spinner initial={true} />}
        {!loading && (
          <>
            {data?.results?.length > 0 ? (
              <InfiniteScroll
                className="content"
                dataLength={data?.results?.length || []}
                next={fetchNextPageData}
                hasMore={pageNum <= data?.total_pages}
                loader={<Spinner />}
              >
                {data?.results?.map((item, index) => {
                  return (
                    <MovieCard
                      key={`${item.id}-${index}`}
                      data={item}
                      mediaType="movie"
                    />
                  );
                })}
              </InfiniteScroll>
            ) : (
              <div className="resultNotFound">
                <div className="notFoundIcon">🔍</div>
                <div className="notFoundText">No results found!</div>
                <div className="notFoundSubtext">
                  Try adjusting your filters or search criteria
                </div>
              </div>
            )}
          </>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TopMovies;
