import React from "react";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import "./style.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <ContentWrapper>
        <div className="infoText">
          Welcome to Cinemate - Your ultimate movie companion! Discover a vast
          collection of films and TV shows. Our smart search and recommendation
          system understands your preferences, making it easier than ever to
          find your next favorite watch.
        </div>
      </ContentWrapper>
    </footer>
  );
};

export default Footer;
