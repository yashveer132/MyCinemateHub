import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Img from "../lazyLoadImage/Img";
import "./style.scss";

const Collections = ({ data, loading }) => {
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();

  const handleClick = (collectionId) => {
    navigate(`/collection/${collectionId}`);
  };

  return (
    <div className="collections">
      <ContentWrapper>
        <div className="sectionHeading">Collections</div>
        <div className="collectionsList">
          {data?.map((item) => (
            <div
              key={item.id}
              className="collectionItem"
              onClick={() => handleClick(item.id)}
            >
              <div className="backdrop">
                <Img src={url.backdrop + item.backdrop_path} />
              </div>
              <div className="title">{item.name}</div>
              <div className="partCount">{item.parts?.length || 0} Movies</div>
            </div>
          ))}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Collections;
