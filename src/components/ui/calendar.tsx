import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
  type?: 'snapshot' | 'warlog' | 'kvk' | 'milestone';
}

export interface CalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  events?: CalendarEvent[];
  className?: string;
}

export function Calendar({
  selectedDate = new Date(),
  onSelectDate,
  events = [],
  className = ''
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDateKey = (d: number, m: number, y: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (d: number) => {
    return (
      selectedDate &&
      d === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  // Build grid days
  const gridCells = [];

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateKey: formatDateKey(prevMonthDays - i, month - 1, year)
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    gridCells.push({
      day: d,
      isCurrentMonth: true,
      dateKey: formatDateKey(d, month, year)
    });
  }

  // Next month padding to fill 35 or 42 cells
  const remainingCells = (42 - gridCells.length) % 7 === 0 ? 42 - gridCells.length : 35 - gridCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    gridCells.push({
      day: d,
      isCurrentMonth: false,
      dateKey: formatDateKey(d, month + 1, year)
    });
  }

  return (
    <div className={`p-4 rounded-xl bg-gothic-ink/90 border border-gothic-silver/20 shadow-xl max-w-sm ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gothic-silver/20">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-gothic-silver" />
          <h4 className="font-mono text-xs font-bold text-gothic-silver uppercase tracking-wider">
            {monthNames[month]} {year}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg text-gothic-rose/70 hover:text-gothic-silver hover:bg-gothic-silver/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg text-gothic-rose/70 hover:text-gothic-silver hover:bg-gothic-silver/10 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-mono font-bold text-gothic-rose/50 uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {gridCells.map((cell, idx) => {
          const dayEvents = events.filter((e) => e.date === cell.dateKey);
          const hasEvent = dayEvents.length > 0;
          const today = cell.isCurrentMonth && isToday(cell.day);
          const selected = cell.isCurrentMonth && isSelected(cell.day);

          return (
            <button
              key={idx}
              type="button"
              disabled={!cell.isCurrentMonth}
              onClick={() => {
                if (cell.isCurrentMonth && onSelectDate) {
                  onSelectDate(new Date(year, month, cell.day));
                }
              }}
              className={`relative h-9 rounded-lg flex flex-col items-center justify-center text-xs font-mono transition-all ${
                !cell.isCurrentMonth
                  ? 'text-gothic-rose/20 cursor-default'
                  : selected
                  ? 'bg-gothic-silver text-gothic-void font-bold shadow-md'
                  : today
                  ? 'border border-gothic-silver text-gothic-silver font-bold'
                  : 'text-gothic-silver/80 hover:bg-gothic-silver/10'
              }`}
            >
              <span>{cell.day}</span>
              {hasEvent && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.map((ev, eIdx) => (
                    <span
                      key={eIdx}
                      title={ev.title}
                      className={`w-1 h-1 rounded-full ${
                        ev.type === 'warlog'
                          ? 'bg-red-400'
                          : ev.type === 'snapshot'
                          ? 'bg-emerald-400'
                          : 'bg-[#89A6B8]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  className?: string;
}

export function DatePicker({ value = new Date(), onChange, label = 'Select Date', className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formattedDate = value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gothic-ink border border-gothic-silver/20 text-xs font-mono font-bold text-gothic-silver hover:border-gothic-silver/40 transition-colors"
      >
        <CalendarIcon size={14} className="text-[#89A6B8]" />
        <span>{formattedDate}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0">
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <Calendar
            selectedDate={value}
            onSelectDate={(d) => {
              onChange?.(d);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
