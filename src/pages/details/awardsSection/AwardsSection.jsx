import React, { useState, useEffect, useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import {
  fetchAwardsData,
  fetchWikidataBackground,
} from "../../../utils/awardsCache";

const AwardsSection = ({ movieDetails, mediaType }) => {
  const [awardsData, setAwardsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const carouselContainer = useRef();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    const container = carouselContainer.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadAwards = async () => {
      if (movieDetails && movieDetails.id) {
        setLoading(true);
        try {
          const releaseDate =
            movieDetails.release_date || movieDetails.first_air_date;
          const initialData = await fetchAwardsData({
            id: movieDetails.id,
            media_type: mediaType,
            title: movieDetails.title || movieDetails.name,
            year: releaseDate ? new Date(releaseDate).getFullYear() : null,
          });

          if (!isMounted) return;

          setAwardsData(initialData);
          setLoading(false);

          if (!initialData.isComplete && initialData.imdbId) {
            const enrichedData = await fetchWikidataBackground(
              movieDetails.id,
              mediaType,
              initialData.imdbId,
              initialData,
            );

            if (isMounted && enrichedData) {
              setAwardsData(enrichedData);
            }
          }
        } catch (error) {
          console.error("Failed to load awards:", error);
          if (isMounted) {
            setAwardsData(null);
            setLoading(false);
          }
        }
      }
    };

    loadAwards();

    return () => {
      isMounted = false;
    };
  }, [movieDetails, mediaType]);

  useEffect(() => {
    const container = carouselContainer.current;
    if (container && awardsData?.awards && awardsData.awards.length > 0) {
      const timer = setTimeout(checkScrollPosition, 100);

      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);

      return () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [awardsData, loading]);

  const navigate = (direction) => {
    const container = carouselContainer.current;
    if (container) {
      const scrollAmount =
        direction === "left"
          ? container.scrollLeft - container.clientWidth
          : container.scrollLeft + container.clientWidth;

      container.scrollTo({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="row skeleton"></div>
        <div className="row2 skeleton"></div>
        <div className="row3 skeleton"></div>
      </div>
    );
  };

  const awardsList = awardsData?.awards || [];

  return (
    <div className="awardsSection">
      <ContentWrapper>
        <div className="sectionHeading">
          {mediaType === "tv" ? "🏆 TV Awards" : "🏆 Movie Awards"}
        </div>
        {!loading ? (
          awardsData && awardsList && awardsList.length > 0 ? (
            <div className="awardsContent">
              {awardsData.summary && (
                <div className="awardsSummary">
                  <div className="summaryText">
                    {awardsData.source === "omdb" ? (
                      <div className="omdbAwardsSummary">
                        {awardsData.summary}
                      </div>
                    ) : awardsData.source === "omdb_ai" ? (
                      <div className="combinedAwardsSummary">
                        <div className="omdbBase">{awardsData.omdbSummary}</div>
                        <div className="aiEnhanced">{awardsData.summary}</div>
                      </div>
                    ) : (
                      awardsData.summary
                    )}
                  </div>
                </div>
              )}
              {awardsList && awardsList.length > 0 && (
                <div className="awardsCarouselWrapper">
                  <BsFillArrowLeftCircleFill
                    className={`carouselLeftNav arrow ${!showLeftArrow ? "disabled" : ""}`}
                    onClick={() => navigate("left")}
                  />
                  <BsFillArrowRightCircleFill
                    className={`carouselRighttNav arrow ${!showRightArrow ? "disabled" : ""}`}
                    onClick={() => navigate("right")}
                  />
                  <div className="awardsList" ref={carouselContainer}>
                    {awardsList.map((award) => (
                      <div key={award.id} className="awardItem">
                        <div className="awardHeader">
                          <div className="awardName">{award.award}</div>
                          <div
                            className={`awardResult ${award.result.toLowerCase()}`}
                          >
                            {award.result}
                          </div>
                        </div>
                        <div className="awardDetails">
                          <div className="awardCategory">{award.category}</div>
                          <div className="awardYear">{award.year}</div>
                        </div>
                        {award.nominees && award.nominees.length > 0 && (
                          <div className="awardNominees">
                            <span className="nomineesLabel">
                              {award.result === "Won" ? "Winner:" : "Nominee:"}
                            </span>
                            <span className="nomineesList">
                              {award.nominees.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="awardsEmpty">
              <div className="noAwards">
                <div className="noAwardsIcon">🏆</div>
                <div className="noAwardsText">No awards won</div>
                <div className="noAwardsSubtext">
                  This {mediaType === "tv" ? "TV show" : "movie"} hasn't won any
                  major awards yet
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="awardsList">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="awardItem">
                {skeleton()}
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default AwardsSection;
