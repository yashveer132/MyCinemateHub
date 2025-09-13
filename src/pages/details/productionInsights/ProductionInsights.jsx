import React from "react";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const ProductionInsights = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="productionInsights">
        <ContentWrapper>
          <div className="sectionHeading">Production Insights</div>
          <div className="insightsSkeleton">
            <div className="skeletonItem"></div>
            <div className="skeletonItem"></div>
            <div className="skeletonItem"></div>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="productionInsights">
        <ContentWrapper>
          <div className="sectionHeading">Production Insights</div>
          <div className="insightsEmpty">
            <div className="noInsights">
              <div className="noInsightsIcon">💰</div>
              <div className="noInsightsText">
                No production information available
              </div>
              <div className="noInsightsSubtext">
                Production details for this {data?.media_type || "title"} are
                not available
              </div>
            </div>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "N/A";

    const usdToInrRate = 88;
    const amountInInr = amount * usdToInrRate;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInInr);
  };

  const calculateROI = (budget, revenue) => {
    if (!budget || !revenue || budget === 0) return null;
    const roi = ((revenue - budget) / budget) * 100;
    return roi.toFixed(1);
  };

  const budget = data.budget;
  const revenue = data.revenue;
  const roi = calculateROI(budget, revenue);

  const productionCompanies = data.production_companies || [];
  const productionCountries = data.production_countries || [];

  return (
    <div className="productionInsights">
      <ContentWrapper>
        <div className="sectionHeading">Production Insights</div>

        <div className="insightsGrid">
          <div className="insightCard budgetCard">
            <div className="cardHeader">
              <span className="cardIcon">💰</span>
              <h3>Budget</h3>
            </div>
            <div className="cardValue">{formatCurrency(budget)}</div>
            {budget > 0 && <div className="cardSubtext">Production Cost</div>}
          </div>

          <div className="insightCard revenueCard">
            <div className="cardHeader">
              <span className="cardIcon">📈</span>
              <h3>Revenue</h3>
            </div>
            <div className="cardValue">{formatCurrency(revenue)}</div>
            {revenue > 0 && (
              <div className="cardSubtext">Worldwide Box Office</div>
            )}
          </div>

          {roi !== null && (
            <div className="insightCard roiCard">
              <div className="cardHeader">
                <span className="cardIcon">📊</span>
                <h3>ROI</h3>
              </div>
              <div
                className={`cardValue ${roi >= 0 ? "positive" : "negative"}`}
              >
                {roi}%
              </div>
              <div className="cardSubtext">Return on Investment</div>
            </div>
          )}

          {productionCompanies.length > 0 && (
            <div className="insightCard companiesCard">
              <div className="cardHeader">
                <span className="cardIcon">🏢</span>
                <h3>Production</h3>
              </div>
              <div className="companiesList">
                {productionCompanies.slice(0, 3).map((company) => (
                  <div key={company.id} className="companyItem">
                    <span className="companyName">{company.name}</span>
                    {company.origin_country && (
                      <span className="companyCountry">
                        ({company.origin_country})
                      </span>
                    )}
                  </div>
                ))}
                {productionCompanies.length > 3 && (
                  <div className="moreCompanies">
                    +{productionCompanies.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {productionCountries.length > 0 && (
            <div className="insightCard countriesCard">
              <div className="cardHeader">
                <span className="cardIcon">🌍</span>
                <h3>Countries</h3>
              </div>
              <div className="countriesList">
                {productionCountries.map((country) => (
                  <div key={country.iso_3166_1} className="countryItem">
                    <img
                      src={`https://flagcdn.com/w20/${country.iso_3166_1?.toLowerCase()}.png`}
                      alt={country.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="countryName">{country.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="insightCard infoCard">
            <div className="cardHeader">
              <span className="cardIcon">ℹ️</span>
              <h3>Details</h3>
            </div>
            <div className="infoList">
              {data.runtime && (
                <div className="infoItem">
                  <span className="infoLabel">Runtime:</span>
                  <span className="infoValue">{data.runtime} minutes</span>
                </div>
              )}
              {data.status && (
                <div className="infoItem">
                  <span className="infoLabel">Status:</span>
                  <span className="infoValue">{data.status}</span>
                </div>
              )}
              {data.original_language && (
                <div className="infoItem">
                  <span className="infoLabel">Language:</span>
                  <span className="infoValue">
                    {data.original_language.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default ProductionInsights;
