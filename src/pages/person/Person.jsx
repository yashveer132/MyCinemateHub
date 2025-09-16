import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../components/switchTabs/SwitchTabs";
import Img from "../../components/lazyLoadImage/Img";
import avatar from "../../assets/avatar.png";
import "./style.scss";

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: person, loading } = useFetch(`/person/${id}`);
  const { data: credits, loading: creditsLoading } = useFetch(
    `/person/${id}/combined_credits`
  );
  const { data: images } = useFetch(`/person/${id}/images`);
  const { data: externalIds } = useFetch(`/person/${id}/external_ids`);

  const { url } = useSelector((state) => state.home);
  const [activeTab, setActiveTab] = useState("Movies");
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);

  const tabData = ["Movies", "TV Shows"];

  const onTabChange = (tab, index) => {
    setActiveTab(tab);
  };

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="circle skeleton"></div>
        <div className="row skeleton"></div>
        <div className="row2 skeleton"></div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = Math.floor((end - birth) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const calculateCareerAnalytics = (credits) => {
    if (!credits || !credits.cast) return null;

    const movies = credits.cast.filter((item) => item.media_type === "movie");
    const sortedMovies = movies.sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );

    const tvShows = credits.cast.filter((item) => item.media_type === "tv");
    const sortedTVShows = tvShows.sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );

    const years = movies
      .map((movie) =>
        movie.release_date ? new Date(movie.release_date).getFullYear() : null
      )
      .filter((year) => year)
      .sort((a, b) => a - b);

    const careerStart = years.length > 0 ? years[0] : null;
    const careerEnd = years.length > 0 ? years[years.length - 1] : null;

    const yearCount = {};
    years.forEach((year) => {
      yearCount[year] = (yearCount[year] || 0) + 1;
    });
    const peakYear = Object.entries(yearCount).sort(([, a], [, b]) => b - a)[0];

    const avgMoviesPerYear =
      careerStart && careerEnd && careerEnd > careerStart
        ? (movies.length / (careerEnd - careerStart + 1)).toFixed(1)
        : movies.length;

    const genreCount = {};
    const genreRatings = {};
    movies.forEach((movie) => {
      if (movie.genre_ids && movie.vote_average) {
        movie.genre_ids.forEach((genreId) => {
          genreCount[genreId] = (genreCount[genreId] || 0) + 1;
          if (!genreRatings[genreId]) genreRatings[genreId] = [];
          genreRatings[genreId].push(movie.vote_average);
        });
      }
    });

    const genreAvgRatings = Object.entries(genreRatings).map(
      ([genreId, ratings]) => ({
        id: genreId,
        avgRating:
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
        count: genreCount[genreId],
      })
    );
    const mostSuccessfulGenre = genreAvgRatings.sort(
      (a, b) => b.avgRating - a.avgRating
    )[0];

    const decadeCount = {};
    years.forEach((year) => {
      const decade = Math.floor(year / 10) * 10;
      decadeCount[decade] = (decadeCount[decade] || 0) + 1;
    });
    const mostActiveDecade = Object.entries(decadeCount).sort(
      ([, a], [, b]) => b - a
    )[0];

    const ratedMovies = movies.filter(
      (movie) => movie.vote_average && movie.vote_average > 0
    );
    const highestRated = ratedMovies.sort(
      (a, b) => b.vote_average - a.vote_average
    )[0];
    const lowestRated = ratedMovies.sort(
      (a, b) => a.vote_average - b.vote_average
    )[0];

    const successfulMovies = ratedMovies.filter(
      (movie) => movie.vote_average >= 7.0
    );
    const successRate =
      ratedMovies.length > 0
        ? ((successfulMovies.length / ratedMovies.length) * 100).toFixed(1)
        : 0;

    const characterTypes = {};
    movies.forEach((movie) => {
      if (movie.character) {
        const charLower = movie.character.toLowerCase();
        if (charLower.includes("himself") || charLower.includes("herself")) {
          characterTypes["Self"] = (characterTypes["Self"] || 0) + 1;
        } else if (
          charLower.includes("lead") ||
          charLower.includes("protagonist")
        ) {
          characterTypes["Lead"] = (characterTypes["Lead"] || 0) + 1;
        } else if (
          charLower.includes("support") ||
          charLower.includes("friend")
        ) {
          characterTypes["Supporting"] =
            (characterTypes["Supporting"] || 0) + 1;
        } else {
          characterTypes["Other"] = (characterTypes["Other"] || 0) + 1;
        }
      }
    });
    const mostCommonRole = Object.entries(characterTypes).sort(
      ([, a], [, b]) => b - a
    )[0];

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genreId, count]) => ({ id: genreId, count }));

    return {
      totalMovies: movies.length,
      careerStart,
      careerEnd,
      careerSpan: careerStart && careerEnd ? careerEnd - careerStart : null,
      averageRating:
        ratedMovies.length > 0
          ? (
              ratedMovies.reduce((sum, movie) => sum + movie.vote_average, 0) /
              ratedMovies.length
            ).toFixed(1)
          : 0,

      peakYear: peakYear ? { year: peakYear[0], count: peakYear[1] } : null,
      avgMoviesPerYear,
      mostSuccessfulGenre,
      mostActiveDecade: mostActiveDecade
        ? { decade: mostActiveDecade[0], count: mostActiveDecade[1] }
        : null,
      highestRated,
      lowestRated,
      successRate,
      mostCommonRole: mostCommonRole
        ? { type: mostCommonRole[0], count: mostCommonRole[1] }
        : null,

      topMovies: sortedMovies.slice(0, 6),
      topGenres,
      decadeBreakdown: decadeCount,
      topTVShows: sortedTVShows.slice(0, 6),
    };
  };

  const sortCredits = (credits) => {
    if (!credits) return [];
    return credits.sort((a, b) => {
      const dateA = new Date(
        a.release_date || a.first_air_date || "1900-01-01"
      );
      const dateB = new Date(
        b.release_date || b.first_air_date || "1900-01-01"
      );
      return dateB - dateA;
    });
  };

  const filterMovies = (credits) => {
    if (!credits || !credits.cast) return [];
    return credits.cast.filter((item) => item.media_type === "movie");
  };

  const filterTVShows = (credits) => {
    if (!credits || !credits.cast) return [];
    return credits.cast.filter((item) => item.media_type === "tv");
  };

  const handleCreditClick = (credit) => {
    const mediaType = credit.media_type || (credit.title ? "movie" : "tv");
    navigate(`/${mediaType}/${credit.id}`);
  };

  return (
    <div className="personPage">
      {!loading ? (
        <>
          {person && (
            <div className="personBanner">
              <ContentWrapper>
                <div className="content">
                  <div className="left">
                    {person.profile_path ? (
                      <Img
                        className="profileImg"
                        src={url.profile + person.profile_path}
                      />
                    ) : (
                      <Img className="profileImg" src={avatar} />
                    )}
                  </div>
                  <div className="right">
                    <div className="name">{person.name}</div>
                    {person.birthday && (
                      <div className="info">
                        <span className="bold">Born: </span>
                        <span>
                          {formatDate(person.birthday)}
                          {person.place_of_birth &&
                            ` in ${person.place_of_birth}`}
                          {(() => {
                            const age = getAge(
                              person.birthday,
                              person.deathday
                            );
                            return age ? ` (Age ${age})` : "";
                          })()}
                        </span>
                      </div>
                    )}
                    {person.deathday && (
                      <div className="info">
                        <span className="bold">Died: </span>
                        <span>{formatDate(person.deathday)}</span>
                      </div>
                    )}
                    {person.known_for_department && (
                      <div className="info">
                        <span className="bold">Known for: </span>
                        <span>{person.known_for_department}</span>
                      </div>
                    )}
                    {person.also_known_as &&
                      person.also_known_as.length > 0 && (
                        <div className="info">
                          <span className="bold">Also known as: </span>
                          <span>{person.also_known_as.join(", ")}</span>
                        </div>
                      )}
                    {externalIds && (
                      <div className="socialLinks">
                        {externalIds.imdb_id && (
                          <a
                            href={`https://www.imdb.com/name/${externalIds.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            IMDb
                          </a>
                        )}
                        {externalIds.twitter_id && (
                          <a
                            href={`https://twitter.com/${externalIds.twitter_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Twitter
                          </a>
                        )}
                        {externalIds.instagram_id && (
                          <a
                            href={`https://instagram.com/${externalIds.instagram_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Instagram
                          </a>
                        )}
                        {externalIds.facebook_id && (
                          <a
                            href={`https://facebook.com/${externalIds.facebook_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Facebook
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {person.biography && (
                  <div className="biography">
                    <div className="heading">Biography</div>
                    <div className="description">{person.biography}</div>
                  </div>
                )}
              </ContentWrapper>
            </div>
          )}

          {credits && (
            <div className="filmography">
              <ContentWrapper>
                <div className="sectionHeading">Filmography</div>
                <SwitchTabs data={tabData} onTabChange={onTabChange} />
                {!creditsLoading ? (
                  (() => {
                    const ITEMS_PER_PAGE = 8;
                    const isMovies = activeTab === "Movies";
                    const filteredCredits = sortCredits(
                      isMovies ? filterMovies(credits) : filterTVShows(credits)
                    );

                    if (!filteredCredits || filteredCredits.length === 0) {
                      return (
                        <div className="noCreditsCard">
                          <div className="noCreditsIcon">🎬</div>
                          <div className="noCreditsText">
                            No {activeTab.toLowerCase()} found
                          </div>
                          <div className="noCreditsSubtext">
                            {person?.name} doesn't have any{" "}
                            {activeTab.toLowerCase()} credits in our database
                            yet.
                          </div>
                        </div>
                      );
                    }

                    const totalPages = Math.max(
                      1,
                      Math.ceil(filteredCredits.length / ITEMS_PER_PAGE)
                    );
                    const currentPageRaw = isMovies ? moviePage : tvPage;
                    const currentPage = Math.min(
                      Math.max(1, currentPageRaw || 1),
                      totalPages
                    );
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const pageItems = filteredCredits.slice(
                      startIndex,
                      endIndex
                    );

                    const goToPage = (p) => {
                      const clamped = Math.min(Math.max(1, p), totalPages);
                      if (isMovies) setMoviePage(clamped);
                      else setTvPage(clamped);
                    };

                    const getPageNumbers = () => {
                      const maxButtons = 5;
                      if (totalPages <= maxButtons) {
                        return Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        );
                      }
                      const half = Math.floor(maxButtons / 2);
                      let start = Math.max(1, currentPage - half);
                      let end = start + maxButtons - 1;
                      if (end > totalPages) {
                        end = totalPages;
                        start = end - maxButtons + 1;
                      }
                      return Array.from(
                        { length: end - start + 1 },
                        (_, i) => start + i
                      );
                    };

                    return (
                      <>
                        <div className="credits">
                          {pageItems.map((item) => (
                            <div
                              key={`${item.media_type}-${item.id}-${
                                item.credit_id || item.cast_id || startIndex
                              }`}
                              className="creditItem"
                              onClick={() => handleCreditClick(item)}
                            >
                              <div className="posterImg">
                                <Img
                                  src={
                                    item.poster_path
                                      ? url.poster + item.poster_path
                                      : item.backdrop_path
                                      ? url.backdrop + item.backdrop_path
                                      : avatar
                                  }
                                />
                              </div>
                              <div className="details">
                                <div className="title">
                                  {item.title || item.name}
                                </div>
                                <div className="character">
                                  {item.character && `as ${item.character}`}
                                </div>
                                <div className="year">
                                  {item.release_date || item.first_air_date
                                    ? new Date(
                                        item.release_date || item.first_air_date
                                      ).getFullYear()
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pagination">
                          <button
                            className={`pageBtn prev ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                          >
                            Prev
                          </button>
                          {getPageNumbers().map((num) => (
                            <button
                              key={`page-${num}`}
                              className={`pageBtn number ${
                                num === currentPage ? "active" : ""
                              }`}
                              onClick={() => goToPage(num)}
                              aria-current={
                                num === currentPage ? "page" : undefined
                              }
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            className={`pageBtn next ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                          >
                            Next
                          </button>
                          <div className="pageInfo">
                            Page {currentPage} of {totalPages}
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="creditsSkeleton">
                    {skeleton()}
                    {skeleton()}
                    {skeleton()}
                    {skeleton()}
                    {skeleton()}
                    {skeleton()}
                  </div>
                )}
              </ContentWrapper>
            </div>
          )}

          {credits &&
            (() => {
              const analytics = calculateCareerAnalytics(credits);
              return (
                analytics &&
                analytics.totalMovies > 0 && (
                  <div className="careerAnalytics">
                    <ContentWrapper>
                      <div className="sectionHeading">Career Analytics</div>

                      <div className="analyticsGrid">
                        <div className="statCard">
                          <div className="statValue">
                            {analytics.totalMovies}
                          </div>
                          <div className="statLabel">Total Movies</div>
                        </div>

                        {analytics.careerSpan && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.careerSpan}
                            </div>
                            <div className="statLabel">Years Active</div>
                          </div>
                        )}

                        {analytics.careerStart && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.careerStart}
                            </div>
                            <div className="statLabel">Career Start</div>
                          </div>
                        )}

                        <div className="statCard">
                          <div className="statValue">
                            {analytics.averageRating}
                          </div>
                          <div className="statLabel">Avg Movie Rating</div>
                        </div>

                        {analytics.peakYear && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.peakYear.year}
                            </div>
                            <div className="statLabel">
                              Peak Year ({analytics.peakYear.count} movies)
                            </div>
                          </div>
                        )}

                        <div className="statCard">
                          <div className="statValue">
                            {analytics.avgMoviesPerYear}
                          </div>
                          <div className="statLabel">Avg Movies/Year</div>
                        </div>

                        {analytics.mostSuccessfulGenre && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.mostSuccessfulGenre.avgRating.toFixed(
                                1
                              )}
                            </div>
                            <div className="statLabel">Best Genre Rating</div>
                          </div>
                        )}

                        {analytics.mostActiveDecade && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.mostActiveDecade.decade}s
                            </div>
                            <div className="statLabel">Most Active Decade</div>
                          </div>
                        )}

                        {analytics.successRate && analytics.successRate > 0 && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.successRate}%
                            </div>
                            <div className="statLabel">Success Rate (≥7.0)</div>
                          </div>
                        )}

                        {analytics.highestRated && (
                          <div className="statCard">
                            <div className="statValue">
                              {analytics.highestRated.vote_average.toFixed(1)}
                            </div>
                            <div className="statLabel">Highest Rated Movie</div>
                          </div>
                        )}
                      </div>

                      {analytics.topMovies &&
                        analytics.topMovies.length > 0 && (
                          <div className="topMoviesSection">
                            <div className="subsectionHeading">
                              Most Popular Movies
                            </div>
                            <div className="topMoviesGrid">
                              {analytics.topMovies.map((movie, index) => (
                                <div
                                  key={movie.id}
                                  className="topMovieCard"
                                  onClick={() => handleCreditClick(movie)}
                                >
                                  <div className="movieRank">#{index + 1}</div>
                                  <div className="moviePoster">
                                    <Img
                                      src={
                                        movie.poster_path
                                          ? url.poster + movie.poster_path
                                          : avatar
                                      }
                                      alt={movie.title}
                                    />
                                  </div>
                                  <div className="movieInfo">
                                    <div className="movieTitle">
                                      {movie.title}
                                    </div>
                                    <div className="movieYear">
                                      {movie.release_date
                                        ? new Date(
                                            movie.release_date
                                          ).getFullYear()
                                        : "N/A"}
                                    </div>
                                    <div className="movieRating">
                                      ⭐{" "}
                                      {movie.vote_average?.toFixed(1) || "N/A"}
                                    </div>
                                    {movie.character && (
                                      <div className="movieRole">
                                        as {movie.character}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      {analytics.topTVShows &&
                        analytics.topTVShows.length > 0 && (
                          <div className="topTVShowsSection">
                            <div className="subsectionHeading">
                              Most Popular TV Shows
                            </div>
                            <div className="topTVShowsGrid">
                              {analytics.topTVShows.map((tvShow, index) => (
                                <div
                                  key={tvShow.id}
                                  className="topTVShowCard"
                                  onClick={() => handleCreditClick(tvShow)}
                                >
                                  <div className="tvShowRank">#{index + 1}</div>
                                  <div className="tvShowPoster">
                                    <Img
                                      src={
                                        tvShow.poster_path
                                          ? url.poster + tvShow.poster_path
                                          : avatar
                                      }
                                      alt={tvShow.name}
                                    />
                                  </div>
                                  <div className="tvShowInfo">
                                    <div className="tvShowTitle">
                                      {tvShow.name}
                                    </div>
                                    <div className="tvShowYear">
                                      {tvShow.first_air_date
                                        ? new Date(
                                            tvShow.first_air_date
                                          ).getFullYear()
                                        : "N/A"}
                                    </div>
                                    <div className="tvShowRating">
                                      ⭐{" "}
                                      {tvShow.vote_average?.toFixed(1) || "N/A"}
                                    </div>
                                    {tvShow.character && (
                                      <div className="tvShowRole">
                                        as {tvShow.character}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </ContentWrapper>
                  </div>
                )
              );
            })()}

          {images && images.profiles && images.profiles.length > 0 && (
            <div className="imagesSection">
              <ContentWrapper>
                <div className="sectionHeading">Photos</div>
                <div className="images">
                  {images.profiles.slice(0, 10).map((image, index) => (
                    <div key={index} className="imageItem">
                      <Img
                        src={url.profile + image.file_path}
                        alt={`${person?.name} photo ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </ContentWrapper>
            </div>
          )}
        </>
      ) : (
        <div className="personSkeleton">
          <ContentWrapper>
            <div className="left skeleton"></div>
            <div className="right">
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
            </div>
          </ContentWrapper>
        </div>
      )}
    </div>
  );
};

export default Person;
