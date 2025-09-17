import React, { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BsFillArrowLeftCircleFill,
  BsFillArrowRightCircleFill,
} from "react-icons/bs";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import avatar from "../../../assets/avatar.png";

const Cast = ({ data, loading }) => {
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();
  const carouselContainer = useRef();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    const container = carouselContainer.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = carouselContainer.current;
    if (container && data?.length > 6) {
      checkScrollButtons();
      container.addEventListener("scroll", checkScrollButtons);
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, [data]);

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

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="circle skeleton"></div>
        <div className="row skeleton"></div>
        <div className="row2 skeleton"></div>
      </div>
    );
  };

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  return (
    <div className="castSection">
      <ContentWrapper>
        <div className="sectionHeading">Cast</div>
        {!loading ? (
          data?.length > 0 ? (
            <>
              {data.length > 6 && (
                <>
                  <BsFillArrowLeftCircleFill
                    className={`carouselLeftNav arrow ${
                      !canScrollLeft ? "disabled" : ""
                    }`}
                    onClick={() => canScrollLeft && navigation("left")}
                  />
                  <BsFillArrowRightCircleFill
                    className={`carouselRighttNav arrow ${
                      !canScrollRight ? "disabled" : ""
                    }`}
                    onClick={() => canScrollRight && navigation("right")}
                  />
                </>
              )}
              <div className="listItems" ref={carouselContainer}>
                {data.map((item) => {
                  let imgUrl = item.profile_path
                    ? url.profile + item.profile_path
                    : avatar;
                  return (
                    <div
                      key={item.id}
                      className="listItem"
                      onClick={() => handlePersonClick(item.id)}
                    >
                      <div className="profileImg">
                        <Img src={imgUrl} />
                      </div>
                      <div className="name">{item.name}</div>
                      <div className="character">{item.character}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="listItemsEmpty">
              <div className="noCast">
                <div className="noCastIcon">🎭</div>
                <div className="noCastText">No cast information available</div>
                <div className="noCastSubtext">
                  Cast details will be updated when available
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="castSkeleton">
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
            {skeleton()}
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Cast;
