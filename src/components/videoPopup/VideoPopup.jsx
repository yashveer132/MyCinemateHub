import React, { useState } from "react";
import ReactPlayer from "react-player/youtube";
import { FaUsers } from "react-icons/fa";
import WatchParty from "../watchParty/WatchParty";
import "./style.scss";

const VideoPopup = ({ show, setShow, videoId, setVideoId, movieData }) => {
  const [isWatchParty, setIsWatchParty] = useState(false);

  const hidePopup = () => {
    setShow(false);
    setVideoId(null);
    setIsWatchParty(false);
  };

  return (
    <div className={`videoPopup ${show ? "visible" : ""}`}>
      <div className="opacityLayer" onClick={hidePopup}></div>
      <div className="videoPlayer">
        {isWatchParty ? (
          <WatchParty
            videoId={videoId}
            movieData={movieData}
            onClose={() => setIsWatchParty(false)}
          />
        ) : (
          <>
            <span className="closeBtn" onClick={hidePopup}>
              Close
            </span>
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${videoId}`}
              controls
              width="100%"
              height="100%"
              playing={true}
            />
            <button
              className="watchPartyBtn"
              onClick={() => setIsWatchParty(true)}
            >
              <FaUsers /> Start Watch Party
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPopup;
