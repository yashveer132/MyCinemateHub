import React, { useState, useRef, useLayoutEffect } from "react";

import "./style.scss";

const SwitchTabs = ({ data, onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef([]);
  const containerRef = useRef(null);

  const updateIndicator = (index) => {
    const el = tabsRef.current[index];
    if (el && containerRef.current) {
      const parentRect = containerRef.current.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicatorStyle({
        left: rect.left - parentRect.left,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator(selectedTab);
    const handleResize = () => updateIndicator(selectedTab);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedTab]);

  const activeTab = (tab, index) => {
    updateIndicator(index);
    setTimeout(() => {
      setSelectedTab(index);
    }, 300);
    onTabChange(tab, index);
  };

  return (
    <div className="switchingTabs" ref={containerRef}>
      <div className="tabItems">
        {data.map((tab, index) => (
          <span
            key={index}
            className={`tabItem ${selectedTab === index ? "active" : ""}`}
            onClick={() => activeTab(tab, index)}
            ref={(el) => (tabsRef.current[index] = el)}
          >
            {tab}
          </span>
        ))}
        <span
          className="movingBg"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>
    </div>
  );
};

export default SwitchTabs;
