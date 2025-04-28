import React, { useState } from "react";
import { useSelector } from "react-redux";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import Img from "../lazyLoadImage/Img";
import avatar from "../../assets/avatar.png";
import "./style.scss";

const Reviews = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const { url } = useSelector((state) => state.home);

  const displayReviews = expanded ? data?.results : data?.results?.slice(0, 2);

  return (
    <div className="reviews">
      <ContentWrapper>
        <div className="sectionHeading">
          Reviews ({data?.total_results || 0})
        </div>
        <div className="reviewsList">
          {displayReviews?.map((review) => (
            <div key={review.id} className="reviewItem">
              <div className="reviewHeader">
                <div className="avatar">
                  <Img
                    src={
                      review.author_details.avatar_path
                        ? url.profile + review.author_details.avatar_path
                        : avatar
                    }
                  />
                </div>
                <div className="info">
                  <div className="name">{review.author}</div>
                  {review.author_details.rating && (
                    <div className="rating">
                      Rating: {review.author_details.rating}/10
                    </div>
                  )}
                </div>
              </div>
              <div className="content">{review.content}</div>
            </div>
          ))}
        </div>
        {data?.results?.length > 2 && (
          <div className="showMore">
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show Less" : "Show More"}
            </button>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Reviews;
