import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useFetch from "../../hooks/useFetch";
import { fetchDataFromApi } from "../../utils/api";
import Img from "../../components/lazyLoadImage/Img";
import CircleRating from "../../components/circleRating/CircleRating";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Spinner from "../../components/spinner/Spinner";
import MovieCard from "../../components/movieCard/MovieCard";
import Carousel from "../../components/carousel/Carousel";
import PosterFallback from "../../assets/no-poster.png";
import "./style.scss";
import formatDate from "../../utils/formatDate";

const MovieComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovie2, setSelectedMovie2] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);

  const { url } = useSelector((state) => state.home);

  const id1 = searchParams.get("movie1");
  const id2 = searchParams.get("movie2") || selectedMovie2;

  const { data: movie1, loading: loading1 } = useFetch(
    id1 ? `/movie/${id1}` : null
  );
  const { data: credits1, loading: creditsLoading1 } = useFetch(
    id1 ? `/movie/${id1}/credits` : null
  );

  const { data: movie2, loading: loading2 } = useFetch(
    id2 ? `/movie/${id2}` : null
  );
  const { data: credits2, loading: creditsLoading2 } = useFetch(
    id2 ? `/movie/${id2}/credits` : null
  );

  const { data: searchResults, loading: searchLoading } = useFetch(
    searchQuery ? `/search/movie?query=${searchQuery}&page=1` : null
  );

  const loading = loading1 || loading2 || creditsLoading1 || creditsLoading2;

  const handleSearch = () => {
    if (searchQuery.trim()) {
    }
  };

  const selectMovie2 = (movie) => {
    setSelectedMovie2(movie.id);
    setSearchParams({ movie1: id1, movie2: movie.id });
  };

  React.useEffect(() => {
    if (!movie1?.genres?.length) return;
    const genreIds = movie1.genres.map((g) => g.id).join(",");
    fetchDataFromApi(
      `/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&page=1`
    )
      .then((res) => {
        const list = (res.results || [])
          .filter((m) => m.id !== movie1.id)
          .slice(0, 10);
        setSimilarMovies(list);
      })
      .catch(() => setSimilarMovies([]));
  }, [movie1]);

  if (!id1) {
    return (
      <ContentWrapper>
        <div className="errorMessage">
          No first movie selected. Go back and select a movie to compare.
        </div>
      </ContentWrapper>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  if (!movie1) {
    return (
      <ContentWrapper>
        <div className="errorMessage">Unable to load first movie data.</div>
      </ContentWrapper>
    );
  }

  if (!id2) {
    return (
      <ContentWrapper>
        <div className="movieComparison">
          <h1 className="pageTitle">Compare {movie1.title} with...</h1>
          <div className="searchSection">
            <input
              type="text"
              placeholder="Search for a movie to compare"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          {searchLoading && (
            <div className="loadingContainer">
              <Spinner />
            </div>
          )}
          {searchResults?.results && (
            <div className="searchResults">
              {searchResults.results.slice(0, 10).map((movie) => (
                <div
                  key={movie.id}
                  className="searchResultItem"
                  onClick={() => selectMovie2(movie)}
                >
                  <Img
                    src={
                      movie.poster_path
                        ? url.poster + movie.poster_path
                        : PosterFallback
                    }
                  />
                  <div className="info">
                    <h3>{movie.title}</h3>
                    <p>{formatDate(movie.release_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {similarMovies.length > 0 && (
            <Carousel
              title="Similar Genre Picks"
              data={similarMovies}
              loading={false}
              endpoint="movie"
              onCardClick={selectMovie2}
            />
          )}
        </div>
      </ContentWrapper>
    );
  }

  const getCommonGenres = (genres1, genres2) => {
    const ids1 = genres1?.map((g) => g.id) || [];
    const ids2 = genres2?.map((g) => g.id) || [];
    return ids1.filter((id) => ids2.includes(id));
  };

  const getTopCast = (cast, limit = 5) => cast?.slice(0, limit) || [];

  const getDirector = (crew) => {
    return crew?.find((person) => person.job === "Director");
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num) return "N/A";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  const commonGenres = getCommonGenres(movie1.genres, movie2.genres);
  const cast1 = getTopCast(credits1?.cast);
  const cast2 = getTopCast(credits2?.cast);
  const director1 = getDirector(credits1?.crew);
  const director2 = getDirector(credits2?.crew);

  const sharedCast = cast1.filter((actor1) =>
    cast2.some((actor2) => actor1.id === actor2.id)
  );

  const profit1 = (movie1.revenue || 0) - (movie1.budget || 0);
  const profit2 = (movie2.revenue || 0) - (movie2.budget || 0);

  const getWinner = (value1, value2) => {
    if (!value1 && !value2) return null;
    if (!value1) return 2;
    if (!value2) return 1;
    return value1 > value2 ? 1 : value1 < value2 ? 2 : null;
  };

  return (
    <ContentWrapper>
      <div className="movieComparison">
        <h1 className="pageTitle">Movie Comparison</h1>
        <div className="comparisonContainer">
          <div className="movieCard">
            <div className="posterSection">
              <div className="poster">
                <Img
                  src={
                    movie1.poster_path
                      ? url.poster + movie1.poster_path
                      : PosterFallback
                  }
                />
                {getWinner(movie1.vote_average, movie2.vote_average) === 1 && (
                  <div className="winnerBadge">👑 Higher Rated</div>
                )}
              </div>
              <div className="headerInfo">
                <h2>{movie1.title}</h2>
                {movie1.tagline && (
                  <p className="tagline">"{movie1.tagline}"</p>
                )}
                <div className="rating">
                  <CircleRating
                    rating={
                      movie1.vote_average ? movie1.vote_average.toFixed(1) : 0
                    }
                  />
                  <span className="ratingText">
                    ({movie1.vote_count?.toLocaleString() || 0} votes)
                  </span>
                </div>
                <div className="metaInfo">
                  <div className="metaItem">
                    <span className="icon">📅</span>
                    <span>{formatDate(movie1.release_date)}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">⏱️</span>
                    <span>{movie1.runtime || "N/A"} min</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🌍</span>
                    <span>
                      {movie1.original_language?.toUpperCase() || "N/A"}
                    </span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📊</span>
                    <span>Popularity: {formatNumber(movie1.popularity)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="overview">{movie1.overview}</p>

            {director1 && (
              <div className="directorSection">
                <h4>🎬 Director</h4>
                <div
                  className={`directorName ${
                    director2 && director1.id === director2.id
                      ? "sharedDirector"
                      : ""
                  }`}
                >
                  {director1.name}
                </div>
              </div>
            )}

            {movie1.production_companies?.length > 0 && (
              <div className="productionSection">
                <h4>🏢 Production Companies</h4>
                <div className="companiesList">
                  {movie1.production_companies.slice(0, 3).map((company) => (
                    <span
                      key={company.id}
                      className={
                        movie2.production_companies?.some(
                          (c) => c.id === company.id
                        )
                          ? "company sharedCompany"
                          : "company"
                      }
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="financialSection">
              <h4>💰 Financial Performance</h4>
              <div className="financialGrid">
                <div className="financialItem">
                  <span className="label">Budget</span>
                  <span className="value">{formatCurrency(movie1.budget)}</span>
                </div>
                <div className="financialItem">
                  <span className="label">Revenue</span>
                  <span
                    className={`value ${
                      getWinner(movie1.revenue, movie2.revenue) === 1
                        ? "winner"
                        : ""
                    }`}
                  >
                    {formatCurrency(movie1.revenue)}
                  </span>
                </div>
                <div className="financialItem">
                  <span className="label">Profit</span>
                  <span
                    className={`value ${
                      getWinner(profit1, profit2) === 1 ? "winner" : ""
                    }`}
                  >
                    {formatCurrency(profit1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="genresSection">
              <h4>Genres</h4>
              <div className="genresList">
                {movie1.genres?.map((g) => (
                  <span
                    key={g.id}
                    className={
                      commonGenres.includes(g.id)
                        ? "genre commonGenre"
                        : "genre"
                    }
                  >
                    {g.name}
                  </span>
                )) || <span className="genre">No genres available</span>}
              </div>
            </div>

            <div className="cast">
              <h3>Top Cast</h3>
              <ul>
                {cast1.map((actor) => (
                  <li
                    key={actor.id}
                    className={
                      sharedCast.some((shared) => shared.id === actor.id)
                        ? "sharedCast"
                        : ""
                    }
                  >
                    {actor.name} <span style={{ opacity: 0.6 }}>as</span>{" "}
                    {actor.character}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="vsDivider">
            <div className="vsBadge">VS</div>
            <div className="vsLine"></div>
          </div>

          <div className="movieCard">
            <div className="posterSection">
              <div className="poster">
                <Img
                  src={
                    movie2.poster_path
                      ? url.poster + movie2.poster_path
                      : PosterFallback
                  }
                />
                {getWinner(movie2.vote_average, movie1.vote_average) === 1 && (
                  <div className="winnerBadge">👑 Higher Rated</div>
                )}
              </div>
              <div className="headerInfo">
                <h2>{movie2.title}</h2>
                {movie2.tagline && (
                  <p className="tagline">"{movie2.tagline}"</p>
                )}
                <div className="rating">
                  <CircleRating
                    rating={
                      movie2.vote_average ? movie2.vote_average.toFixed(1) : 0
                    }
                  />
                  <span className="ratingText">
                    ({movie2.vote_count?.toLocaleString() || 0} votes)
                  </span>
                </div>
                <div className="metaInfo">
                  <div className="metaItem">
                    <span className="icon">📅</span>
                    <span>{formatDate(movie2.release_date)}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">⏱️</span>
                    <span>{movie2.runtime || "N/A"} min</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🌍</span>
                    <span>
                      {movie2.original_language?.toUpperCase() || "N/A"}
                    </span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📊</span>
                    <span>Popularity: {formatNumber(movie2.popularity)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="overview">{movie2.overview}</p>

            {director2 && (
              <div className="directorSection">
                <h4>🎬 Director</h4>
                <div
                  className={`directorName ${
                    director1 && director1.id === director2.id
                      ? "sharedDirector"
                      : ""
                  }`}
                >
                  {director2.name}
                </div>
              </div>
            )}

            {movie2.production_companies?.length > 0 && (
              <div className="productionSection">
                <h4>🏢 Production Companies</h4>
                <div className="companiesList">
                  {movie2.production_companies.slice(0, 3).map((company) => (
                    <span
                      key={company.id}
                      className={
                        movie1.production_companies?.some(
                          (c) => c.id === company.id
                        )
                          ? "company sharedCompany"
                          : "company"
                      }
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="financialSection">
              <h4>💰 Financial Performance</h4>
              <div className="financialGrid">
                <div className="financialItem">
                  <span className="label">Budget</span>
                  <span className="value">{formatCurrency(movie2.budget)}</span>
                </div>
                <div className="financialItem">
                  <span className="label">Revenue</span>
                  <span
                    className={`value ${
                      getWinner(movie2.revenue, movie1.revenue) === 1
                        ? "winner"
                        : ""
                    }`}
                  >
                    {formatCurrency(movie2.revenue)}
                  </span>
                </div>
                <div className="financialItem">
                  <span className="label">Profit</span>
                  <span
                    className={`value ${
                      getWinner(profit2, profit1) === 1 ? "winner" : ""
                    }`}
                  >
                    {formatCurrency(profit2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="genresSection">
              <h4>Genres</h4>
              <div className="genresList">
                {movie2.genres?.map((g) => (
                  <span
                    key={g.id}
                    className={
                      commonGenres.includes(g.id)
                        ? "genre commonGenre"
                        : "genre"
                    }
                  >
                    {g.name}
                  </span>
                )) || <span className="genre">No genres available</span>}
              </div>
            </div>

            <div className="cast">
              <h3>Top Cast</h3>
              <ul>
                {cast2.map((actor) => (
                  <li
                    key={actor.id}
                    className={
                      sharedCast.some((shared) => shared.id === actor.id)
                        ? "sharedCast"
                        : ""
                    }
                  >
                    {actor.name} <span style={{ opacity: 0.6 }}>as</span>{" "}
                    {actor.character}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="comparisonMetrics">
          <h3>Comparison Insights</h3>

          <div className="visualComparison">
            <h4>Performance Metrics</h4>
            <div className="comparisonBars">
              <div className="metricBar">
                <span className="metricName">Rating</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width: `${(movie1.vote_average / 10) * 100}%`,
                    }}
                  >
                    <span className="barLabel">
                      {movie1.vote_average?.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${(movie2.vote_average / 10) * 100}%`,
                    }}
                  >
                    <span className="barLabel">
                      {movie2.vote_average?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metricBar">
                <span className="metricName">Popularity</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width: `${Math.min(
                        (movie1.popularity /
                          Math.max(movie1.popularity, movie2.popularity)) *
                          100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(movie1.popularity)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${Math.min(
                        (movie2.popularity /
                          Math.max(movie1.popularity, movie2.popularity)) *
                          100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(movie2.popularity)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metricBar">
                <span className="metricName">Vote Count</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width: `${Math.min(
                        (movie1.vote_count /
                          Math.max(movie1.vote_count, movie2.vote_count)) *
                          100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(movie1.vote_count)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${Math.min(
                        (movie2.vote_count /
                          Math.max(movie1.vote_count, movie2.vote_count)) *
                          100,
                        100
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(movie2.vote_count)}
                    </span>
                  </div>
                </div>
              </div>

              {movie1.revenue > 0 && movie2.revenue > 0 && (
                <div className="metricBar">
                  <span className="metricName">Revenue</span>
                  <div className="barContainer">
                    <div
                      className="bar bar1"
                      style={{
                        width: `${Math.min(
                          (movie1.revenue /
                            Math.max(movie1.revenue, movie2.revenue)) *
                            100,
                          100
                        )}%`,
                      }}
                    >
                      <span className="barLabel">
                        {formatCurrency(movie1.revenue)}
                      </span>
                    </div>
                    <div
                      className="bar bar2"
                      style={{
                        width: `${Math.min(
                          (movie2.revenue /
                            Math.max(movie1.revenue, movie2.revenue)) *
                            100,
                          100
                        )}%`,
                      }}
                    >
                      <span className="barLabel">
                        {formatCurrency(movie2.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {profit1 > 0 && profit2 > 0 && (
                <div className="metricBar">
                  <span className="metricName">Profit</span>
                  <div className="barContainer">
                    <div
                      className="bar bar1"
                      style={{
                        width: `${Math.min(
                          (profit1 / Math.max(profit1, profit2)) * 100,
                          100
                        )}%`,
                      }}
                    >
                      <span className="barLabel">
                        {formatCurrency(profit1)}
                      </span>
                    </div>
                    <div
                      className="bar bar2"
                      style={{
                        width: `${Math.min(
                          (profit2 / Math.max(profit1, profit2)) * 100,
                          100
                        )}%`,
                      }}
                    >
                      <span className="barLabel">
                        {formatCurrency(profit2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="barLegend">
                <div className="legendItem">
                  <span className="legendColor bar1Color"></span>
                  <span>{movie1.title}</span>
                </div>
                <div className="legendItem">
                  <span className="legendColor bar2Color"></span>
                  <span>{movie2.title}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="metricsGrid">
            <div className="metricCard">
              <div className="metricLabel">⭐ Rating Comparison</div>
              <div className="metricValue">
                {movie1.vote_average && movie2.vote_average ? (
                  movie1.vote_average > movie2.vote_average ? (
                    <>
                      <span className="highlight">{movie1.title}</span> leads by{" "}
                      {(movie1.vote_average - movie2.vote_average).toFixed(1)}{" "}
                      points
                    </>
                  ) : movie2.vote_average > movie1.vote_average ? (
                    <>
                      <span className="highlight">{movie2.title}</span> leads by{" "}
                      {(movie2.vote_average - movie1.vote_average).toFixed(1)}{" "}
                      points
                    </>
                  ) : (
                    "Both movies are rated equally"
                  )
                ) : (
                  "Rating data not available"
                )}
              </div>
            </div>

            <div className="metricCard">
              <div className="metricLabel">🎭 Common Genres</div>
              <div className="metricValue">
                {commonGenres.length > 0
                  ? movie1.genres
                      .filter((g) => commonGenres.includes(g.id))
                      .map((g) => g.name)
                      .join(", ")
                  : "No common genres"}
              </div>
            </div>

            <div className="metricCard">
              <div className="metricLabel">👥 Shared Cast</div>
              <div className="metricValue">
                {sharedCast.length > 0
                  ? `${sharedCast.length} shared actor${
                      sharedCast.length > 1 ? "s" : ""
                    }: ${sharedCast.map((a) => a.name).join(", ")}`
                  : "No shared cast members"}
              </div>
            </div>

            {director1 && director2 && (
              <div className="metricCard">
                <div className="metricLabel">🎬 Directors</div>
                <div className="metricValue">
                  {director1.id === director2.id ? (
                    <>
                      <span className="highlight">Same director!</span>{" "}
                      {director1.name}
                    </>
                  ) : (
                    <>
                      {director1.name} vs {director2.name}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="metricCard">
              <div className="metricLabel">📊 Popularity Comparison</div>
              <div className="metricValue">
                {movie1.popularity && movie2.popularity ? (
                  movie1.popularity > movie2.popularity ? (
                    <>
                      <span className="highlight">{movie1.title}</span> is more
                      popular by{" "}
                      {(
                        (movie1.popularity / movie2.popularity - 1) *
                        100
                      ).toFixed(0)}
                      %
                    </>
                  ) : movie2.popularity > movie1.popularity ? (
                    <>
                      <span className="highlight">{movie2.title}</span> is more
                      popular by{" "}
                      {(
                        (movie2.popularity / movie1.popularity - 1) *
                        100
                      ).toFixed(0)}
                      %
                    </>
                  ) : (
                    "Both equally popular"
                  )
                ) : (
                  "Popularity data not available"
                )}
              </div>
            </div>

            {movie1.production_companies?.length > 0 &&
              movie2.production_companies?.length > 0 && (
                <div className="metricCard">
                  <div className="metricLabel">🏢 Production Companies</div>
                  <div className="metricValue">
                    {movie1.production_companies.some((c1) =>
                      movie2.production_companies.some((c2) => c2.id === c1.id)
                    )
                      ? `Shared: ${movie1.production_companies
                          .filter((c1) =>
                            movie2.production_companies.some(
                              (c2) => c2.id === c1.id
                            )
                          )
                          .map((c) => c.name)
                          .join(", ")}`
                      : "Different production companies"}
                  </div>
                </div>
              )}

            {profit1 > 0 && profit2 > 0 && (
              <div className="metricCard">
                <div className="metricLabel">💵 Profit Comparison</div>
                <div className="metricValue">
                  {profit1 > profit2 ? (
                    <>
                      <span className="highlight">{movie1.title}</span> earned{" "}
                      {formatCurrency(profit1 - profit2)} more
                    </>
                  ) : profit2 > profit1 ? (
                    <>
                      <span className="highlight">{movie2.title}</span> earned{" "}
                      {formatCurrency(profit2 - profit1)} more
                    </>
                  ) : (
                    "Both earned equal profit"
                  )}
                </div>
              </div>
            )}

            <div className="metricCard">
              <div className="metricLabel">⏱️ Runtime Difference</div>
              <div className="metricValue">
                {movie1.runtime && movie2.runtime ? (
                  movie1.runtime > movie2.runtime ? (
                    <>
                      <span className="highlight">{movie1.title}</span> is{" "}
                      {movie1.runtime - movie2.runtime} minutes longer
                    </>
                  ) : movie2.runtime > movie1.runtime ? (
                    <>
                      <span className="highlight">{movie2.title}</span> is{" "}
                      {movie2.runtime - movie1.runtime} minutes longer
                    </>
                  ) : (
                    "Both have the same runtime"
                  )
                ) : (
                  "Runtime data not available"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
};

export default MovieComparison;
