import React, { useState, useEffect, useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { fetchTriviaFromWikipedia } from "../../../utils/imdbTrivia";
import { generateTrivia } from "../../../utils/gemini";
import {
  getTriviaFromCache,
  saveTriviaToCache,
} from "../../../utils/triviaCache";

const TriviaSection = ({ movieDetails, mediaType }) => {
  const [triviaData, setTriviaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);

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

    const loadTrivia = async () => {
      if (hasWatched && movieDetails && movieDetails.id) {
        setLoading(true);
        try {
          const title = movieDetails.title || movieDetails.name;
          const releaseDate =
            movieDetails.release_date || movieDetails.first_air_date;
          const releaseYear = releaseDate
            ? new Date(releaseDate).getFullYear()
            : new Date().getFullYear();

          const cachedTrivia = getTriviaFromCache(movieDetails.id);
          if (cachedTrivia && isMounted) {
            setTriviaData({ results: cachedTrivia });
            setShowTrivia(true);
            setLoading(false);
            return;
          }

          let finalTrivia = [];
          const aiRes = await generateTrivia(
            title,
            movieDetails.overview || "",
          );
          if (aiRes && aiRes.results && aiRes.results.length > 0) {
            finalTrivia = aiRes.results;
          } else {
            finalTrivia = await fetchTriviaFromWikipedia(
              title,
              releaseYear,
              mediaType,
            );
          }

          if (isMounted) {
            setTriviaData({ results: finalTrivia });
            setShowTrivia(true);

            if (finalTrivia && finalTrivia.length > 0) {
              saveTriviaToCache(movieDetails.id, finalTrivia);
            }
          }
        } catch (error) {
          console.error("Failed to load trivia:", error);
          if (isMounted) {
            setTriviaData({ results: [] });
            setShowTrivia(true);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    if (hasWatched && !triviaData) {
      loadTrivia();
    }

    return () => {
      isMounted = false;
    };
  }, [hasWatched, movieDetails, mediaType, triviaData]);

  useEffect(() => {
    const container = carouselContainer.current;
    if (
      container &&
      triviaData?.results &&
      triviaData.results.length > 0 &&
      showTrivia
    ) {
      const timer = setTimeout(checkScrollPosition, 100);

      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);

      return () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [triviaData, loading, showTrivia]);

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

  const triviaItems = triviaData?.results || [];

  const handleCheckboxChange = (e) => {
    setHasWatched(e.target.checked);
    if (!e.target.checked) {
      setShowTrivia(false);
    }
  };

  const getMediaTitle = () => {
    return movieDetails?.title || movieDetails?.name || "this content";
  };

  const getMediaTypeText = () => {
    return mediaType === "movie" ? "Movie" : "TV Show";
  };

  const getIconForType = (type) => {
    switch (type) {
      case "development":
        return "💡";
      case "casting":
        return "👥";
      case "music":
        return "🎵";
      case "legacy":
        return "🌟";
      case "filming":
      default:
        return "🎬";
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

  return (
    <div className="triviaSection">
      <ContentWrapper>
        <div className="sectionHeading">
          🎬 {getMediaTypeText()} Behind the Scenes
        </div>

        <div className="watchedCheckboxContainer">
          <label className="watchedCheckbox">
            <input
              type="checkbox"
              checked={hasWatched}
              onChange={handleCheckboxChange}
              className="checkboxInput"
            />
            <span className="checkboxCustom">
              <svg
                className="checkIcon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span className="checkboxLabel">
              <span className="watchedText">
                I've watched the {getMediaTypeText().toLowerCase()}
              </span>
              <span className="mediaTitle">{getMediaTitle()}</span>
            </span>
          </label>

          {!hasWatched && (
            <div className="spoilerWarning">
              <span className="warningIcon">⚠️</span>
              <span className="warningText">
                Check this box only if you've watched to avoid spoilers!
              </span>
            </div>
          )}
        </div>

        {hasWatched && (
          <>
            {!loading ? (
              showTrivia && triviaItems.length > 0 ? (
                <div className="triviaCarouselWrapper">
                  <BsFillArrowLeftCircleFill
                    className={`carouselLeftNav arrow ${!showLeftArrow ? "disabled" : ""}`}
                    onClick={() => navigate("left")}
                  />
                  <BsFillArrowRightCircleFill
                    className={`carouselRighttNav arrow ${!showRightArrow ? "disabled" : ""}`}
                    onClick={() => navigate("right")}
                  />
                  <div className="triviaGrid" ref={carouselContainer}>
                    {triviaItems.map((item) => (
                      <div key={item.id} className="triviaItem">
                        <div className="triviaIcon">
                          {getIconForType(item.type)}
                        </div>
                        <div className="triviaText">{item.text}</div>
                        <div className="triviaType">
                          {item.type === "development"
                            ? "Development"
                            : item.type === "casting"
                              ? "Casting"
                              : item.type === "music"
                                ? "Music & Sound"
                                : item.type === "legacy"
                                  ? "Legacy & Impact"
                                  : "Filming & Production"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                showTrivia && (
                  <div className="triviaEmpty">
                    <div className="noTrivia">
                      <div className="noTriviaIcon">🧠</div>
                      <div className="noTriviaText">No trivia available</div>
                      <div className="noTriviaSubtext">
                        Fun facts and trivia will be added when available
                      </div>
                    </div>
                  </div>
                )
              )
            ) : (
              <div className="triviaLoading">
                <div className="spinner"></div>
                <div className="loadingText">
                  Retrieving behind-the-scenes trivia...
                </div>
              </div>
            )}
          </>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TriviaSection;
