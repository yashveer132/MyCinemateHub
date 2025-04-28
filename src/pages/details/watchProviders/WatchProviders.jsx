import React from "react";
import "./style.scss";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import {
  FaPlay,
  FaShoppingCart,
  FaDollarSign,
  FaInfoCircle,
} from "react-icons/fa";
import Img from "../../../components/lazyLoadImage/Img";

const WatchProviders = ({ data }) => {
  const hasProviders =
    data?.flatrate?.length > 0 ||
    data?.rent?.length > 0 ||
    data?.buy?.length > 0;

  if (!hasProviders) {
    return (
      <div className="watchProviders">
        <ContentWrapper>
          <div className="noProviders">
            <FaInfoCircle />
            <span>
              Watch providers are not available for this title in your region
            </span>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="watchProviders">
      <ContentWrapper>
        <div className="watchOptions">
          {data?.flatrate && (
            <div className="option">
              <div className="optionHeader">
                <FaPlay />
                <span>Stream</span>
              </div>
              <div className="providers">
                {data.flatrate.map((provider) => (
                  <div key={provider.provider_id} className="provider">
                    <Img
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                    />
                    <span>{provider.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.rent && (
            <div className="option">
              <div className="optionHeader">
                <FaDollarSign />
                <span>Rent</span>
              </div>
              <div className="providers">
                {data.rent.map((provider) => (
                  <div key={provider.provider_id} className="provider">
                    <Img
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                    />
                    <span>{provider.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.buy && (
            <div className="option">
              <div className="optionHeader">
                <FaShoppingCart />
                <span>Buy</span>
              </div>
              <div className="providers">
                {data.buy.map((provider) => (
                  <div key={provider.provider_id} className="provider">
                    <Img
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                    />
                    <span>{provider.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default WatchProviders;
