import React from 'react';

interface CalendarLegendProps {
  isTempMode?: boolean;
  setIsTempMode?: (val: boolean) => void;
  showToggle?: boolean;
  className?: string;
}

export const CalendarLegend: React.FC<CalendarLegendProps> = ({
  isTempMode,
  setIsTempMode,
  showToggle = false,
  className = ''
}) => {
  return (
    <div className={`calendar-legend ${className}`}>
      <div className="legend-left">
        <div className="legend-item">
          <span className="legend-marker has-permit"></span>
          <span>进京证</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker has-temp-permit"></span>
          <span>临牌</span>
        </div>
      </div>
      
      {showToggle && setIsTempMode && (
        <div className="mode-toggle">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={isTempMode} 
              onChange={(e) => setIsTempMode(e.target.checked)} 
            />
            <span>临牌排期 (15天)</span>
          </label>
        </div>
      )}
    </div>
  );
};
