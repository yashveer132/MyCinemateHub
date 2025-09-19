import React, { useState, useEffect, useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../../components/switchTabs/SwitchTabs";
import { fetchDataFromApi } from "../../../utils/api";
import VideoPopup from "../../../components/videoPopup/VideoPopup";
import Img from "../../../components/lazyLoadImage/Img";
import { PlayIcon } from "../../details/Playbtn";
import "./style.scss";

const LatestVideos = () => {
  const [endpoint, setEndpoint] = useState("movie");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const carouselContainer = useRef();

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

  const fetchLatestVideos = async () => {
    setLoading(true);
    try {
      const contentUrl =
        endpoint === "movie" ? "/movie/now_playing" : "/tv/on_the_air";
      const contentData = await fetchDataFromApi(contentUrl);

      if (contentData?.results) {
        const videoPromises = contentData.results
          .slice(0, 20)
          .map(async (item) => {
            const videoUrl = `/${endpoint}/${item.id}/videos`;
            const videoData = await fetchDataFromApi(videoUrl);

            const trailers =
              videoData?.results?.filter(
                (video) =>
                  video.type === "Trailer" ||
                  video.type === "Teaser" ||
                  video.type === "Clip"
              ) || [];

            let bestVideo = null;
            if (trailers.length > 0) {
              bestVideo =
                trailers.find((v) =>
                  v.name.toLowerCase().includes("official trailer")
                ) ||
                trailers.find((v) => v.type === "Trailer") ||
                trailers.find((v) => v.type === "Teaser") ||
                trailers.find((v) => v.type === "Clip") ||
                trailers[0];
            }

            if (bestVideo) {
              return {
                ...bestVideo,
                movieTitle: item.title || item.name,
                movieId: item.id,
                backdrop: item.backdrop_path,
              };
            }
            return null;
          });

        const allVideos = await Promise.all(videoPromises);
        const validVideos = allVideos
          .filter((video) => video !== null)
          .slice(0, 20);
        setVideos(validVideos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLatestVideos();
  }, [endpoint]);

  const onTabChange = (tab) => {
    setEndpoint(tab === "Movies" ? "movie" : "tv");
  };

  const skItem = () => {
    return (
      <div className="skeletonItem">
        <div className="videoBlock skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="subtitle skeleton"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="carouselSection latestVideosSection">
      <ContentWrapper>
        <span className="carouselTitle">Latest Trailers</span>
        <SwitchTabs data={["Movies", "TV Shows"]} onTabChange={onTabChange} />
      </ContentWrapper>

      {!loading ? (
        videos?.length > 0 ? (
          <div className="carousel">
            <ContentWrapper>
              <BsFillArrowLeftCircleFill
                className="carouselLeftNav arrow"
                onClick={() => navigation("left")}
              />
              <BsFillArrowRightCircleFill
                className="carouselRighttNav arrow"
                onClick={() => navigation("right")}
              />
              <div className="carouselItems" ref={carouselContainer}>
                {videos.map((video, index) => (
                  <div
                    key={`${video.key}-${index}`}
                    className="carouselItem"
                    onClick={() => {
                      setVideoId(video.key);
                      setShow(true);
                    }}
                  >
                    <div className="videoBlock">
                      <Img
                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                      />
                      <PlayIcon />
                    </div>
                    <div className="textBlock">
                      <span className="title">{video.name}</span>
                      <span className="subtitle">{video.movieTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ContentWrapper>
          </div>
        ) : (
          <div className="resultNotFound">
            <ContentWrapper>
              <div className="noVideos">
                <div className="noVideosIcon">🎥</div>
                <div className="noVideosText">No trailers available</div>
                <div className="noVideosSubtext">
                  Check back later for the latest trailers
                </div>
              </div>
            </ContentWrapper>
          </div>
        )
      ) : (
        <div className="carousel loadingSkeleton">
          <ContentWrapper>
            <div className="carouselItems">
              {skItem()}
              {skItem()}
              {skItem()}
              {skItem()}
              {skItem()}
              {skItem()}
            </div>
          </ContentWrapper>
        </div>
      )}

      <VideoPopup
        show={show}
        setShow={setShow}
        videoId={videoId}
        setVideoId={setVideoId}
      />
    </div>
  );
};

export default LatestVideos;
