import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import Select from "react-select";

import "./style.scss";

import useFetch from "../../hooks/useFetch";
import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";

let filters = {};

const sortbyData = [
  { value: "popularity.desc", label: "Popularity Descending" },
  { value: "popularity.asc", label: "Popularity Ascending" },
  { value: "vote_average.desc", label: "Rating Descending" },
  { value: "vote_average.asc", label: "Rating Ascending" },
  {
    value: "primary_release_date.desc",
    label: "Release Date Descending",
  },
  { value: "primary_release_date.asc", label: "Release Date Ascending" },
  { value: "original_title.asc", label: "Title (A-Z)" },
  { value: "revenue.desc", label: "Revenue Descending" },
];

const certificationData = {
  movie: [
    { value: "G", label: "G - General Audiences" },
    { value: "PG", label: "PG - Parental Guidance" },
    { value: "PG-13", label: "PG-13" },
    { value: "R", label: "R - Restricted" },
    { value: "NC-17", label: "NC-17 - Adults Only" },
  ],
  tv: [
    { value: "TV-Y", label: "TV-Y - All Children" },
    { value: "TV-Y7", label: "TV-Y7 - Older Children" },
    { value: "TV-G", label: "TV-G - General Audience" },
    { value: "TV-PG", label: "TV-PG - Parental Guidance" },
    { value: "TV-14", label: "TV-14 - Parents Cautioned" },
    { value: "TV-MA", label: "TV-MA - Mature Audience" },
  ],
};

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
  { value: "4", label: "4+ ⭐ Below Average" },
  { value: "3", label: "3+ ⭐ Poor" },
];

const voteCountData = [
  { value: "1000", label: "1000+ votes (Popular)" },
  { value: "500", label: "500+ votes (Well-known)" },
  { value: "200", label: "200+ votes (Moderate)" },
  { value: "100", label: "100+ votes (Some reviews)" },
  { value: "50", label: "50+ votes (Few reviews)" },
  { value: "10", label: "10+ votes (Any)" },
];

const runtimeData = {
  movie: [
    { value: "0-60", label: "Short (< 1 hour)" },
    { value: "60-90", label: "Standard (1-1.5 hours)" },
    { value: "90-120", label: "Medium (1.5-2 hours)" },
    { value: "120-150", label: "Long (2-2.5 hours)" },
    { value: "150-999", label: "Epic (2.5+ hours)" },
  ],
  tv: [
    { value: "0-30", label: "Short (< 30 min)" },
    { value: "30-45", label: "Standard (30-45 min)" },
    { value: "45-60", label: "Medium (45-60 min)" },
    { value: "60-999", label: "Long (60+ min)" },
  ],
};

const Explore = () => {
  const [data, setData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(null);
  const [sortby, setSortby] = useState(null);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [rating, setRating] = useState(null);
  const [voteCount, setVoteCount] = useState(null);
  const [language, setLanguage] = useState(null);
  const [certification, setCertification] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const { mediaType } = useParams();

  const { data: genresData } = useFetch(`/genre/${mediaType}/list`);

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1900; year--) {
    yearOptions.push({ value: year.toString(), label: year.toString() });
  }

  const fetchInitialData = () => {
    setLoading(true);
    fetchDataFromApi(`/discover/${mediaType}`, filters)
      .then((res) => {
        if (res && res.results) {
          setData(res);
          setPageNum((prev) => prev + 1);
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
    fetchDataFromApi(`/discover/${mediaType}?page=${pageNum}`, filters)
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
    filters = {};
    setData(null);
    setPageNum(1);
    setSortby(null);
    setGenre(null);
    setFromYear("");
    setToYear("");
    setRating(null);
    setVoteCount(null);
    setLanguage(null);
    setCertification(null);
    setRuntime(null);
    setShowFilters(false);
    fetchInitialData();
  }, [mediaType]);

  const onChange = (selectedItems, action) => {
    if (action.name === "sortby") {
      setSortby(selectedItems);
      if (action.action !== "clear") {
        filters.sort_by = selectedItems.value;
      } else {
        delete filters.sort_by;
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
        delete filters["vote_average.gte"];
      }
    }

    if (action.name === "voteCount") {
      setVoteCount(selectedItems);
      if (action.action !== "clear") {
        filters["vote_count.gte"] = selectedItems.value;
      } else {
        delete filters["vote_count.gte"];
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
        if (mediaType === "tv") {
          filters["first_air_date.gte"] = `${value}-01-01`;
        } else {
          filters["primary_release_date.gte"] = `${value}-01-01`;
        }
      } else {
        if (mediaType === "tv") {
          delete filters["first_air_date.gte"];
        } else {
          delete filters["primary_release_date.gte"];
        }
      }
    } else {
      setToYear(value);
      if (value) {
        if (mediaType === "tv") {
          filters["first_air_date.lte"] = `${value}-12-31`;
        } else {
          filters["primary_release_date.lte"] = `${value}-12-31`;
        }
      } else {
        if (mediaType === "tv") {
          delete filters["first_air_date.lte"];
        } else {
          delete filters["primary_release_date.lte"];
        }
      }
    }
    setPageNum(1);
    fetchInitialData();
  };

  return (
    <div className="explorePage">
      <ContentWrapper>
        <div className="pageHeader">
          <div className="pageTitle">
            {mediaType === "tv" ? "Explore TV Shows" : "Explore Movies"}
          </div>
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
                options={certificationData[mediaType]}
                onChange={onChange}
                isClearable={true}
                placeholder="Rating"
                className="react-select-container filterItem"
                classNamePrefix="react-select"
              />
              <Select
                name="runtime"
                value={runtime}
                options={runtimeData[mediaType]}
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
                  if (item.media_type === "person") return;
                  return (
                    <MovieCard key={index} data={item} mediaType={mediaType} />
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

export default Explore;
