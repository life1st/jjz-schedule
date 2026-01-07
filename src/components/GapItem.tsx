import React from 'react';
import dayjs from 'dayjs';
// @ts-ignore
import { HolidayUtil } from 'lunar-javascript';

interface GapItemProps {
  prevEndDate: Date;
  currentStartDate: Date;
  hasTemp?: boolean;
}

export const GapItem: React.FC<GapItemProps> = ({ prevEndDate, currentStartDate, hasTemp }) => {
  const start = dayjs(prevEndDate).add(1, 'day').startOf('day');
  const end = dayjs(currentStartDate).subtract(1, 'day').startOf('day');
  
  const gapDays = end.diff(start.subtract(1, 'day'), 'day');
  
  if (gapDays <= 0) return null;

  const labels = new Set<string>();

  // Add temp label if exists
  if (hasTemp) {
    labels.add('临牌');
  }

  // Add holidays
  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const holiday = HolidayUtil.getHoliday(current.format('YYYY-MM-DD'));
    if (holiday && !holiday.isWork()) {
      labels.add(holiday.getName());
    }
    current = current.add(1, 'day');
  }

  const labelText = Array.from(labels).join('&');

  return (
    <li className="permit-gap">
      <span className="gap-line"></span>
      <span className="gap-text">
        间隔 {gapDays} 天 {labelText && <span className="holiday-names">{labelText}</span>}
      </span>
      <span className="gap-line"></span>
    </li>
  );
};
