import React from "react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="pageNotFound">
      <div className="contentWrapper">
        <div className="errorCard">
          <div className="errorIcon">🎥</div>
          <h1 className="errorTitle">404</h1>
          <h2 className="errorSubtitle">Page Not Found</h2>
          <p className="errorMessage">
            Oops! The movie or page you're looking for seems to have gone
            missing from our database. It might have been moved, deleted, or
            perhaps it never existed in the first place.
          </p>
          <button className="homeButton" onClick={() => navigate("/")}>
            Go Back Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
