import React, { useState, useRef } from "react";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import SwitchTabs from "../../../components/switchTabs/SwitchTabs";
import useFetch from "../../../hooks/useFetch";
import AwardCard from "../../../components/awardCard/AwardCard";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";
import "./style.scss";

const AwardWinners = () => {
  const [endpoint, setEndpoint] = useState("movie");
  const carouselContainer = useRef();

  const { data, loading } = useFetch(
    `/${endpoint}/top_rated?vote_average.gte=8&vote_count.gte=1000`
  );

  const onTabChange = (tab) => {
    setEndpoint(tab === "Movies" ? "movie" : "tv");
  };

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
    <div className="carouselSection awardWinnersSection">
      <ContentWrapper>
        <span className="carouselTitle">Award Winners</span>
        <SwitchTabs data={["Movies", "TV Shows"]} onTabChange={onTabChange} />
      </ContentWrapper>
      <div className="carousel">
        <ContentWrapper>
          {data?.results?.length > 0 && (
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
            data?.results?.length > 0 ? (
              <div className="carouselItems" ref={carouselContainer}>
                {data.results.map((item) => {
                  return (
                    <AwardCard key={item.id} data={item} mediaType={endpoint} />
                  );
                })}
              </div>
            ) : (
              <div className="carouselItemsEmpty">
                <div className="noItems">
                  <div className="noItemsIcon">🏆</div>
                  <div className="noItemsText">No award winners available</div>
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
    </div>
  );
};

export default AwardWinners;
