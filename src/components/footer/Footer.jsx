import React from "react";
import ContentWrapper from "../contentWrapper/ContentWrapper";
import "./style.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <ContentWrapper>
        <div className="infoText">
          Welcome to Cinemate - Your AI-powered movie companion! Discover a vast
          collection of films and TV shows enhanced by artificial intelligence.
          Our smart search and recommendation system uses advanced AI to
          understand your preferences and natural language queries, making it
          easier than ever to find your next favorite watch.
        </div>
      </ContentWrapper>
    </footer>
  );
};

export default Footer;
