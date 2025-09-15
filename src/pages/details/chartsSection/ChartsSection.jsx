import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ContentWrapper from "../../../components/contentWrapper/ContentWrapper";
import "./style.scss";

const ChartsSection = ({ data, mediaType }) => {
  if (!data) return null;

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

  const genresData = [];
  if (data.genres) {
    data.genres.forEach((genre) => {
      genresData.push({
        name: genre.name,
        value: 1,
      });
    });
  }

  return (
    <div className="chartsSection">
      <ContentWrapper>
        <div className="sectionHeading">Analytics & Insights</div>

        <div className="chartsGrid">
          {genresData.length > 0 && (
            <div className="chartCard">
              <h3>Genres Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={genresData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genresData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.vote_average > 0 && (
            <div className="chartCard">
              <h3>Rating Overview</h3>
              <div className="ratingStats">
                <div className="ratingCircle">
                  <div className="ratingValue">
                    {data.vote_average.toFixed(1)}
                  </div>
                  <div className="ratingLabel">Average Rating</div>
                </div>
                <div className="ratingDetails">
                  <div className="stat">
                    <span className="statLabel">Total Votes:</span>
                    <span className="statValue">
                      {data.vote_count?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="statLabel">Popularity:</span>
                    <span className="statValue">
                      {data.popularity?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default ChartsSection;
