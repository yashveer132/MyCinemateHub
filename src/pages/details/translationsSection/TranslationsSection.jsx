import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import useFetch from "../../../hooks/useFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const TranslationsSection = ({ mediaType, id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 8;
  const { data, loading } = useFetch(`/${mediaType}/${id}/translations`);
  const { url } = useSelector((state) => state.home);

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="flag skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="subtitle skeleton"></div>
        </div>
      </div>
    );
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentPage(1);
    } else {
      setSearchTerm("");
    }
  };

  const filteredTranslations = useMemo(() => {
    if (!data?.translations || !Array.isArray(data.translations)) return [];
    if (!searchTerm.trim()) return data.translations;

    const filtered = data.translations.filter((translation) => {
      if (!translation) return false;

      const englishName = translation.english_name?.toLowerCase() || "";
      const nativeName = translation.name?.toLowerCase() || "";
      const iso639 = translation.iso_639_1?.toLowerCase() || "";
      const iso3166 = translation.iso_3166_1?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        englishName.includes(searchLower) ||
        nativeName.includes(searchLower) ||
        iso639.includes(searchLower) ||
        iso3166.includes(searchLower)
      );
    });

    return filtered;
  }, [data?.translations, searchTerm]);

  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTranslations = filteredTranslations.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage > 1 && totalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (
    !data?.translations ||
    !Array.isArray(data.translations) ||
    data.translations.length === 0
  ) {
    return null;
  }

  return (
    <div className="translationsSection">
      <ContentWrapper>
        <div className="translationsHeader" onClick={toggleExpanded}>
          <div className="sectionHeading center">
            Available Languages ({data?.translations?.length || 0})
          </div>
          <div className={`expandIcon ${isExpanded ? "expanded" : ""}`}>
            {isExpanded ? "−" : "+"}
          </div>
        </div>

        {isExpanded && (
          <div className="translationsContent">
            <div className="searchContainer">
              <input
                type="text"
                placeholder="Search languages... (e.g., English, French, es, US)"
                value={searchTerm}
                onChange={handleSearchChange}
                className="searchInput"
              />
            </div>

            {!loading ? (
              <>
                {filteredTranslations.length > 0 ? (
                  <>
                    <div className="translationsList">
                      {currentTranslations.map((translation) => (
                        <div
                          key={`${translation.iso_639_1}-${translation.iso_3166_1}`}
                          className="translationItem"
                        >
                          <div className="flag">
                            <img
                              src={`https://flagcdn.com/w40/${translation.iso_3166_1?.toLowerCase()}.png`}
                              alt={translation.english_name}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                          <div className="translationInfo">
                            <div className="languageName">
                              {translation.english_name}
                              {translation.iso_639_1 !== "en" &&
                                translation.name && (
                                  <span className="nativeName">
                                    {" "}
                                    ({translation.name})
                                  </span>
                                )}
                            </div>
                            <div className="countryCode">
                              {translation.iso_3166_1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && currentTranslations.length > 0 && (
                      <div className="pagination">
                        <button
                          className="pageBtn prev"
                          onClick={goToPrevPage}
                          disabled={validCurrentPage === 1}
                        >
                          ‹ Prev
                        </button>

                        <div className="pageNumbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= validCurrentPage - 1 &&
                                  page <= validCurrentPage + 1)
                              );
                            })
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="ellipsis">...</span>
                                )}
                                <button
                                  className={`pageBtn ${
                                    page === validCurrentPage ? "active" : ""
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
                          disabled={validCurrentPage === totalPages}
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                  </>
                ) : searchTerm.trim() ? (
                  <div className="noResults">
                    <p>No languages found matching "{searchTerm}"</p>
                    <button
                      className="clearSearchBtn"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="translationsSkeleton">
                {skeleton()}
                {skeleton()}
                {skeleton()}
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

export default TranslationsSection;
