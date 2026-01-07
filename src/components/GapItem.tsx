import React from 'react';
import dayjs from 'dayjs';
// @ts-ignore
import { HolidayUtil } from 'lunar-javascript';

interface GapItemProps {
  prevEndDate: Date;
  currentStartDate: Date;
}

export const GapItem: React.FC<GapItemProps> = ({ prevEndDate, currentStartDate }) => {
  const start = dayjs(prevEndDate).add(1, 'day').startOf('day');
  const end = dayjs(currentStartDate).subtract(1, 'day').startOf('day');
  
  const gapDays = end.diff(start.subtract(1, 'day'), 'day');
  
  if (gapDays <= 0) return null;

  const holidays = new Set<string>();
  let current = start;
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const holiday = HolidayUtil.getHoliday(current.format('YYYY-MM-DD'));
    if (holiday && !holiday.isWork()) {
      holidays.add(holiday.getName());
    }
    current = current.add(1, 'day');
  }

  const holidayText = Array.from(holidays).join('&');

  return (
    <li className="permit-gap">
      <span className="gap-line"></span>
      <span className="gap-text">
        间隔 {gapDays} 天 {holidayText && <span className="holiday-names">{holidayText}</span>}
      </span>
      <span className="gap-line"></span>
    </li>
  );
};
