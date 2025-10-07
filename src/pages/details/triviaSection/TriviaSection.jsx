import React, { useState, useEffect } from "react";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { generateTrivia } from "../../../utils/gemini";

const TriviaSection = ({ movieDetails, mediaType }) => {
  const [aiTrivia, setAiTrivia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);

  useEffect(() => {
    const loadAiTrivia = async () => {
      if (
        hasWatched &&
        movieDetails &&
        (movieDetails.title || movieDetails.name)
      ) {
        setLoading(true);
        try {
          const generated = await generateTrivia(
            movieDetails.title || movieDetails.name,
            movieDetails.overview
          );
          setAiTrivia(generated);
          setShowTrivia(true);
        } catch (error) {
          console.error("Failed to generate trivia:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (hasWatched && !aiTrivia) {
      loadAiTrivia();
    }
  }, [hasWatched, movieDetails, aiTrivia]);

  const triviaData = aiTrivia;

  const triviaItems = (triviaData?.results || []).slice(0, 6);

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
      case "easter_egg":
        return "🥚";
      case "fun_fact":
        return "🎉";
      case "trivia":
      default:
        return "💡";
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
          {getMediaTypeText()} Trivia, Fun Facts & Easter Eggs
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
                <div className="triviaGrid">
                  {triviaItems.map((item) => (
                    <div key={item.id} className="triviaItem">
                      <div className="triviaIcon">
                        {getIconForType(item.type)}
                      </div>
                      <div className="triviaText">{item.text}</div>
                      <div className="triviaType">
                        {item.type === "easter_egg"
                          ? "Easter Egg"
                          : item.type === "fun_fact"
                          ? "Fun Fact"
                          : "Trivia"}
                      </div>
                    </div>
                  ))}
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
              <div className="triviaGrid">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="triviaItem">
                    <div className="triviaText skeleton"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TriviaSection;
