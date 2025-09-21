import React, { useRef } from "react";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import ContentWrapper from "../contentWrapper/ContentWrapper";
import MovieCard from "../movieCard/MovieCard";

import "./style.scss";

const Carousel = ({ data, loading, endpoint, title, showWatchedDate }) => {
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

  const skItem = () => {
    return (
      <div className="skeletonItem">
        <div className="posterBlock skeleton"></div>
        <div className="textBlock">
          <div className="title skeleton"></div>
          <div className="date skeleton"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="carousel">
      <ContentWrapper>
        {title && <div className="carouselTitle">{title}</div>}
        {data?.length > 0 && (
          <>
            <BsFillArrowLeftCircleFill
              className="carouselLeftNav arrow"
              onClick={() => navigation("left")}
            />
            <BsFillArrowRightCircleFill
              className="carouselRighttNav arrow"
              onClick={() => navigation("right")}
            />
          </>
        )}
        {!loading ? (
          data?.length > 0 ? (
            <div className="carouselItems" ref={carouselContainer}>
              {data.map((item) => {
                return (
                  <MovieCard
                    key={item.id}
                    data={item}
                    mediaType={item.media_type || endpoint}
                    showWatchedDate={showWatchedDate}
                  />
                );
              })}
            </div>
          ) : (
            <div className="carouselItemsEmpty">
              <div className="noItems">
                <div className="noItemsIcon">🎬</div>
                <div className="noItemsText">
                  No {title?.toLowerCase() || "items"} available
                </div>
                <div className="noItemsSubtext">
                  Check back later for updates
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="loadingSkeleton">
            {skItem()}
            {skItem()}
            {skItem()}
            {skItem()}
            {skItem()}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Carousel;
