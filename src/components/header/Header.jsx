import React, { useState, useEffect } from "react";
import { SlMenu } from "react-icons/sl";
import { VscChromeClose } from "react-icons/vsc";
import { useNavigate, useLocation } from "react-router-dom";

import "./style.scss";

import ContentWrapper from "../contentWrapper/ContentWrapper";
import logo from "../../assets/title.jpg";

const Header = () => {
  const [show, setShow] = useState("top");
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.includes(path)) return true;
    return false;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const controlNavbar = () => {
    if (window.scrollY > 200) {
      if (window.scrollY > lastScrollY && !mobileMenu) {
        setShow("hide");
      } else {
        setShow("show");
      }
    } else {
      setShow("top");
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  const navigationHandler = (type) => {
    if (type === "movie") {
      navigate("/explore/movie");
    } else if (type === "tv") {
      navigate("/explore/tv");
    } else {
      if (location.pathname === "/") {
        handleScroll(type);
      } else {
        navigate("/");
        setTimeout(() => handleScroll(type), 500);
      }
    }
    setMobileMenu(false);
  };

  const handleScroll = (type) => {
    const element = document.querySelector(`.${type}Section`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <header className={`header ${mobileMenu ? "mobileView" : ""} ${show}`}>
      <ContentWrapper>
        <div className="logoWrapper" onClick={() => navigate("/")}>
          <div className="logo">
            <img src={logo} alt="" />
          </div>
          <div className="headerTitle">
            <span className="brand">Cinemate</span>
            <div className="subtitle">
              <span className="ai">AI</span>
              <span className="platform">Movie Platform</span>
            </div>
          </div>
        </div>

        <ul className="menuItems">
          <li className={`menuItem ${location.pathname === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
            Home
          </li>
          <li className={`menuItem ${isActive("movie") ? "active" : ""}`} onClick={() => navigationHandler("movie")}>
            Movies
          </li>
          <li className={`menuItem ${isActive("tv") ? "active" : ""}`} onClick={() => navigationHandler("tv")}>
            TV Shows
          </li>
          <li className={`menuItem ${isActive("playlist") ? "active" : ""}`} onClick={() => navigate("/playlist")}>
            AI Playlists
          </li>
          <li className={`menuItem ${isActive("trending") ? "active" : ""}`} onClick={() => navigationHandler("trending")}>
            Trending
          </li>
          <li className={`menuItem ${isActive("popular") ? "active" : ""}`} onClick={() => navigationHandler("popular")}>
            Popular
          </li>
          <li className={`menuItem ${isActive("topRated") ? "active" : ""}`} onClick={() => navigationHandler("topRated")}>
            Top Rated
          </li>
        </ul>

        <div className="mobileMenuItems">
          {mobileMenu ? (
            <VscChromeClose onClick={() => setMobileMenu(false)} />
          ) : (
            <SlMenu onClick={() => setMobileMenu(true)} />
          )}
        </div>
      </ContentWrapper>
    </header>
  );
};

export default Header;
