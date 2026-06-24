import React, { useState, useRef, useEffect } from "react";
import "./Tooltip.scss";

const Tooltip = ({ children, content, position = "top", className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();

          let top, left;

          switch (position) {
            case "top":
              top = -tooltipRect.height - 8;
              left = triggerRect.width / 2 - tooltipRect.width / 2;
              break;
            case "bottom":
              top = triggerRect.height + 8;
              left = triggerRect.width / 2 - tooltipRect.width / 2;
              break;
            case "left":
              top = triggerRect.height / 2 - tooltipRect.height / 2;
              left = -tooltipRect.width - 8;
              break;
            case "right":
              top = triggerRect.height / 2 - tooltipRect.height / 2;
              left = triggerRect.width + 8;
              break;
            default:
              top = -tooltipRect.height - 8;
              left = triggerRect.width / 2 - tooltipRect.width / 2;
          }

          setTooltipPosition({ top, left });
        }
      });
    }
  }, [isVisible, position]);

  return (
    <div className="tooltip-container">
      <div
        ref={triggerRef}
        className={`tooltip-trigger ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`tooltip-content ${position}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {content}
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
