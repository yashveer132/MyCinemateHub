import React, { useState, useMemo } from "react";
import dayjs from "dayjs";
import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const ReleaseDatesSection = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const { data, loading } = useFetch(`/movie/${id}/release_dates`);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentPage(1);
    }
  };

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="country skeleton"></div>
        <div className="releaseInfo">
          <div className="type skeleton"></div>
          <div className="date skeleton"></div>
          <div className="certification skeleton"></div>
        </div>
      </div>
    );
  };

  const getReleaseTypeLabel = (type) => {
    const types = {
      1: "Premiere",
      2: "Theatrical (limited)",
      3: "Theatrical",
      4: "Digital",
      5: "Physical",
      6: "TV",
    };
    return types[type] || `Type ${type}`;
  };

  const allCountries = useMemo(() => {
    if (!data?.results) return [];
    return data.results.sort(
      (a, b) =>
        a.release_dates?.[0]?.release_date?.localeCompare(
          b.release_dates?.[0]?.release_date
        ) || 0
    );
  }, [data?.results]);

  const totalPages = Math.ceil(allCountries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCountries = allCountries.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (!data?.results?.length && !loading) {
    return null;
  }

  return (
    <div className="releaseDatesSection">
      <ContentWrapper>
        <div className="releaseHeader" onClick={toggleExpanded}>
          <div className="sectionHeading center">
            Release Information ({data?.results?.length || 0})
          </div>
          <div className={`expandIcon ${isExpanded ? "expanded" : ""}`}>
            {isExpanded ? "−" : "+"}
          </div>
        </div>

        {isExpanded && (
          <div className="releaseContent">
            {!loading ? (
              <>
                {currentCountries.length > 0 ? (
                  <>
                    <div className="releaseDatesList">
                      {currentCountries.map((country) => (
                        <div
                          key={country.iso_3166_1}
                          className="countryReleases"
                        >
                          <div className="countryHeader">
                            <img
                              src={`https://flagcdn.com/w20/${country.iso_3166_1?.toLowerCase()}.png`}
                              alt={country.iso_3166_1}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <span className="countryName">
                              {country.iso_3166_1} (
                              {country.release_dates?.length || 0} release
                              {country.release_dates?.length !== 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="releasesList">
                            {country.release_dates?.map((release, index) => (
                              <div key={index} className="releaseItem">
                                <div className="releaseType">
                                  {getReleaseTypeLabel(release.type)}
                                </div>
                                <div className="releaseDetails">
                                  <div className="releaseDate">
                                    {dayjs(release.release_date).format(
                                      "MMM D, YYYY"
                                    )}
                                  </div>
                                  {release.certification && (
                                    <div className="certification">
                                      Rating: {release.certification}
                                    </div>
                                  )}
                                  {release.note && (
                                    <div className="note">{release.note}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          className="pageBtn prev"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                        >
                          ‹ Prev
                        </button>

                        <div className="pageNumbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 &&
                                  page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="ellipsis">...</span>
                                )}
                                <button
                                  className={`pageBtn ${
                                    page === currentPage ? "active" : ""
                                  }`}
                                  onClick={() => goToPage(page)}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                        </div>

                        <button
                          className="pageBtn next"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="noResults">
                    <p>No release information available.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="releaseDatesSkeleton">
                {skeleton()}
                {skeleton()}
                {skeleton()}
              </div>
            )}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default ReleaseDatesSection;
