import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./style.scss";
import useFetch from "../../../hooks/useFetch";
import Img from "../../../components/lazyLoadImage/Img";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SmartSearch from "../../../components/aiSearch/SmartSearch";

const HeroBanner = () => {
  const [background, setBackground] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("simple");

  const navigate = useNavigate();
  const { url } = useSelector((state) => state.home);
  const { data, loading } = useFetch("/movie/upcoming");

  useEffect(() => {
    const changeBg = () => {
      const randomIndex = Math.floor(Math.random() * 20);
      const bg = data?.results?.[randomIndex]?.backdrop_path;
      setBackground(bg ? url.backdrop + bg : "");
    };

    changeBg();

    const interval = setInterval(() => {
      changeBg();
    }, 10000);

    return () => clearInterval(interval);
  }, [data, url.backdrop]);

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
          {activeTab === "simple" && (
            <>
              <span className="title">Welcome</span>
              <span className="subTitle">
                Millions of movies, TV shows and people to discover
              </span>
            </>
          )}
          <div className="searchContainer">
            <div className={`searchTabs ${activeTab === "ai" ? "aiActive" : ""}`}>
              <span
                className={`tab ${activeTab === "simple" ? "active" : ""}`}
                onClick={() => setActiveTab("simple")}
              >
                Simple Search
              </span>
              <span
                className={`tab ${activeTab === "ai" ? "active" : ""}`}
                onClick={() => setActiveTab("ai")}
              >
                AI Search
              </span>
            </div>

            <div className="searchContent">
              {activeTab === "simple" ? (
                <div className="searchInput">
                  <input
                    type="text"
                    placeholder="Search for a Movie or a TV show.."
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyUp={searchQueryHandle}
                  />
                  <button onClick={clickMeHandle}>Search</button>
                </div>
              ) : (
                <div className="aiSearchWrapper">
                  <SmartSearch />
                </div>
              )}
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default HeroBanner;
