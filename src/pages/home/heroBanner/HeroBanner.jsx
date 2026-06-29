import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./style.scss";
import useFetch from "../../../hooks/useFetch";
import Img from "../../../components/lazyLoadImage/Img";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";

const HeroBanner = () => {
  const [background, setBackground] = useState("");
  const [query, setQuery] = useState("");

  const recentIndicesRef = useRef([]);

  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();

  const { data: upcomingData, loading: upcomingLoading } =
    useFetch("/movie/upcoming");
  const { data: trendingPage1, loading: trendingLoading1 } = useFetch(
    "/trending/all/week?page=1",
  );
  const { data: trendingPage2, loading: trendingLoading2 } = useFetch(
    "/trending/all/week?page=2",
  );

  const loading = upcomingLoading || trendingLoading1 || trendingLoading2;

  const combinedData = useMemo(() => {
    if (!upcomingData && !trendingPage1 && !trendingPage2) return null;

    const rawList = [
      ...(upcomingData?.results || []),
      ...(trendingPage1?.results || []),
      ...(trendingPage2?.results || []),
    ];

    const seenIds = new Set();
    const uniqueResults = [];

    rawList.forEach((item) => {
      if (item && item.id && item.backdrop_path && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueResults.push(item);
      }
    });

    return uniqueResults.length > 0 ? { results: uniqueResults } : null;
  }, [upcomingData, trendingPage1, trendingPage2]);

  useEffect(() => {
    recentIndicesRef.current = [];

    const changeBg = () => {
      const totalItems = combinedData?.results?.length || 0;
      if (totalItems === 0) return;

      let randomIndex;
      let attempts = 0;
      do {
        randomIndex = Math.floor(Math.random() * totalItems);
        attempts++;
      } while (recentIndicesRef.current.includes(randomIndex) && attempts < 20);

      const item = combinedData.results[randomIndex];
      const bg = item?.backdrop_path;
      setBackground(bg ? url.backdrop + bg : "");

      recentIndicesRef.current.push(randomIndex);
      if (recentIndicesRef.current.length > 30) {
        recentIndicesRef.current.shift();
      }
    };

    changeBg();

    const interval = setInterval(() => {
      changeBg();
    }, 4000);

    return () => clearInterval(interval);
  }, [combinedData, url.backdrop]);

  const clickMeHandle = (e) => {
    navigate(`/search/${query}`);
  };

  const searchQueryHandle = (event) => {
    if (event.key === "Enter" && query.length > 0) {
      navigate(`/search/${query}`);
    }
  };

  return (
    <div className="heroBanner">
      {!loading && background && (
        <div className="backdrop-img">
          <Img src={background} />
        </div>
      )}

      <div className="opacity-layer"></div>

      <ContentWrapper>
        <div className="heroBannerContent">
          <span className="title">Welcome</span>
          <span className="subTitle">
            Millions of movies, TV shows and people to discover
          </span>
          <div className="searchContainer">
            <div className="searchContent">
              <div className="searchInput">
                <input
                  type="text"
                  placeholder="Search for a Movie or a TV show.."
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyUp={searchQueryHandle}
                />
                <button onClick={clickMeHandle}>Search</button>
              </div>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default HeroBanner;
