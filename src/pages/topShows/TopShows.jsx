import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import "./style.scss";

import { getTopRatedTVShows } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";

const TopShows = () => {
  const [data, setData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchInitialData = () => {
    setLoading(true);
    getTopRatedTVShows(1).then((res) => {
      setData(res);
      setPageNum(2);
      setLoading(false);
    });
  };

  const fetchNextPageData = () => {
    getTopRatedTVShows(pageNum).then((res) => {
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
    setData(null);
    setPageNum(1);
    fetchInitialData();
  }, []);

  return (
    <div className="topShowsPage">
      <ContentWrapper>
        <div className="pageHeader">
          <div className="pageTitle">📺 Top Rated TV Shows</div>
          <div className="pageSubtitle">
            Explore the most acclaimed television series with exceptional
            ratings and compelling narratives
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
                      mediaType="tv"
                    />
                  );
                })}
              </InfiniteScroll>
            ) : (
              <span className="resultNotFound">Sorry, Results not found!</span>
            )}
          </>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TopShows;
