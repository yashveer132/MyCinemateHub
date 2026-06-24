import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useFetch from "../../hooks/useFetch";
import { fetchDataFromApi } from "../../utils/api";
import {
  fetchAwardsData,
  fetchWikidataBackground,
} from "../../utils/awardsCache";
import Img from "../../components/lazyLoadImage/Img";
import CircleRating from "../../components/circleRating/CircleRating";
import ImdbRating from "../../components/imdbRating/ImdbRating";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Spinner from "../../components/spinner/Spinner";
import MovieCard from "../../components/movieCard/MovieCard";
import Carousel from "../../components/carousel/Carousel";
import PosterFallback from "../../assets/no-poster.png";
import "./style.scss";
import formatDate from "../../utils/formatDate";

const SeriesComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries2, setSelectedSeries2] = useState(null);
  const [similarSeries, setSimilarSeries] = useState([]);
  const [imdbData1, setImdbData1] = useState(null);
  const [imdbData2, setImdbData2] = useState(null);
  const [awardsData1, setAwardsData1] = useState(null);
  const [awardsData2, setAwardsData2] = useState(null);

  const { url } = useSelector((state) => state.home);

  const id1 = searchParams.get("series1");
  const id2 = searchParams.get("series2") || selectedSeries2;

  const { data: series1, loading: loading1 } = useFetch(
    id1 ? `/tv/${id1}` : null,
  );
  const { data: credits1, loading: creditsLoading1 } = useFetch(
    id1 ? `/tv/${id1}/credits` : null,
  );

  const { data: series2, loading: loading2 } = useFetch(
    id2 ? `/tv/${id2}` : null,
  );
  const { data: credits2, loading: creditsLoading2 } = useFetch(
    id2 ? `/tv/${id2}/credits` : null,
  );

  const { data: searchResults, loading: searchLoading } = useFetch(
    searchQuery ? `/search/tv?query=${searchQuery}&page=1` : null,
  );

  const loading = loading1 || loading2 || creditsLoading1 || creditsLoading2;

  const handleSearch = () => {
    if (searchQuery.trim()) {
    }
  };

  const selectSeries2 = (series) => {
    setSelectedSeries2(series.id);
    setSearchParams({ series1: id1, series2: series.id });
  };

  React.useEffect(() => {
    if (!series1?.genres?.length) return;
    const genreIds = series1.genres.map((g) => g.id).join(",");
    fetchDataFromApi(
      `/discover/tv?with_genres=${genreIds}&sort_by=popularity.desc&page=1`,
    )
      .then((res) => {
        const list = (res.results || [])
          .filter((s) => s.id !== series1.id)
          .slice(0, 10);
        setSimilarSeries(list);
      })
      .catch(() => setSimilarSeries([]));
  }, [series1]);

  React.useEffect(() => {
    let isMounted = true;
    const loadAwards1 = async () => {
      if (series1 && series1.id) {
        try {
          const initialData = await fetchAwardsData({
            id: series1.id,
            media_type: "tv",
          });

          if (!isMounted) return;
          setAwardsData1(initialData);

          if (!initialData.isComplete && initialData.imdbId) {
            const enrichedData = await fetchWikidataBackground(
              series1.id,
              "tv",
              initialData.imdbId,
              initialData,
            );

            if (isMounted && enrichedData) {
              setAwardsData1(enrichedData);
            }
          }
        } catch (error) {
          console.error("Failed to load awards for series 1:", error);
          if (isMounted) setAwardsData1(null);
        }
      }
    };
    loadAwards1();
    return () => {
      isMounted = false;
    };
  }, [series1]);

  React.useEffect(() => {
    let isMounted = true;
    const loadAwards2 = async () => {
      if (series2 && series2.id) {
        try {
          const initialData = await fetchAwardsData({
            id: series2.id,
            media_type: "tv",
          });

          if (!isMounted) return;
          setAwardsData2(initialData);

          if (!initialData.isComplete && initialData.imdbId) {
            const enrichedData = await fetchWikidataBackground(
              series2.id,
              "tv",
              initialData.imdbId,
              initialData,
            );

            if (isMounted && enrichedData) {
              setAwardsData2(enrichedData);
            }
          }
        } catch (error) {
          console.error("Failed to load awards for series 2:", error);
          if (isMounted) setAwardsData2(null);
        }
      }
    };
    loadAwards2();
    return () => {
      isMounted = false;
    };
  }, [series2]);

  if (!id1) {
    return (
      <ContentWrapper>
        <div className="errorMessage">
          No first series selected. Go back and select a series to compare.
        </div>
      </ContentWrapper>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  if (!series1) {
    return (
      <ContentWrapper>
        <div className="errorMessage">Unable to load first series data.</div>
      </ContentWrapper>
    );
  }

  if (!id2) {
    return (
      <ContentWrapper>
        <div className="seriesComparison">
          <h1 className="pageTitle">Compare {series1.name} with...</h1>
          <div className="searchSection">
            <input
              type="text"
              placeholder="Search for a series to compare"
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
              {searchResults.results.slice(0, 10).map((series) => (
                <div
                  key={series.id}
                  className="searchResultItem"
                  onClick={() => selectSeries2(series)}
                >
                  <Img
                    src={
                      series.poster_path
                        ? url.poster + series.poster_path
                        : PosterFallback
                    }
                  />
                  <div className="info">
                    <h3>{series.name}</h3>
                    <p>{formatDate(series.first_air_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {similarSeries.length > 0 && (
            <Carousel
              title="Similar Genre Picks"
              data={similarSeries}
              loading={false}
              endpoint="tv"
              onCardClick={selectSeries2}
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

  const getCreator = (crew) => {
    return crew?.find(
      (person) =>
        person.job === "Creator" || person.job === "Executive Producer",
    );
  };

  const formatNumber = (num) => {
    if (!num) return "N/A";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  const commonGenres = getCommonGenres(series1.genres, series2.genres);
  const cast1 = getTopCast(credits1?.cast);
  const cast2 = getTopCast(credits2?.cast);
  const creator1 = getCreator(credits1?.crew);
  const creator2 = getCreator(credits2?.crew);

  const sharedCast = cast1.filter((actor1) =>
    cast2.some((actor2) => actor1.id === actor2.id),
  );

  const getWinner = (value1, value2) => {
    if (!value1 && !value2) return null;
    if (!value1) return 2;
    if (!value2) return 1;
    return value1 > value2 ? 1 : value1 < value2 ? 2 : null;
  };

  const parseOMDBSummary = (summary) => {
    if (!summary) return { wins: 0, nominations: 0 };

    const lowerSummary = summary.toLowerCase();

    let wins = 0;
    let nominations = 0;

    const winMatch = lowerSummary.match(
      /(?:won\s+(\d+))|(?:(\d+)\s+win(?:s)?)/i,
    );
    if (winMatch) {
      const winNum = winMatch[1] || winMatch[2];
      if (winNum) wins = parseInt(winNum);
    }

    const nomMatch = lowerSummary.match(
      /(?:nominated\s+for\s+(\d+))|(?:(\d+)\s+nomination(?:s)?)/i,
    );
    if (nomMatch) {
      const nomNum = nomMatch[1] || nomMatch[2];
      if (nomNum) nominations = parseInt(nomNum);
    }

    const combinedMatch = lowerSummary.match(
      /(\d+)\s*wins?\s*&\s*(\d+)\s*nominations?/i,
    );
    if (combinedMatch) {
      wins = parseInt(combinedMatch[1]);
      nominations = parseInt(combinedMatch[2]);
    }

    return { wins, nominations };
  };

  const getAwardsStats = (awardsData) => {
    if (!awardsData) return { wins: 0, nominations: 0 };

    if (awardsData.awards && awardsData.awards.length > 0) {
      const wins = awardsData.awards.filter(
        (award) => award.result.toLowerCase() === "won",
      ).length;
      const nominations = awardsData.awards.length;
      return { wins, nominations };
    }

    if (awardsData.summary && awardsData.source === "omdb") {
      return parseOMDBSummary(awardsData.summary);
    }

    return { wins: 0, nominations: 0 };
  };

  const getDataSourceLabel = (source) => {
    if (!source) return "";
    if (source === "omdb_wikidata" || source === "local_db" || source === "wikidata") {
      return "(IMDb + Wikidata)";
    }
    return "(IMDb Data)";
  };

  const awards1 = getAwardsStats(awardsData1);
  const awards2 = getAwardsStats(awardsData2);

  return (
    <ContentWrapper>
      <div className="seriesComparison">
        <h1 className="pageTitle">Series Comparison</h1>
        <div className="comparisonContainer">
          <div className="seriesCard">
            <div className="posterSection">
              <div className="poster">
                <Img
                  src={
                    series1.poster_path
                      ? url.poster + series1.poster_path
                      : PosterFallback
                  }
                />
                {getWinner(series1.vote_average, series2.vote_average) ===
                  1 && <div className="winnerBadge">👑 Higher Rated</div>}
              </div>
              <div className="headerInfo">
                <h2>{series1.name}</h2>
                {series1.tagline && (
                  <p className="tagline">"{series1.tagline}"</p>
                )}
                <div className="ratingsContainer">
                  <div className="rating">
                    <CircleRating
                      rating={
                        series1.vote_average
                          ? series1.vote_average.toFixed(1)
                          : 0
                      }
                      voteCount={series1.vote_count}
                      showTooltip={false}
                    />
                    <span className="ratingText">
                      ({series1.vote_count?.toLocaleString() || 0} votes)
                    </span>
                  </div>
                  <div className="rating">
                    <ImdbRating
                      tmdbId={series1.id}
                      mediaType="tv"
                      showTooltip={false}
                      onDataLoaded={setImdbData1}
                    />
                    {imdbData1?.votes && (
                      <span className="ratingText">
                        ({imdbData1.votes} votes)
                      </span>
                    )}
                  </div>
                </div>
                <div className="metaInfo">
                  <div className="metaItem">
                    <span className="icon">📅</span>
                    <span>{formatDate(series1.first_air_date)}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📺</span>
                    <span>
                      {series1.number_of_seasons || "N/A"} Season
                      {series1.number_of_seasons !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🎬</span>
                    <span>{series1.number_of_episodes || "N/A"} Episodes</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🌍</span>
                    <span>{series1.origin_country?.[0] || "N/A"}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📊</span>
                    <span>Popularity: {formatNumber(series1.popularity)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="overview">{series1.overview}</p>

            {creator1 && (
              <div className="creatorSection">
                <h4>🎬 Creator</h4>
                <div
                  className={`creatorName ${
                    creator2 && creator1.id === creator2.id
                      ? "sharedCreator"
                      : ""
                  }`}
                >
                  {creator1.name}
                </div>
              </div>
            )}

            {series1.networks?.length > 0 && (
              <div className="networkSection">
                <h4>📺 Networks</h4>
                <div className="networksList">
                  {series1.networks.slice(0, 3).map((network) => (
                    <span
                      key={network.id}
                      className={
                        series2.networks?.some((n) => n.id === network.id)
                          ? "network sharedNetwork"
                          : "network"
                      }
                    >
                      {network.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {series1.production_companies?.length > 0 && (
              <div className="productionSection">
                <h4>🏢 Production Companies</h4>
                <div className="companiesList">
                  {series1.production_companies.slice(0, 3).map((company) => (
                    <span
                      key={company.id}
                      className={
                        series2.production_companies?.some(
                          (c) => c.id === company.id,
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

            <div className="seriesInfo">
              <h4>📊 Series Details</h4>
              <div className="seriesGrid">
                <div className="seriesItem">
                  <span className="label">Status</span>
                  <span className="value">{series1.status || "N/A"}</span>
                </div>
                <div className="seriesItem">
                  <span className="label">Type</span>
                  <span className="value">{series1.type || "N/A"}</span>
                </div>
                <div className="seriesItem">
                  <span className="label">Language</span>
                  <span className="value">
                    {series1.original_language?.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="seriesItem">
                  <span className="label">Last Air Date</span>
                  <span className="value">
                    {formatDate(series1.last_air_date) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="genresSection">
              <h4>Genres</h4>
              <div className="genresList">
                {series1.genres?.map((g) => (
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

          <div className="seriesCard">
            <div className="posterSection">
              <div className="poster">
                <Img
                  src={
                    series2.poster_path
                      ? url.poster + series2.poster_path
                      : PosterFallback
                  }
                />
                {getWinner(series2.vote_average, series1.vote_average) ===
                  1 && <div className="winnerBadge">👑 Higher Rated</div>}
              </div>
              <div className="headerInfo">
                <h2>{series2.name}</h2>
                {series2.tagline && (
                  <p className="tagline">"{series2.tagline}"</p>
                )}
                <div className="ratingsContainer">
                  <div className="rating">
                    <CircleRating
                      rating={
                        series2.vote_average
                          ? series2.vote_average.toFixed(1)
                          : 0
                      }
                      voteCount={series2.vote_count}
                      showTooltip={false}
                    />
                    <span className="ratingText">
                      ({series2.vote_count?.toLocaleString() || 0} votes)
                    </span>
                  </div>
                  <div className="rating">
                    <ImdbRating
                      tmdbId={series2.id}
                      mediaType="tv"
                      showTooltip={false}
                      onDataLoaded={setImdbData2}
                    />
                    {imdbData2?.votes && (
                      <span className="ratingText">
                        ({imdbData2.votes} votes)
                      </span>
                    )}
                  </div>
                </div>
                <div className="metaInfo">
                  <div className="metaItem">
                    <span className="icon">📅</span>
                    <span>{formatDate(series2.first_air_date)}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📺</span>
                    <span>
                      {series2.number_of_seasons || "N/A"} Season
                      {series2.number_of_seasons !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🎬</span>
                    <span>{series2.number_of_episodes || "N/A"} Episodes</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">🌍</span>
                    <span>{series2.origin_country?.[0] || "N/A"}</span>
                  </div>
                  <div className="metaItem">
                    <span className="icon">📊</span>
                    <span>Popularity: {formatNumber(series2.popularity)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="overview">{series2.overview}</p>

            {creator2 && (
              <div className="creatorSection">
                <h4>🎬 Creator</h4>
                <div
                  className={`creatorName ${
                    creator1 && creator1.id === creator2.id
                      ? "sharedCreator"
                      : ""
                  }`}
                >
                  {creator2.name}
                </div>
              </div>
            )}

            {series2.networks?.length > 0 && (
              <div className="networkSection">
                <h4>📺 Networks</h4>
                <div className="networksList">
                  {series2.networks.slice(0, 3).map((network) => (
                    <span
                      key={network.id}
                      className={
                        series1.networks?.some((n) => n.id === network.id)
                          ? "network sharedNetwork"
                          : "network"
                      }
                    >
                      {network.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {series2.production_companies?.length > 0 && (
              <div className="productionSection">
                <h4>🏢 Production Companies</h4>
                <div className="companiesList">
                  {series2.production_companies.slice(0, 3).map((company) => (
                    <span
                      key={company.id}
                      className={
                        series1.production_companies?.some(
                          (c) => c.id === company.id,
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

            <div className="seriesInfo">
              <h4>📊 Series Details</h4>
              <div className="seriesGrid">
                <div className="seriesItem">
                  <span className="label">Status</span>
                  <span className="value">{series2.status || "N/A"}</span>
                </div>
                <div className="seriesItem">
                  <span className="label">Type</span>
                  <span className="value">{series2.type || "N/A"}</span>
                </div>
                <div className="seriesItem">
                  <span className="label">Language</span>
                  <span className="value">
                    {series2.original_language?.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="seriesItem">
                  <span className="label">Last Air Date</span>
                  <span className="value">
                    {formatDate(series2.last_air_date) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="genresSection">
              <h4>Genres</h4>
              <div className="genresList">
                {series2.genres?.map((g) => (
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
          <h3>Awards & Nominations Comparison</h3>

          <div className="awardsComparison">
            <div className="awardsStats">
              <div className="statCard">
                <div className="statLabel">🏆 Awards Won</div>
                <div className="statValues">
                  <div
                    className={`statValue ${getWinner(awards1.wins, awards2.wins) === 1 ? "winner" : ""}`}
                  >
                    {awards1.wins}
                  </div>
                  <div className="statMovie">{series1.name}</div>
                  {awardsData1?.source && (
                    <div className="dataSource">
                      {getDataSourceLabel(awardsData1.source)}
                    </div>
                  )}
                </div>
                <div className="vs">VS</div>
                <div className="statValues">
                  <div
                    className={`statValue ${getWinner(awards2.wins, awards1.wins) === 1 ? "winner" : ""}`}
                  >
                    {awards2.wins}
                  </div>
                  <div className="statMovie">{series2.name}</div>
                  {awardsData2?.source && (
                    <div className="dataSource">
                      {getDataSourceLabel(awardsData2.source)}
                    </div>
                  )}
                </div>
              </div>

              <div className="statCard">
                <div className="statLabel">📋 Nominations</div>
                <div className="statValues">
                  <div
                    className={`statValue ${getWinner(awards1.nominations, awards2.nominations) === 1 ? "winner" : ""}`}
                  >
                    {awards1.nominations}
                  </div>
                  <div className="statMovie">{series1.name}</div>
                  {awardsData1?.source && (
                    <div className="dataSource">
                      {getDataSourceLabel(awardsData1.source)}
                    </div>
                  )}
                </div>
                <div className="vs">VS</div>
                <div className="statValues">
                  <div
                    className={`statValue ${getWinner(awards2.nominations, awards1.nominations) === 1 ? "winner" : ""}`}
                  >
                    {awards2.nominations}
                  </div>
                  <div className="statMovie">{series2.name}</div>
                  {awardsData2?.source && (
                    <div className="dataSource">
                      {getDataSourceLabel(awardsData2.source)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(awardsData1?.summary || awardsData2?.summary) && (
              <div className="awardsDetails">
                {awardsData1?.summary && (
                  <div className="seriesAwards">
                    <h4>
                      {series1.name} Awards
                      {awardsData1?.source && (
                        <span className="sectionSource">
                          {" "}{getDataSourceLabel(awardsData1.source)}
                        </span>
                      )}
                    </h4>
                    <div className="awardsSummary">{awardsData1.summary}</div>
                  </div>
                )}

                {awardsData2?.summary && (
                  <div className="seriesAwards">
                    <h4>
                      {series2.name} Awards
                      {awardsData2?.source && (
                        <span className="sectionSource">
                          {" "}{getDataSourceLabel(awardsData2.source)}
                        </span>
                      )}
                    </h4>
                    <div className="awardsSummary">{awardsData2.summary}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <h3>Series Performance Metrics</h3>
          <div className="visualComparison">
            <div className="comparisonBars">
              <div className="metricBar">
                <span className="metricName">Rating</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width: `${(series1.vote_average / 10) * 100}%`,
                    }}
                  >
                    <span className="barLabel">
                      {series1.vote_average?.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${(series2.vote_average / 10) * 100}%`,
                    }}
                  >
                    <span className="barLabel">
                      {series2.vote_average?.toFixed(1)}
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
                        (series1.popularity /
                          Math.max(series1.popularity, series2.popularity)) *
                          100,
                        100,
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series1.popularity)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${Math.min(
                        (series2.popularity /
                          Math.max(series1.popularity, series2.popularity)) *
                          100,
                        100,
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series2.popularity)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metricBar">
                <span className="metricName">Seasons</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width:
                        series1.number_of_seasons && series2.number_of_seasons
                          ? `${Math.min(
                              (series1.number_of_seasons /
                                Math.max(
                                  series1.number_of_seasons,
                                  series2.number_of_seasons,
                                )) *
                                100,
                              100,
                            )}%`
                          : series1.number_of_seasons
                            ? "100%"
                            : "0%",
                    }}
                  >
                    <span className="barLabel">
                      {series1.number_of_seasons || 0}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width:
                        series1.number_of_seasons && series2.number_of_seasons
                          ? `${Math.min(
                              (series2.number_of_seasons /
                                Math.max(
                                  series1.number_of_seasons,
                                  series2.number_of_seasons,
                                )) *
                                100,
                              100,
                            )}%`
                          : series2.number_of_seasons
                            ? "100%"
                            : "0%",
                    }}
                  >
                    <span className="barLabel">
                      {series2.number_of_seasons || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="metricBar">
                <span className="metricName">Episodes</span>
                <div className="barContainer">
                  <div
                    className="bar bar1"
                    style={{
                      width:
                        series1.number_of_episodes && series2.number_of_episodes
                          ? `${Math.min(
                              (series1.number_of_episodes /
                                Math.max(
                                  series1.number_of_episodes,
                                  series2.number_of_episodes,
                                )) *
                                100,
                              100,
                            )}%`
                          : series1.number_of_episodes
                            ? "100%"
                            : "0%",
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series1.number_of_episodes)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width:
                        series1.number_of_episodes && series2.number_of_episodes
                          ? `${Math.min(
                              (series2.number_of_episodes /
                                Math.max(
                                  series1.number_of_episodes,
                                  series2.number_of_episodes,
                                )) *
                                100,
                              100,
                            )}%`
                          : series2.number_of_episodes
                            ? "100%"
                            : "0%",
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series2.number_of_episodes)}
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
                        (series1.vote_count /
                          Math.max(series1.vote_count, series2.vote_count)) *
                          100,
                        100,
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series1.vote_count)}
                    </span>
                  </div>
                  <div
                    className="bar bar2"
                    style={{
                      width: `${Math.min(
                        (series2.vote_count /
                          Math.max(series1.vote_count, series2.vote_count)) *
                          100,
                        100,
                      )}%`,
                    }}
                  >
                    <span className="barLabel">
                      {formatNumber(series2.vote_count)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="barLegend">
                <div className="legendItem">
                  <span className="legendColor bar1Color"></span>
                  <span>{series1.name}</span>
                </div>
                <div className="legendItem">
                  <span className="legendColor bar2Color"></span>
                  <span>{series2.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="metricsGrid">
            <div className="metricCard">
              <div className="metricLabel">⭐ Rating Comparison</div>
              <div className="metricValue">
                {series1.vote_average && series2.vote_average ? (
                  series1.vote_average > series2.vote_average ? (
                    <>
                      <span className="highlight">{series1.name}</span> leads by{" "}
                      {(series1.vote_average - series2.vote_average).toFixed(1)}{" "}
                      points
                    </>
                  ) : series2.vote_average > series1.vote_average ? (
                    <>
                      <span className="highlight">{series2.name}</span> leads by{" "}
                      {(series2.vote_average - series1.vote_average).toFixed(1)}{" "}
                      points
                    </>
                  ) : (
                    "Both series are rated equally"
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
                  ? series1.genres
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

            {creator1 && creator2 && (
              <div className="metricCard">
                <div className="metricLabel">🎬 Creators</div>
                <div className="metricValue">
                  {creator1.id === creator2.id ? (
                    <>
                      <span className="highlight">Same creator!</span>{" "}
                      {creator1.name}
                    </>
                  ) : (
                    <>
                      {creator1.name} vs {creator2.name}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="metricCard">
              <div className="metricLabel">📊 Popularity Comparison</div>
              <div className="metricValue">
                {series1.popularity && series2.popularity ? (
                  series1.popularity > series2.popularity ? (
                    <>
                      <span className="highlight">{series1.name}</span> is more
                      popular by{" "}
                      {(
                        (series1.popularity / series2.popularity - 1) *
                        100
                      ).toFixed(0)}
                      %
                    </>
                  ) : series2.popularity > series1.popularity ? (
                    <>
                      <span className="highlight">{series2.name}</span> is more
                      popular by{" "}
                      {(
                        (series2.popularity / series1.popularity - 1) *
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

            {series1.networks?.length > 0 && series2.networks?.length > 0 && (
              <div className="metricCard">
                <div className="metricLabel">📺 Networks</div>
                <div className="metricValue">
                  {series1.networks.some((n1) =>
                    series2.networks.some((n2) => n2.id === n1.id),
                  )
                    ? `Shared: ${series1.networks
                        .filter((n1) =>
                          series2.networks.some((n2) => n2.id === n1.id),
                        )
                        .map((n) => n.name)
                        .join(", ")}`
                    : "Different networks"}
                </div>
              </div>
            )}

            <div className="metricCard">
              <div className="metricLabel">📺 Seasons Difference</div>
              <div className="metricValue">
                {series1.number_of_seasons && series2.number_of_seasons ? (
                  series1.number_of_seasons > series2.number_of_seasons ? (
                    <>
                      <span className="highlight">{series1.name}</span> has{" "}
                      {series1.number_of_seasons - series2.number_of_seasons}{" "}
                      more season
                      {series1.number_of_seasons - series2.number_of_seasons !==
                      1
                        ? "s"
                        : ""}
                    </>
                  ) : series2.number_of_seasons > series1.number_of_seasons ? (
                    <>
                      <span className="highlight">{series2.name}</span> has{" "}
                      {series2.number_of_seasons - series1.number_of_seasons}{" "}
                      more season
                      {series2.number_of_seasons - series1.number_of_seasons !==
                      1
                        ? "s"
                        : ""}
                    </>
                  ) : (
                    "Both have the same number of seasons"
                  )
                ) : (
                  "Season data not available"
                )}
              </div>
            </div>

            <div className="metricCard">
              <div className="metricLabel">🎬 Episodes Difference</div>
              <div className="metricValue">
                {series1.number_of_episodes && series2.number_of_episodes ? (
                  series1.number_of_episodes > series2.number_of_episodes ? (
                    <>
                      <span className="highlight">{series1.name}</span> has{" "}
                      {series1.number_of_episodes - series2.number_of_episodes}{" "}
                      more episode
                      {series1.number_of_episodes -
                        series2.number_of_episodes !==
                      1
                        ? "s"
                        : ""}
                    </>
                  ) : series2.number_of_episodes >
                    series1.number_of_episodes ? (
                    <>
                      <span className="highlight">{series2.name}</span> has{" "}
                      {series2.number_of_episodes - series1.number_of_episodes}{" "}
                      more episode
                      {series2.number_of_episodes -
                        series1.number_of_episodes !==
                      1
                        ? "s"
                        : ""}
                    </>
                  ) : (
                    "Both have the same number of episodes"
                  )
                ) : (
                  "Episode data not available"
                )}
              </div>
            </div>

            <div className="metricCard">
              <div className="metricLabel">📅 Series Status</div>
              <div className="metricValue">
                {series1.status && series2.status ? (
                  series1.status === series2.status ? (
                    <>Both series are {series1.status.toLowerCase()}</>
                  ) : (
                    <>
                      {series1.name}: {series1.status} | {series2.name}:{" "}
                      {series2.status}
                    </>
                  )
                ) : (
                  "Status data not available"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
};

export default SeriesComparison;
