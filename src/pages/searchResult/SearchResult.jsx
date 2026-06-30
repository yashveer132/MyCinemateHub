import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";

import "./style.scss";

import { fetchDataFromApi } from "../../utils/api";
import { correctSpelling } from "../../utils/gemini";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";
import noResults from "../../assets/no-results.png";

const SearchResult = () => {
  const [data, setData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [correctedQuery, setCorrectedQuery] = useState("");
  const { query } = useParams();

  const fetchInitialData = async () => {
    setLoading(true);
    setLoadingStep("spelling");

    let corrected = query;
    try {
      corrected = await correctSpelling(query);
    } catch (e) {
      console.error("AI spelling correction failed:", e);
    }
    setCorrectedQuery(corrected);

    setLoadingStep("searching");
    fetchDataFromApi(`/search/multi?query=${corrected}&page=1`).then((res) => {
      setData(res);
      setPageNum(2);
      setLoading(false);
      setLoadingStep("");
    });
  };

  const fetchNextPageData = () => {
    if (!correctedQuery) return;
    fetchDataFromApi(
      `/search/multi?query=${correctedQuery}&page=${pageNum}`,
    ).then((res) => {
      if (data?.results) {
        setData({
          ...data,
          results: [...data?.results, ...res.results],
        });
      } else {
        setData(res);
      }
      setPageNum((prev) => prev + 1);
    });
  };

  useEffect(() => {
    setPageNum(1);
    setCorrectedQuery("");
    fetchInitialData();
  }, [query]);

  return (
    <div className="searchResultsPage">
      {loading && (
        <div className="searchLoadingScreen">
          <div className="loadingContent">
            <div className="spinnerWrapper">
              <svg className="spinnerIcon" viewBox="0 0 50 50">
                <circle
                  className="path"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  strokeWidth="5"
                ></circle>
              </svg>
              <div className="pulseRing"></div>
            </div>
            <div className="loadingStatus">
              <h3 className="loadingTitle">Cinemate AI</h3>
              <p className="loadingMessage">
                {loadingStep === "spelling"
                  ? "Analyzing search query spelling..."
                  : "Retrieving relevant matches from TMDB..."}
              </p>
              <div className="progressBar">
                <div className={`progressFill ${loadingStep}`} />
              </div>
            </div>
          </div>
        </div>
      )}
      {!loading && (
        <ContentWrapper>
          {data?.results?.length > 0 ? (
            <>
              <div className="pageTitle">
                {`Search ${
                  data?.total_results > 1 ? "results" : "result"
                } of '${correctedQuery || query}'`}
              </div>
              {correctedQuery &&
                query &&
                correctedQuery.toLowerCase() !== query.toLowerCase() && (
                  <div className="spellingCorrectionInfo">
                    Showing results for{" "}
                    <span className="highlight">"{correctedQuery}"</span>{" "}
                    instead of <span className="original">"{query}"</span>
                  </div>
                )}
              <InfiniteScroll
                className="content"
                dataLength={data?.results?.length || []}
                next={fetchNextPageData}
                hasMore={pageNum <= data?.total_pages}
                loader={<Spinner />}
              >
                {data?.results.map((item, index) => {
                  if (item.media_type === "person") return;
                  return (
                    <MovieCard key={index} data={item} fromSearch={true} />
                  );
                })}
              </InfiniteScroll>
            </>
          ) : (
            <div className="noResultsCard">
              <img
                src={noResults}
                alt="No Results"
                className="noResultsImage"
              />
              <h2 className="noResultsTitle">Oops! No Results Found</h2>
              <p className="noResultsMessage">
                We couldn't find any movies or TV shows matching "
                {correctedQuery || query}". Try adjusting your search terms or
                check for typos.
              </p>
            </div>
          )}
        </ContentWrapper>
      )}
    </div>
  );
};

export default SearchResult;
