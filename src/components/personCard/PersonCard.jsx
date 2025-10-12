import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Img from "../lazyLoadImage/Img";
import { fetchDataFromApi } from "../../utils/api";
import avatar from "../../assets/avatar.png";
import "./personCard.scss";

const personCache = new Map();

const PersonCard = ({ person, onClick }) => {
  const [details, setDetails] = useState(() => {
    const cached = personCache.get(person.id);
    return cached?.details || null;
  });
  const [credits, setCredits] = useState(() => {
    const cached = personCache.get(person.id);
    return cached?.credits || null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !personCache.has(person.id);
  });

  useEffect(() => {
    let mounted = true;
    const id = person.id;

    if (personCache.has(id)) {
      return;
    }

    const load = async () => {
      try {
        const [d, c] = await Promise.all([
          fetchDataFromApi(`/person/${id}`),
          fetchDataFromApi(`/person/${id}/combined_credits`),
        ]);
        if (!mounted) return;
        setDetails(d);
        setCredits(c);
        setIsLoading(false);
        personCache.set(id, { details: d, credits: c });
      } catch (e) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [person.id]);

  const imgUrl = person.profile_path
    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
    : null;

  const knownFor = person.known_for || [];

  const topCredits = (credits?.cast || credits?.crew || [])
    .slice()
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 3);

  const bioSnippet = details?.biography
    ? details.biography.split("\n").join(" ").slice(0, 160) +
      (details.biography.length > 160 ? "..." : "")
    : null;

  return (
    <div
      className="personCardV2"
      onClick={() => onClick(person.id)}
      role="button"
      tabIndex={0}
    >
      <div className="thumb">
        <Img src={imgUrl || avatar} alt={person.name} />
        {isLoading && <div className="thumbSkeleton" aria-hidden="true" />}
      </div>
      <div className="meta">
        <div className="name">{person.name}</div>
        <div className={`primaryRole ${isLoading ? "skeletonLine" : ""}`}>
          {person.known_for_department ||
            (details && details.known_for_department) ||
            "Actor"}
        </div>
        {isLoading ? (
          <div className="bio skeletonLine" />
        ) : (
          bioSnippet && <div className="bio">{bioSnippet}</div>
        )}

        <div className="knownForList">
          {topCredits && topCredits.length > 0
            ? topCredits.map((c) => (
                <div
                  key={`${c.id}-${c.credit_id || c.character || c.job}`}
                  className="kfItem"
                >
                  <div className="kfTitle">{c.title || c.name}</div>
                  <div className="kfYear">
                    {(c.release_date || c.first_air_date || "").slice(0, 4)}
                  </div>
                  <div className="kfRole">{c.character || c.job || ""}</div>
                </div>
              ))
            : knownFor.length > 0
            ? knownFor.slice(0, 3).map((kf, idx) => (
                <div key={idx} className="kfItem">
                  <div className="kfTitle">{kf.title || kf.name}</div>
                  <div className="kfYear">
                    {(kf.release_date || kf.first_air_date || "").slice(0, 4)}
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
};

PersonCard.propTypes = {
  person: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

PersonCard.defaultProps = {
  onClick: () => {},
};

export default React.memo(PersonCard, (prevProps, nextProps) => {
  return prevProps.person.id === nextProps.person.id;
});
