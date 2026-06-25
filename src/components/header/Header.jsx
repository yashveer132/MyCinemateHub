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
  const [showTopRatedDropdown, setShowTopRatedDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "movie" && location.pathname === "/explore/movie") return true;
    if (path === "tv" && location.pathname === "/explore/tv") return true;
    if (
      path === "top-rated" &&
      (location.pathname === "/top-movies" ||
        location.pathname === "/top-shows")
    )
      return true;
    if (
      path === "searchPeople" &&
      (location.pathname === "/searchPeople" ||
        location.pathname.startsWith("/searchPeople/"))
    )
      return true;
    if (path === "ai-playlists" && location.pathname === "/ai-playlists")
      return true;
    if (path === "profile" && location.pathname === "/profile") return true;
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
          </div>
        </div>

        <ul className="menuItems">
          <li
            className={`menuItem ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => {
              navigate("/");
              setMobileMenu(false);
            }}
          >
            Home
          </li>
          <li
            className={`menuItem ${isActive("movie") ? "active" : ""}`}
            onClick={() => navigationHandler("movie")}
          >
            Movies
          </li>
          <li
            className={`menuItem ${isActive("tv") ? "active" : ""}`}
            onClick={() => navigationHandler("tv")}
          >
            TV Shows
          </li>
          <li
            className={`menuItem dropdown ${
              isActive("top-rated") ? "active" : ""
            }`}
            onMouseEnter={() => !mobileMenu && setShowTopRatedDropdown(true)}
            onMouseLeave={() => !mobileMenu && setShowTopRatedDropdown(false)}
            onClick={() =>
              mobileMenu && setShowTopRatedDropdown(!showTopRatedDropdown)
            }
          >
            <div className="dropdownTrigger">
              Top Rated
              {mobileMenu && (
                <span
                  className={`dropdown-arrow ${showTopRatedDropdown ? "open" : ""}`}
                >
                  ▼
                </span>
              )}
            </div>
            <ul
              className={`dropdown-menu ${showTopRatedDropdown ? "show" : ""}`}
            >
              <li
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/top-movies");
                  setShowTopRatedDropdown(false);
                  setMobileMenu(false);
                }}
              >
                Movies
              </li>
              <li
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/top-shows");
                  setShowTopRatedDropdown(false);
                  setMobileMenu(false);
                }}
              >
                TV Shows
              </li>
            </ul>
          </li>
          <li
            className={`menuItem ${isActive("searchPeople") ? "active" : ""}`}
            onClick={() => {
              navigate("/searchPeople");
              setMobileMenu(false);
            }}
          >
            People
          </li>
          <li
            className={`menuItem ${isActive("ai-playlists") ? "active" : ""}`}
            onClick={() => {
              navigate("/ai-playlists");
              setMobileMenu(false);
            }}
          >
            Smart Playlists
          </li>
          <li
            className={`menuItem ${isActive("profile") ? "active" : ""}`}
            onClick={() => {
              navigate("/profile");
              setMobileMenu(false);
            }}
          >
            My Profile
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
