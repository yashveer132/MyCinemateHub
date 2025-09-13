import React, { useState, useEffect } from "react";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { generateTrivia } from "../../../utils/gemini";

const TriviaSection = ({ movieDetails }) => {
  const [aiTrivia, setAiTrivia] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAiTrivia = async () => {
      if (movieDetails && (movieDetails.title || movieDetails.name)) {
        setLoading(true);
        try {
          const generated = await generateTrivia(
            movieDetails.title || movieDetails.name,
            movieDetails.overview
          );
          setAiTrivia(generated);
        } catch (error) {
          console.error("Failed to generate trivia:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAiTrivia();
  }, [movieDetails]);

  const triviaData = aiTrivia;
  const getRandomTrivia = (triviaArray) => {
    if (!triviaArray || triviaArray.length === 0) return [];
    const shuffled = [...triviaArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(5, shuffled.length));
  };

  const triviaItems = getRandomTrivia(triviaData?.results);

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
        <div className="sectionHeading">Movie Trivia & Fun Facts</div>
        {!loading ? (
          triviaItems.length > 0 ? (
            <div className="trivia">
              {triviaItems.map((item) => (
                <div key={item.id} className="triviaItem">
                  <div className="triviaText">{item.text}</div>
                </div>
              ))}
            </div>
          ) : (
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
        ) : (
          <div className="trivia">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="triviaItem">
                <div className="triviaText skeleton"></div>
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default TriviaSection;
