import React, { useState, useEffect, useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
  BsYoutube,
} from "react-icons/bs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import {
  searchSoundtrackAlbums,
  fetchAlbumTracks,
} from "../../../utils/soundtrack";

const SongsSection = ({ mediaTitle, movieDetails }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

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

    const loadAlbums = async () => {
      if (mediaTitle) {
        setLoading(true);
        try {
          const releaseDate =
            movieDetails?.release_date || movieDetails?.first_air_date;
          const releaseYear = releaseDate
            ? new Date(releaseDate).getFullYear()
            : null;

          const results = await searchSoundtrackAlbums(mediaTitle, releaseYear);
          if (isMounted) {
            setAlbums(results);
          }
        } catch (error) {
          console.error("[SOUNDTRACK] Failed to load albums:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadAlbums();

    return () => {
      isMounted = false;
    };
  }, [mediaTitle, movieDetails]);

  useEffect(() => {
    const container = carouselContainer.current;
    if (container && albums.length > 0) {
      const timer = setTimeout(checkScrollPosition, 100);

      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);

      return () => {
        clearTimeout(timer);
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [albums, loading]);

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

  const handleAlbumClick = async (album) => {
    setSelectedAlbum(album);
    setShowPopup(true);
    setTracksLoading(true);
    try {
      const tracksData = await fetchAlbumTracks(album.id);
      setTracks(tracksData);
    } catch (error) {
      console.error("[SOUNDTRACK] Failed to load tracks:", error);
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedAlbum(null);
    setTracks([]);
  };

  const handleFallbackImage = (e) => {
    e.target.src =
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=250&auto=format&fit=crop";
  };

  const skeleton = () => {
    return (
      <div className="skeletonItem">
        <div className="posterBlock skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="artist skeleton"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="songsSection">
      <ContentWrapper>
        <div className="sectionHeading">🎵 Movie Soundtracks</div>

        {!loading ? (
          albums && albums.length > 0 ? (
            <div className="albumsCarouselWrapper">
              <BsFillArrowLeftCircleFill
                className={`carouselLeftNav arrow ${!showLeftArrow ? "disabled" : ""}`}
                onClick={() => navigate("left")}
              />
              <BsFillArrowRightCircleFill
                className={`carouselRighttNav arrow ${!showRightArrow ? "disabled" : ""}`}
                onClick={() => navigate("right")}
              />
              <div className="albumsGrid" ref={carouselContainer}>
                {albums.map((album, index) => (
                  <div
                    key={album.id}
                    className="albumItem"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <div className="posterBlock">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        onError={handleFallbackImage}
                        loading="lazy"
                      />
                      <div className={`matchRankContainer ${index === 0 ? "highest" : ""}`}>
                        <span className="rankCircle">{index + 1}</span>
                        {index === 0 && <span className="bestMatchText">Best Match</span>}
                      </div>
                      <div className="playOverlay">
                        <span className="playIcon">🔍 View Tracks</span>
                      </div>
                    </div>
                    <div className="textBlock">
                      <div className="albumTitle">{album.title}</div>
                      <div className="albumArtist">{album.artist}</div>
                      <div className="albumMeta">
                        <span className="trackCount">{album.trackCount} Tracks</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="albumsEmpty">
              <div className="noAlbums">
                <div className="noAlbumsIcon">🎵</div>
                <div className="noAlbumsText">
                  Soundtrack information unavailable
                </div>
                <div className="noAlbumsSubtext">
                  This title does not have a catalogued release yet.
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="albumsGrid">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="albumItem">
                {skeleton()}
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>

      {showPopup && selectedAlbum && (
        <div className="popupOverlay" onClick={handleClosePopup}>
          <div className="popupContent" onClick={(e) => e.stopPropagation()}>
            <button className="closeBtn" onClick={handleClosePopup}>
              ×
            </button>

            <div className="popupHeader">
              <div className="popupAlbumImage">
                <img
                  src={selectedAlbum.coverUrl}
                  alt={selectedAlbum.title}
                  onError={handleFallbackImage}
                />
              </div>
              <div className="popupAlbumInfo">
                <h3>{selectedAlbum.title}</h3>
                <p className="artistName">
                  Composer/Artist: {selectedAlbum.artist}
                </p>
                <p className="releaseDate">
                  Released: {selectedAlbum.releaseDate}
                </p>
                <p className="trackCount">
                  Total Tracks: {selectedAlbum.trackCount}
                </p>
              </div>
            </div>

            <div className="popupTracksList">
              <h4>🎵 Tracklist</h4>
              {tracksLoading ? (
                <div className="tracksLoading">
                  <div className="loadingSpinner"></div>
                  <p>Loading tracks from MusicBrainz...</p>
                </div>
              ) : tracks.length > 0 ? (
                <div className="tracksTable">
                  <div className="tableHeader">
                    <span className="colNum">#</span>
                    <span className="colTitle">Title</span>
                    <span className="colArtist">Artist</span>
                    <span className="colDuration">Duration</span>
                    <span className="colAction">Listen</span>
                  </div>
                  <div className="tableBody">
                    {tracks.map((track) => {
                      const query = `"${mediaTitle}" "${track.title}" official soundtrack`;
                      const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

                      const handlePlayClick = async (e) => {
                        e.preventDefault();

                        const newTab = window.open("about:blank", "_blank");
                        newTab.document.write(`
                            <html>
                              <head>
                                <title>Loading Soundtrack...</title>
                                <style>
                                  body {
                                    background: #0b1528;
                                    color: white;
                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    margin: 0;
                                    text-align: center;
                                  }
                                  .spinner {
                                    width: 50px;
                                    height: 50px;
                                    border: 4px solid rgba(255, 255, 255, 0.1);
                                    border-top-color: #ff2a74;
                                    border-radius: 50%;
                                    animation: spin 1s linear infinite;
                                    margin-bottom: 20px;
                                  }
                                  @keyframes spin {
                                    to { transform: rotate(360deg); }
                                  }
                                  h2 { font-weight: 600; margin-bottom: 8px; }
                                  p { color: rgba(255, 255, 255, 0.6); font-size: 14px; }
                                </style>
                              </head>
                              <body>
                                <div class="spinner"></div>
                                  <h2>Finding Direct Video</h2>
                                  <p>Resolving "${track.title}" on YouTube...</p>
                              </body>
                            </html>
                          `);
                        newTab.document.close();

                        try {
                          const searchUrl = `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`;
                          const response = await fetch(searchUrl);
                          const data = await response.json();

                          const firstVideo = data?.items?.find(
                            (item) => item.type === "stream",
                          );
                          if (firstVideo && firstVideo.url) {
                            const videoId = firstVideo.url.split("v=")[1];
                            if (videoId) {
                              newTab.location.href = `https://www.youtube.com/watch?v=${videoId}`;
                              return;
                            }
                          }
                          newTab.location.href = fallbackUrl;
                        } catch (error) {
                          console.warn(
                            "[YOUTUBE DIRECT] Resolution failed, falling back to search:",
                            error,
                          );
                          newTab.location.href = fallbackUrl;
                        }
                      };

                      return (
                        <div key={track.id} className="trackRow">
                          <span className="colNum">{track.position}</span>
                          <span className="colTitle">{track.title}</span>
                          <span className="colArtist">{track.artist}</span>
                          <span className="colDuration">{track.duration}</span>
                          <span className="colAction">
                            <a
                              href={fallbackUrl}
                              onClick={handlePlayClick}
                              className="youtubeListenBtn"
                            >
                              <BsYoutube className="ytIcon" /> Play
                            </a>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="noTracks">
                  <p>No track details available for this release.</p>
                </div>
              )}
            </div>

            <div className="popupFooter">
              <p>
                Music metadata sourced from MusicBrainz. Cover art from Cover
                Art Archive.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongsSection;
