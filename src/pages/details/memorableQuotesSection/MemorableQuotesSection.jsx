import React, { useState, useEffect, useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { fetchQuotesFromWikiquote } from "../../../utils/wikiquote";
import {
  getQuotesFromCache,
  saveQuotesToCache,
} from "../../../utils/quotesCache";

const MemorableQuotesSection = ({ movieDetails, mediaType }) => {
  const [quotes, setQuotes] = useState(null);
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

    const loadQuotes = async () => {
      if (movieDetails && movieDetails.id) {
        setLoading(true);
        try {
          const cachedQuotes = getQuotesFromCache(movieDetails.id);
          if (cachedQuotes && isMounted) {
            setQuotes(cachedQuotes);
            setLoading(false);
            return;
          }

          const title = movieDetails.title || movieDetails.name;
          const releaseDate =
            movieDetails.release_date || movieDetails.first_air_date;
          const releaseYear = releaseDate
            ? new Date(releaseDate).getFullYear()
            : new Date().getFullYear();

          const fetchedQuotes = await fetchQuotesFromWikiquote(
            title,
            releaseYear,
            mediaType || "movie",
          );

          if (isMounted) {
            const top10Quotes = fetchedQuotes.slice(0, 10);
            setQuotes(top10Quotes);

            if (top10Quotes.length > 0) {
              saveQuotesToCache(movieDetails.id, top10Quotes);
            }
          }
        } catch (error) {
          console.error("[MEMORABLE QUOTES] Failed to load quotes:", error);
          if (isMounted) {
            setQuotes([]);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadQuotes();

    return () => {
      isMounted = false;
    };
  }, [movieDetails, mediaType]);

  useEffect(() => {
    const container = carouselContainer.current;
    if (container && quotes && quotes.length > 0) {
      const timer = setTimeout(checkScrollPosition, 100);

      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);

      return () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [quotes, loading]);

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
      <div className="quoteItem">
        <div className="quoteText skeleton"></div>
        <div className="quoteMeta">
          <div className="quoteCharacter skeleton"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="memorableQuotesSection">
      <ContentWrapper>
        <div className="sectionHeading">💬 Memorable Quotes</div>
        {!loading ? (
          quotes && quotes.length > 0 ? (
            <div className="quotesCarouselWrapper">
              <BsFillArrowLeftCircleFill
                className={`carouselLeftNav arrow ${!showLeftArrow ? "disabled" : ""}`}
                onClick={() => navigate("left")}
              />
              <BsFillArrowRightCircleFill
                className={`carouselRighttNav arrow ${!showRightArrow ? "disabled" : ""}`}
                onClick={() => navigate("right")}
              />
              <div className="quotes" ref={carouselContainer}>
                {quotes.map((quote, index) => (
                  <div key={index} className="quoteItem">
                    <div className="quoteText">"{quote.quote}"</div>
                    <div className="quoteMeta">
                      <div className="quoteCharacter">— {quote.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="quotesEmpty">
              <div className="noQuotes">
                <div className="noQuotesIcon">💬</div>
                <div className="noQuotesText">
                  No memorable quotes available
                </div>
                <div className="noQuotesSubtext">
                  Iconic quotes and dialogue will be added when available
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="quotes">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="quoteItem">
                {skeleton()}
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default MemorableQuotesSection;
