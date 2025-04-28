import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactPlayer from "react-player/youtube";
import Peer from "peerjs";
import { fetchDataFromApi } from "../../utils/api";
import {
  FaUsers,
  FaPlay,
  FaShare,
  FaCopy,
  FaTimes,
  FaRobot,
} from "react-icons/fa";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import "./style.scss";

const WatchParty = ({ videoId: initialVideoId, movieData, onClose }) => {
  const playerRef = useRef(null);
  const peerRef = useRef(null);
  const connectionsRef = useRef(new Set());

  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId);
  const [playing, setPlaying] = useState(true);
  const [showCopied, setShowCopied] = useState(false);
  const [similarTrailers, setSimilarTrailers] = useState([]);
  const [syncingPlayback, setSyncingPlayback] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const peer = new Peer(
      `party-${movieData?.id}-${currentVideoId}-${Date.now()}`
    );
    peerRef.current = peer;

    peer.on("open", (id) => {
      const urlParams = new URLSearchParams(window.location.search);
      const hostId = urlParams.get("host");

      if (hostId && hostId !== id) {
        const conn = peer.connect(hostId);
        handleNewConnection(conn);
      } else {
        setIsHost(true);
      }
    });

    peer.on("connection", handleNewConnection);

    return () => {
      connectionsRef.current.forEach((conn) => conn.close());
      peer.destroy();
    };
  }, [movieData?.id, currentVideoId]);

  const handleNewConnection = useCallback(
    (conn) => {
      conn.on("open", () => {
        connectionsRef.current.add(conn);
        setUserCount((prev) => prev + 1);

        if (isHost && playerRef.current) {
          conn.send({
            type: "initial-state",
            data: {
              videoId: currentVideoId,
              currentTime: playerRef.current.getCurrentTime() || 0,
              playing,
            },
          });
        }
      });

      conn.on("data", (data) => {
        if (data.type === "initial-state") {
          setCurrentVideoId(data.data.videoId);
          setPlaying(data.data.playing);
          playerRef.current?.seekTo(data.data.currentTime);
        } else if (data.type === "sync") {
          setSyncingPlayback(true);
          setPlaying(data.data.playing);
          playerRef.current?.seekTo(data.data.currentTime);
          setTimeout(() => setSyncingPlayback(false), 500);
        }
      });

      conn.on("close", () => {
        connectionsRef.current.delete(conn);
        setUserCount((prev) => prev - 1);
      });
    },
    [isHost, currentVideoId, playing]
  );

  const broadcastState = useCallback((type, data) => {
    connectionsRef.current.forEach((conn) => {
      conn.send({ type, data });
    });
  }, []);

  const handleProgress = useCallback(
    ({ playedSeconds }) => {
      if (!syncingPlayback && isHost) {
        setCurrentTime(playedSeconds);
        broadcastState("sync", {
          playing,
          currentTime: playedSeconds,
        });
      }
    },
    [syncingPlayback, isHost, playing, broadcastState]
  );

  const handlePlayPause = useCallback(
    (isPlaying) => {
      if (syncingPlayback) return;
      setPlaying(isPlaying);
      if (isHost) {
        broadcastState("sync", {
          playing: isPlaying,
          currentTime: playerRef.current?.getCurrentTime() || 0,
        });
      }
    },
    [syncingPlayback, isHost, broadcastState]
  );

  useEffect(() => {
    const fetchSimilarTrailers = async () => {
      if (!movieData?.id) return;
      try {
        const similar = await fetchDataFromApi(
          `/movie/${movieData.id}/similar`
        );
        const trailerPromises = similar.results
          .slice(0, 6)
          .map((movie) => fetchDataFromApi(`/movie/${movie.id}/videos`));

        const trailers = await Promise.all(trailerPromises);
        const validTrailers = trailers
          .map((t) => t.results?.find((v) => v.type === "Trailer"))
          .filter((t) => t);

        setSimilarTrailers(validTrailers);
      } catch (error) {
      }
    };

    fetchSimilarTrailers();
  }, [movieData?.id]);

  const shareRoom = useCallback(() => {
    const url = `${window.location.origin}/watch/${movieData?.id}-${currentVideoId}?host=${peerRef.current?.id}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [movieData?.id, currentVideoId]);

  const handleTrailerClick = useCallback((trailer) => {
    setCurrentVideoId(trailer.key);
    setPlaying(true);
    broadcastState("video-change", { videoId: trailer.key });
  }, []);

  if (!movieData || !currentVideoId) {
    return (
      <div className="watchParty">
        <ContentWrapper>
          <div className="watchPartyContainer">
            <div className="header">
              <button className="closeBtn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>
            <div className="error">Missing required movie data or video ID</div>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="watchParty">
      <ContentWrapper>
        <div className="watchPartyContainer">
          <div className="header">
            <div className="roomInfo">
              <div className="viewerCount">
                <FaUsers /> <span>{userCount} Watching</span>
              </div>
              <button className="shareBtn" onClick={shareRoom}>
                <span className="icon">
                  {showCopied ? <FaCopy /> : <FaShare />}
                </span>
                <span className="text">
                  {showCopied ? "Link Copied!" : "Share Room"}
                </span>
              </button>
            </div>
            <button className="closeBtn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className="mainContent">
            <div className="videoSection">
              <div className="playerWrapper">
                <ReactPlayer
                  ref={playerRef}
                  url={`https://www.youtube.com/watch?v=${currentVideoId}`}
                  playing={playing}
                  controls
                  width="100%"
                  height="100%"
                  onProgress={handleProgress}
                  onPlay={() => handlePlayPause(true)}
                  onPause={() => handlePlayPause(false)}
                  progressInterval={1000}
                  config={{
                    youtube: {
                      playerVars: {
                        origin: window.location.origin,
                        enablejsapi: 1,
                        modestbranding: 1,
                        rel: 0,
                        start: Math.floor(currentTime),
                      },
                    },
                  }}
                />
              </div>
            </div>

            {similarTrailers.length > 0 && (
              <div className="recommendationsSection">
                <h3>
                  <FaRobot /> AI Recommended Trailers
                </h3>
                <div className="trailerGrid">
                  {similarTrailers.map((trailer) => (
                    <div
                      key={trailer.key}
                      className="trailerItem"
                      onClick={() => handleTrailerClick(trailer)}
                    >
                      <div className="thumbnail">
                        <img
                          src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                          alt={trailer.name}
                        />
                        <FaPlay className="playIcon" />
                      </div>
                      <span className="title">{trailer.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default WatchParty;
