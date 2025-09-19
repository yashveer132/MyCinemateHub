import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaHeart,
  FaBookmark,
  FaCheck,
  FaUser,
  FaArrowRight,
} from "react-icons/fa";

import "./style.scss";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Carousel from "../../components/carousel/Carousel";

const Profile = () => {
  const userState = useSelector((state) => state.user);
  const { favorites = [], watchLater = [], watched = [] } = userState || {};
  const navigate = useNavigate();

  const favoritesRef = useRef(null);
  const watchLaterRef = useRef(null);
  const watchedRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      const offsetTop = ref.current.offsetTop - 100; // 100px offset for header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  const EmptyState = ({ icon, title, description, sectionType }) => {
    return (
      <div className="emptyState">
        <div className="emptyIcon">{icon}</div>
        <h3 className="emptyTitle">{title}</h3>
        <p className="emptyDescription">{description}</p>
        <div className="emptyActions">
          <button
            className="emptyAction"
            onClick={() => navigate("/explore/movie")}
          >
            Browse Movies
            <FaArrowRight />
          </button>
          <button
            className="emptyAction"
            onClick={() => navigate("/explore/tv")}
          >
            Explore TV Shows
            <FaArrowRight />
          </button>
        </div>
      </div>
    );
  };

  const ProfileSection = ({ title, data, icon, emptyStateConfig }) => {
    return (
      <div className="carouselSection">
        <ContentWrapper>
          <div className="sectionHeader">
            <div className="sectionTitleWrapper">
              <div className="sectionIcon">{icon}</div>
              <span className="carouselTitle">{title}</span>
              <span className="sectionCount">({data.length})</span>
            </div>
          </div>

          {data.length > 0 ? (
            <Carousel data={data} loading={false} />
          ) : (
            <EmptyState {...emptyStateConfig} />
          )}
        </ContentWrapper>
      </div>
    );
  };

  return (
    <div className="profilePage">
      <ContentWrapper>
        <div className="profileHeader">
          <div className="profileInfo">
            <div className="profileAvatar">
              <FaUser />
            </div>
            <div className="profileDetails">
              <h1 className="profileTitle">My Profile</h1>
              <p className="profileSubtitle">Manage your movies and TV shows</p>
            </div>
          </div>

          <div className="profileStats">
            <div
              className="statItem"
              onClick={() => scrollToSection(favoritesRef)}
            >
              <span className="statNumber">{favorites.length}</span>
              <span className="statLabel">Favorites</span>
            </div>
            <div
              className="statItem"
              onClick={() => scrollToSection(watchLaterRef)}
            >
              <span className="statNumber">{watchLater.length}</span>
              <span className="statLabel">Watch Later</span>
            </div>
            <div
              className="statItem"
              onClick={() => scrollToSection(watchedRef)}
            >
              <span className="statNumber">{watched.length}</span>
              <span className="statLabel">Watched</span>
            </div>
          </div>
        </div>
      </ContentWrapper>

      <div ref={favoritesRef}>
        <ProfileSection
          title="My Favorites"
          data={favorites}
          icon={<FaHeart />}
          emptyStateConfig={{
            icon: <FaHeart />,
            title: "No Favorites Yet",
            description:
              "Start building your collection by adding movies and TV shows to your favorites. Click the heart icon on any movie card to get started!",
          }}
        />
      </div>

      <div ref={watchLaterRef}>
        <ProfileSection
          title="Watch Later"
          data={watchLater}
          icon={<FaBookmark />}
          emptyStateConfig={{
            icon: <FaBookmark />,
            title: "Watch Later List is Empty",
            description:
              "Save movies and TV shows you want to watch later. Never forget about that interesting title you discovered!",
          }}
        />
      </div>

      <div ref={watchedRef}>
        <ProfileSection
          title="Watched"
          data={watched}
          icon={<FaCheck />}
          emptyStateConfig={{
            icon: <FaCheck />,
            title: "No Watched Items",
            description:
              "Keep track of what you've watched by marking items as complete. Build your viewing history and discover patterns in your taste!",
          }}
        />
      </div>
    </div>
  );
};

export default Profile;
