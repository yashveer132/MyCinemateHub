import React from "react";
import ReactPlayer from "react-player/youtube";
import { useSelector } from "react-redux";
import "./style.scss";

const VideoPopup = ({ show, setShow, videoId, setVideoId, movieData }) => {
  const { url } = useSelector((state) => state.home);

  const hidePopup = () => {
    setShow(false);
    setVideoId(null);
  };

  const backdropUrl = movieData?.backdrop_path
    ? url.backdrop + movieData.backdrop_path
    : movieData?.poster_path
      ? url.poster + movieData.poster_path
      : "";

  return (
    <div className={`videoPopup ${show ? "visible" : ""}`}>
      <div className="opacityLayer" onClick={hidePopup}></div>
      <div className="videoContainer">
        <div className="videoPlayer">
          <span className="closeBtn" onClick={hidePopup}>
            Close
          </span>
          {videoId ? (
            <div className="ambilightWrapper">
              {backdropUrl && (
                <div
                  className="ambilightGlow"
                  style={{ backgroundImage: `url(${backdropUrl})` }}
                />
              )}
              <div className="videoPlayerContainer">
                <ReactPlayer
                  url={`https://www.youtube.com/watch?v=${videoId}`}
                  controls
                  width="100%"
                  height="100%"
                  playing={true}
                />
              </div>
            </div>
          ) : (
            <div className="noVideo">
              <div className="noVideoIcon">🎥</div>
              <div className="noVideoText">No video available</div>
              <div className="noVideoSubtext">
                This trailer or video is not available at the moment
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPopup;
