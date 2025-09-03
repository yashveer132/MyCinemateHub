import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import useFetch from "../../hooks/useFetch";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import Img from "../../components/lazyLoadImage/Img";
import avatar from "../../assets/avatar.png";
import "./style.scss";

const Person = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(`/person/${id}`);
  const { data: credits, loading: creditsLoading } = useFetch(
    `/person/${id}/combined_credits`
  );
  const { data: images } = useFetch(`/person/${id}/images`);
  const { data: externalIds } = useFetch(`/person/${id}/external_ids`);

  const { url } = useSelector((state) => state.home);

  const skeleton = () => {
    return (
      <div className="skItem">
        <div className="circle skeleton"></div>
        <div className="row skeleton"></div>
        <div className="row2 skeleton"></div>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = Math.floor((end - birth) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const sortCredits = (credits) => {
    if (!credits) return [];
    return credits.sort((a, b) => {
      const dateA = new Date(
        a.release_date || a.first_air_date || "1900-01-01"
      );
      const dateB = new Date(
        b.release_date || b.first_air_date || "1900-01-01"
      );
      return dateB - dateA;
    });
  };

  const handleCreditClick = (credit) => {
    const mediaType = credit.media_type || (credit.title ? "movie" : "tv");
    navigate(`/${mediaType}/${credit.id}`);
  };

  return (
    <div className="personPage">
      {!loading ? (
        <>
          {data && (
            <div className="personBanner">
              <ContentWrapper>
                <div className="content">
                  <div className="left">
                    {data.profile_path ? (
                      <Img
                        className="profileImg"
                        src={url.profile + data.profile_path}
                      />
                    ) : (
                      <Img className="profileImg" src={avatar} />
                    )}
                  </div>
                  <div className="right">
                    <div className="name">{data.name}</div>
                    {data.birthday && (
                      <div className="info">
                        <span className="bold">Born: </span>
                        <span>
                          {formatDate(data.birthday)}
                          {data.place_of_birth && ` in ${data.place_of_birth}`}
                          {(() => {
                            const age = getAge(data.birthday, data.deathday);
                            return age ? ` (Age ${age})` : "";
                          })()}
                        </span>
                      </div>
                    )}
                    {data.deathday && (
                      <div className="info">
                        <span className="bold">Died: </span>
                        <span>{formatDate(data.deathday)}</span>
                      </div>
                    )}
                    {data.known_for_department && (
                      <div className="info">
                        <span className="bold">Known for: </span>
                        <span>{data.known_for_department}</span>
                      </div>
                    )}
                    {data.also_known_as && data.also_known_as.length > 0 && (
                      <div className="info">
                        <span className="bold">Also known as: </span>
                        <span>{data.also_known_as.join(", ")}</span>
                      </div>
                    )}
                    {externalIds && (
                      <div className="socialLinks">
                        {externalIds.imdb_id && (
                          <a
                            href={`https://www.imdb.com/name/${externalIds.imdb_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            IMDb
                          </a>
                        )}
                        {externalIds.twitter_id && (
                          <a
                            href={`https://twitter.com/${externalIds.twitter_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Twitter
                          </a>
                        )}
                        {externalIds.instagram_id && (
                          <a
                            href={`https://instagram.com/${externalIds.instagram_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Instagram
                          </a>
                        )}
                        {externalIds.facebook_id && (
                          <a
                            href={`https://facebook.com/${externalIds.facebook_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="socialLink"
                          >
                            Facebook
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {data.biography && (
                  <div className="biography">
                    <div className="heading">Biography</div>
                    <div className="description">{data.biography}</div>
                  </div>
                )}
              </ContentWrapper>
            </div>
          )}

          {/* Filmography Section */}
          {credits && (
            <div className="filmography">
              <ContentWrapper>
                <div className="sectionHeading">Filmography</div>
                {!creditsLoading ? (
                  <div className="credits">
                    {sortCredits(credits.cast || [])
                      ?.slice(0, 20)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="creditItem"
                          onClick={() => handleCreditClick(item)}
                        >
                          <div className="posterImg">
                            <Img
                              src={
                                item.poster_path
                                  ? url.poster + item.poster_path
                                  : item.backdrop_path
                                  ? url.backdrop + item.backdrop_path
                                  : avatar
                              }
                            />
                          </div>
                          <div className="details">
                            <div className="title">
                              {item.title || item.name}
                            </div>
                            <div className="character">
                              {item.character && `as ${item.character}`}
                            </div>
                            <div className="year">
                              {item.release_date || item.first_air_date
                                ? new Date(
                                    item.release_date || item.first_air_date
                                  ).getFullYear()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="creditsSkeleton">
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
          )}

          {/* Images Section */}
          {images && images.profiles && images.profiles.length > 0 && (
            <div className="imagesSection">
              <ContentWrapper>
                <div className="sectionHeading">Photos</div>
                <div className="images">
                  {images.profiles.slice(0, 10).map((image, index) => (
                    <div key={index} className="imageItem">
                      <Img
                        src={url.profile + image.file_path}
                        alt={`${data?.name} photo ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </ContentWrapper>
            </div>
          )}
        </>
      ) : (
        <div className="personSkeleton">
          <ContentWrapper>
            <div className="left skeleton"></div>
            <div className="right">
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
              <div className="row skeleton"></div>
            </div>
          </ContentWrapper>
        </div>
      )}
    </div>
  );
};

export default Person;
