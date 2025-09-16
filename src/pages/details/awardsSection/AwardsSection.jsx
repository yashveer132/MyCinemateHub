import React, { useState, useEffect } from "react";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import { generateAwards } from "../../../utils/gemini";

const AwardsSection = ({ movieDetails, mediaType }) => {
  const [awardsData, setAwardsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const awardsPerPage = 6;

  useEffect(() => {
    const loadAwards = async () => {
      if (movieDetails && (movieDetails.title || movieDetails.name)) {
        setLoading(true);
        try {
          const generated = await generateAwards(
            movieDetails.title || movieDetails.name,
            movieDetails.overview,
            movieDetails.genres
          );
          setAwardsData(generated);
        } catch (error) {
          console.error("Failed to generate awards:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAwards();
  }, [movieDetails]);

  useEffect(() => {
    setCurrentPage(1);
  }, [awardsData]);

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="row skeleton"></div>
        <div className="row2 skeleton"></div>
        <div className="row3 skeleton"></div>
      </div>
    );
  };

  const awards = awardsData?.awards || [];
  const totalPages = Math.ceil(awards.length / awardsPerPage);
  const startIndex = (currentPage - 1) * awardsPerPage;
  const endIndex = startIndex + awardsPerPage;
  const currentAwards = awards.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const section = document.querySelector(".awardsSection");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
        <button key={1} className="pageBtn" onClick={() => handlePageChange(1)}>
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pageBtn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="ellipsis">
            ...
          </span>
        );
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
        <div className="pageNumbers">{pages}</div>
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
    <div className="awardsSection">
      <ContentWrapper>
        <div className="sectionHeading">
          {mediaType === "tv" ? "TV Awards Won" : "Movie Awards Won"}
        </div>
        {!loading ? (
          awardsData && awardsData.awards && awardsData.awards.length > 0 ? (
            <div className="awardsContent">
              {awardsData.summary && (
                <div className="awardsSummary">
                  <div className="summaryText">{awardsData.summary}</div>
                </div>
              )}
              <div className="awardsList">
                {currentAwards.map((award) => (
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
                        <span className="nomineesLabel">Winner:</span>
                        <span className="nomineesList">
                          {award.nominees.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {renderPagination()}
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
          <div className="awardsContent">
            <div className="awardsSummary">
              <div className="summaryText skeleton"></div>
            </div>
            <div className="awardsList">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="awardItem">
                  <div className="awardHeader">
                    <div className="awardName skeleton"></div>
                    <div className="awardResult skeleton"></div>
                  </div>
                  <div className="awardDetails">
                    <div className="awardCategory skeleton"></div>
                    <div className="awardYear skeleton"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default AwardsSection;
