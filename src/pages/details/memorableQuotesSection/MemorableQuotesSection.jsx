import React, { useState, useEffect } from "react";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { generateMemorableQuotes } from "../../../utils/gemini";

const MemorableQuotesSection = ({ movieDetails }) => {
  const [aiQuotes, setAiQuotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const quotesPerPage = 4;

  useEffect(() => {
    const loadAiQuotes = async () => {
      if (movieDetails && (movieDetails.title || movieDetails.name)) {
        setLoading(true);
        try {
          const generated = await generateMemorableQuotes(
            movieDetails.title || movieDetails.name,
            movieDetails.overview,
            movieDetails.genres || []
          );
          setAiQuotes(generated);
        } catch (error) {
          console.error("Failed to generate memorable quotes:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAiQuotes();
  }, [movieDetails]);

  const quotesData = aiQuotes;

  const totalQuotes = quotesData?.results?.length || 0;
  const totalPages = Math.ceil(totalQuotes / quotesPerPage);
  const startIndex = (currentPage - 1) * quotesPerPage;
  const endIndex = startIndex + quotesPerPage;
  const currentQuotes = quotesData?.results?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const section = document.querySelector('.memorableQuotesSection');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const skeleton = () => {
    return (
      <div className="quoteItem">
        <div className="quoteText skeleton"></div>
        <div className="quoteMeta">
          <div className="quoteCharacter skeleton"></div>
          <div className="quoteContext skeleton"></div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pageBtn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pageBtn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          className="pageBtn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          className="pageBtn navBtn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹ Previous
        </button>
        <div className="pageNumbers">
          {pages}
        </div>
        <button
          className="pageBtn navBtn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next ›
        </button>
      </div>
    );
  };

  return (
    <div className="memorableQuotesSection">
      <ContentWrapper>
        <div className="sectionHeading">Memorable Quotes</div>
        {!loading ? (
          quotesData?.results && quotesData.results.length > 0 ? (
            <>
              <div className="quotes">
                {currentQuotes.map((quote, index) => (
                  <div key={startIndex + index} className="quoteItem">
                    <div className="quoteText">"{quote.quote}"</div>
                    <div className="quoteMeta">
                      <div className="quoteCharacter">
                        {quote.character !== "Unknown"
                          ? `— ${quote.character}`
                          : ""}
                      </div>
                      <div className="quoteContext">{quote.context}</div>
                      <div className="quoteSignificance">
                        {quote.significance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {renderPagination()}
            </>
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
