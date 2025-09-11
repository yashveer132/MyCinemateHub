import React, { useState, useRef, useEffect } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";
import useSpotifyFetch from "../../../hooks/useSpotifyFetch";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import Spinner from "../../../components/spinner/Spinner";
import "./style.scss";

const SongsSection = ({ mediaTitle }) => {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const carouselContainer = useRef();
  const progressRef = useRef();

  const searchQuery = mediaTitle
    ? `${mediaTitle} original motion picture soundtrack`
    : "movie soundtrack";

  const { data: albumsData, loading } = useSpotifyFetch("/search", {
    q: searchQuery,
    type: "album",
    limit: 20,
    market: "US",
  });

  const { data: playlistsData } = useSpotifyFetch("/search", {
    q: searchQuery,
    type: "playlist",
    limit: 5,
    market: "US",
  });

  const { data: tracksData, loading: tracksLoading } = useSpotifyFetch(
    selectedAlbum ? `/albums/${selectedAlbum.id}/tracks` : null,
    { limit: 50, market: "US" }
  );

  useEffect(() => {
    if (albumsData?.albums?.items) {
      albumsData.albums.items.forEach((album, index) => {
        if (index < 2) {
        }
      });
    }
  }, [albumsData]);

  useEffect(() => {
    if (tracksData?.items) {
      tracksData.items.forEach((track, index) => {
        if (index < 5) {
        }
      });
    }
  }, [tracksData]);

  const navigation = (dir) => {
    const container = carouselContainer.current;

    const scrollAmount =
      dir === "left"
        ? container.scrollLeft - (container.offsetWidth + 20)
        : container.scrollLeft + (container.offsetWidth + 20);

    container.scrollTo({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    setShowPopup(true);
    stopCurrentAudio();
  };

  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setPlayingTrack(null);
    setCurrentAudio(null);
    setAudioProgress(0);
    setAudioDuration(0);
  };

  const handlePlayPreview = async (track) => {
    try {
      if (playingTrack === track.id) {
        if (currentAudio) {
          currentAudio.pause();
        }
        setPlayingTrack(null);
      } else {
        stopCurrentAudio();

        if (track.preview_url) {
          const audio = new Audio(track.preview_url);
          audio.volume = volume;

          audio.addEventListener("error", (e) => {
            console.error("Audio error:", e);
            setPlayingTrack(null);
            setCurrentAudio(null);
          });

          audio.addEventListener("canplaythrough", () => {
            audio.play().catch((e) => {
              console.error("Play error:", e);
              setPlayingTrack(null);
            });
          });

          setCurrentAudio(audio);
          setPlayingTrack(track.id);
        }
      }
    } catch (error) {
      console.error("Error handling audio playback:", error);
      setPlayingTrack(null);
      setCurrentAudio(null);
    }
  };

  const handleProgressClick = (e) => {
    if (currentAudio && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;
      const newTime = (percentage / 100) * currentAudio.duration;

      currentAudio.currentTime = newTime;
      setAudioProgress(percentage);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (currentAudio) {
      currentAudio.volume = newVolume;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedAlbum(null);
    stopCurrentAudio();
  };

  const loadingSkeleton = () => (
    <div className="skItem">
      <div className="thumb skeleton"></div>
      <div className="row skeleton"></div>
      <div className="row2 skeleton"></div>
    </div>
  );

  const hasAlbums = albumsData?.albums?.items?.length > 0;

  return (
    <div className="songsSection">
      <ContentWrapper>
        <div className="sectionHeading">Soundtrack Albums</div>
        {!loading ? (
          hasAlbums ? (
            <>
              <BsFillArrowLeftCircleFill
                className="carouselLeftNav arrow"
                onClick={() => navigation("left")}
              />
              <BsFillArrowRightCircleFill
                className="carouselRightNav arrow"
                onClick={() => navigation("right")}
              />
              <div className="albums" ref={carouselContainer}>
                {albumsData.albums.items.map((album) => (
                  <div
                    key={album.id}
                    className="albumItem"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <div className="albumThumbnail">
                      <Img src={album.images[0]?.url} />
                      <div className="playOverlay">
                        <div className="playIcon">▶</div>
                      </div>
                    </div>
                    <div className="albumTitle">{album.name}</div>
                    <div className="albumArtist">
                      {album.artists.map((artist) => artist.name).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="emptyState">
              <div className="emptyIcon">🎵</div>
              <div className="emptyText">No soundtrack albums found</div>
              <div className="emptySubtext">
                Try searching for a different movie or show
              </div>
            </div>
          )
        ) : (
          <div className="albumSkeleton">
            {loadingSkeleton()}
            {loadingSkeleton()}
            {loadingSkeleton()}
            {loadingSkeleton()}
            {loadingSkeleton()}
          </div>
        )}
      </ContentWrapper>

      {showPopup && selectedAlbum && (
        <div className="songsPopup">
          <div className="popupOverlay" onClick={closePopup}></div>
          <div className="popupContent">
            <div className="popupHeader">
              <Img src={selectedAlbum.images[0]?.url} />
              <div className="headerInfo">
                <h2>{selectedAlbum.name}</h2>
                <p>
                  {selectedAlbum.artists
                    .map((artist) => artist.name)
                    .join(", ")}
                </p>
                <div className="albumMeta">
                  <span>{selectedAlbum.total_tracks} tracks</span>
                  <span>•</span>
                  <span>{selectedAlbum.release_date?.split("-")[0]}</span>
                </div>
              </div>
              <button className="closeBtn" onClick={closePopup}>
                ×
              </button>
            </div>

            {playingTrack && (
              <div className="audioControls">
                <div className="progressContainer">
                  <div
                    className="progressBar"
                    ref={progressRef}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="progressFill"
                      style={{ width: `${audioProgress}%` }}
                    ></div>
                  </div>
                  <div className="timeDisplay">
                    <span>{formatTime(currentAudio?.currentTime || 0)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>
                <div className="volumeControl">
                  <span className="volumeIcon">🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volumeSlider"
                  />
                </div>
              </div>
            )}

            <div className="tracksList">
              {tracksLoading ? (
                <div className="tracksLoading">
                  <Spinner />
                  <div className="loadingText">Loading tracks...</div>
                </div>
              ) : tracksData?.items?.length > 0 ? (
                tracksData.items.map((track, index) => (
                  <div key={track.id} className="trackItem">
                    <div className="trackInfo">
                      <span className="trackNumber">{index + 1}</span>
                      <div className="trackDetails">
                        <div className="trackName">{track.name}</div>
                        <div className="trackArtists">
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="trackActions">
                      {track.preview_url ? (
                        <button
                          className={`playBtn ${
                            playingTrack === track.id ? "playing" : ""
                          }`}
                          onClick={() => handlePlayPreview(track)}
                          disabled={tracksLoading}
                        >
                          {playingTrack === track.id ? "⏸" : "▶"}
                        </button>
                      ) : (
                        <a
                          href={`https://open.spotify.com/track/${track.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="spotifyLink"
                          title="Listen on Spotify"
                        >
                          🎵 Spotify
                        </a>
                      )}
                      <div className="trackDuration">
                        {Math.floor(track.duration_ms / 60000)}:
                        {((track.duration_ms % 60000) / 1000)
                          .toFixed(0)
                          .padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="emptyTracks">
                  <div className="emptyIcon">🎵</div>
                  <div className="emptyText">No tracks available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongsSection;
