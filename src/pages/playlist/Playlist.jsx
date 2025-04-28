import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./style.scss";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import { extractSearchParams } from "../../utils/gemini";
import { fetchDataFromApi } from "../../utils/api";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";
import { FaRobot, FaFilm } from "react-icons/fa";
import { RiPlayListFill } from "react-icons/ri";
import Carousel from "../../components/carousel/Carousel";

const Playlist = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [playlistTitle, setPlaylistTitle] = useState("");

  const generatePlaylist = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const searchParams = await extractSearchParams(query);

      if (searchParams?.tmdbParams) {
        const endpoint = "/discover/movie";
        const data = await fetchDataFromApi(endpoint, {
          ...searchParams.tmdbParams,
          page: 1,
          sort_by: "vote_average.desc",
        });

        setPlaylist(data);
        setPlaylistTitle(generatePlaylistTitle(query));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const generatePlaylistTitle = (query) => {
    return (
      query
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") + " Playlist"
    );
  };

  const exampleQueries = [
    "Horror Comedies",
    "Top rated sci-fi movies",
    "Classic romantic comedies",
    "Action-packed thriller movies",
    "Best animated movies for kids",
    "Epic fantasy adventures",
    "Crime drama masterpieces",
    "Mind-bending psychological thrillers",
    "Feel-good family films",
  ];

  return (
    <div className="playlistPage">
      <ContentWrapper>
        <div className="playlistHeader">
          <div className="iconWrapper">
            <RiPlayListFill className="playlistIcon" />
          </div>
          <h1 className="title">AI Playlist Generator</h1>
          <p className="subtitle">
            Let our AI create the perfect movie playlist based on your
            preferences
          </p>
        </div>

        <div className="searchSection">
          <div className="searchBox">
            <input
              type="text"
              placeholder="e.g., Create a playlist of best horror movies from the 90s"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && generatePlaylist()}
            />
            <button
              className="generateBtn"
              onClick={generatePlaylist}
              disabled={loading}
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <FaRobot />
                  <span>Generate Playlist</span>
                </>
              )}
            </button>
          </div>

          <div className="examples">
            <span className="exampleTitle">Try these:</span>
            <div className="exampleTags">
              {exampleQueries.map((eq, index) => (
                <div
                  key={index}
                  className="exampleTag"
                  onClick={() => setQuery(eq)}
                >
                  {eq}
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="loadingState">
            <Spinner />
            <span>Creating your perfect playlist...</span>
          </div>
        )}

        {playlist?.results?.length > 0 && (
          <div className="playlistResults">
            <div className="playlistInfo">
              <FaFilm />
              <h2>{playlistTitle}</h2>
              <span className="count">{playlist.results.length} movies</span>
            </div>

            <Carousel
              data={playlist.results}
              loading={loading}
              endpoint="movie"
            />
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Playlist;
