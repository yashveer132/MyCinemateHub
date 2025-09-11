import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./style.scss";

import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import Img from "../../../components/lazyLoadImage/Img";
import avatar from "../../../assets/avatar.png";

const Cast = ({ data, loading }) => {
  const { url } = useSelector((state) => state.home);
  const navigate = useNavigate();

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
        <div className="sectionHeading">Top Cast</div>
        {!loading ? (
          data?.length > 0 ? (
            <div className="listItems">
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
