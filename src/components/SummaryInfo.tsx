import React from 'react';

interface SummaryInfoProps {
  year?: number;
  regularCount: number;
  shiftCount: number;
  className?: string;
}

export const SummaryInfo: React.FC<SummaryInfoProps> = ({
  year,
  regularCount,
  shiftCount,
  className = ''
}) => {
  return (
    <div className={`summary-info ${className}`}>
      <p className="subtitle">
        {year ? `${year}年` : ''}已排期<strong> {regularCount}</strong> 次进京证
        {regularCount > 0 && (
          <span className="shift-text" style={{ opacity: 0.8 }}> (需平移 <strong>{shiftCount}</strong> 次)</span>
        )}
      </p>
    </div>
  );
};
