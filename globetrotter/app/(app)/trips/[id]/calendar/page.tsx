'use client';

import { use, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin,
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import type { Activity, CityStop } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const STOP_COLORS = [
  { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-800', pill: 'bg-amber-500/20' },
  { bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-800', pill: 'bg-blue-500/15' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-800', pill: 'bg-emerald-500/15' },
  { bg: 'bg-violet-500/10', border: 'border-violet-500/25', text: 'text-violet-800', pill: 'bg-violet-500/15' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/25', text: 'text-rose-800', pill: 'bg-rose-500/15' },
];

interface DayInfo {
  stop: CityStop;
  stopIndex: number;
  activities: Activity[];
  isFirstDay: boolean;
  isLastDay: boolean;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDayMap(stops: CityStop[]): Record<string, DayInfo> {
  const dayMap: Record<string, DayInfo> = {};
  const sorted = [...stops].sort((a, b) => a.order - b.order);

  sorted.forEach((stop, stopIndex) => {
    const start = new Date(`${stop.startDate}T12:00:00`);
    const end = new Date(`${stop.endDate}T12:00:00`);
    let current = new Date(start);

    while (current <= end) {
      const dateKey = toDateKey(current);
      dayMap[dateKey] = {
        stop,
        stopIndex,
        activities: stop.activities,
        isFirstDay: dateKey === stop.startDate,
        isLastDay: dateKey === stop.endDate,
      };
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    }
  });

  return dayMap;
}

function getCalendarCells(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function MonthCalendar({
  year,
  month,
  dayMap,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number;
  dayMap: Record<string, DayInfo>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const todayKey = toDateKey(new Date());
  const cells = getCalendarCells(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-black/[0.04] transition-colors text-slate-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-lg font-bold">{monthLabel}</h2>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-black/[0.04] transition-colors text-slate-600"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-black/[0.05]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, dateKey, isCurrentMonth }) => {
          const dayInfo = dayMap[dateKey];
          const colors = dayInfo ? STOP_COLORS[dayInfo.stopIndex % STOP_COLORS.length] : null;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              key={dateKey}
              onClick={() => dayInfo && onSelectDate(dateKey)}
              disabled={!dayInfo}
              className={[
                'relative min-h-[88px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-black/[0.04] text-left transition-colors',
                'flex flex-col gap-1',
                !isCurrentMonth && 'bg-black/[0.015]',
                isCurrentMonth && !dayInfo && 'hover:bg-black/[0.02]',
                dayInfo && colors?.bg,
                dayInfo && 'cursor-pointer hover:brightness-[0.98]',
                !dayInfo && 'cursor-default',
                isSelected && 'ring-2 ring-inset ring-amber-500/60',
              ].filter(Boolean).join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0',
                  !isCurrentMonth && 'text-slate-300',
                  isCurrentMonth && !isToday && !dayInfo && 'text-slate-700',
                  isCurrentMonth && dayInfo && colors?.text,
                  isToday && 'bg-amber-500 text-white',
                ].filter(Boolean).join(' ')}
              >
                {date.getDate()}
              </span>

              {dayInfo && (
                <div className="flex-1 min-w-0 space-y-0.5 overflow-hidden">
                  <span
                    className={[
                      'block text-[10px] sm:text-xs font-bold truncate px-1 py-0.5 rounded',
                      colors?.pill,
                      colors?.text,
                      !isCurrentMonth && 'opacity-70',
                    ].filter(Boolean).join(' ')}
                  >
                    {dayInfo.isFirstDay && '▶ '}
                    {dayInfo.stop.city}
                    {dayInfo.isLastDay && !dayInfo.isFirstDay && ' ◀'}
                  </span>
                  {isCurrentMonth && dayInfo.activities.slice(0, 2).map((act) => (
                    <p
                      key={act.id}
                      className="text-[9px] sm:text-[10px] text-slate-600 truncate leading-tight px-0.5"
                    >
                      {act.time ? `${act.time} · ` : ''}{act.name}
                    </p>
                  ))}
                  {isCurrentMonth && dayInfo.activities.length > 2 && (
                    <p className="text-[9px] text-slate-400 px-0.5">
                      +{dayInfo.activities.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetailPanel({ dayInfo, dateKey }: { dayInfo: DayInfo; dateKey: string }) {
  const d = new Date(`${dateKey}T12:00:00`);
  const totalCost = dayInfo.activities.reduce((a, act) => a + act.cost, 0);
  const colors = STOP_COLORS[dayInfo.stopIndex % STOP_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">
            {d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            {dayInfo.stop.city}, {dayInfo.stop.country}
          </h3>
        </div>
        <span className={`badge ${colors.pill} ${colors.text} border-0`}>
          {dayInfo.activities.length} activities
        </span>
      </div>

      {dayInfo.activities.length === 0 ? (
        <p className="text-sm text-slate-500">No activities planned for this day.</p>
      ) : (
        <div className="space-y-2">
          {dayInfo.activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 glass-light rounded-xl"
            >
              {act.imageUrl && (
                <img src={act.imageUrl} alt={act.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{act.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {act.time && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{act.time}
                    </span>
                  )}
                  {act.durationHours != null && <span>{act.durationHours}h</span>}
                </div>
              </div>
              <span className="text-green-600 text-xs font-semibold flex-shrink-0">
                {act.cost === 0 ? 'Free' : `$${act.cost}`}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {totalCost > 0 && (
        <p className="text-xs text-slate-500 mt-3 text-right">
          Estimated day cost: <span className="font-semibold text-slate-700">${totalCost}</span>
        </p>
      )}
    </motion.div>
  );
}

export default function TripCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTripById } = useItineraryStore();
  const trip = getTripById(id);

  const dayMap = useMemo(
    () => (trip ? buildDayMap(trip.stops) : {}),
    [trip],
  );

  const tripDates = useMemo(() => Object.keys(dayMap).sort(), [dayMap]);

  const initialMonth = useMemo(() => {
    if (tripDates.length === 0) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    }
    const first = new Date(`${tripDates[0]}T12:00:00`);
    return { year: first.getFullYear(), month: first.getMonth() };
  }, [tripDates]);

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(tripDates[0] ?? null);

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="font-display text-2xl font-bold">Trip not found</h2>
      </div>
    );
  }

  const sortedStops = [...trip.stops].sort((a, b) => a.order - b.order);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedDayInfo = selectedDate ? dayMap[selectedDate] : null;

  return (
    <div className="page-wrapper p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/trips/${id}`}>
          <button className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Trip Calendar</h1>
          <p className="text-slate-500 text-sm">{trip.name} · Monthly view</p>
        </div>
      </div>

      {/* Journey legend */}
      {sortedStops.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-5">
          <h2 className="font-display text-sm font-bold mb-3 text-slate-600">Journey</h2>
          <div className="flex flex-wrap items-center gap-2">
            {sortedStops.map((stop, i) => {
              const colors = STOP_COLORS[i % STOP_COLORS.length];
              return (
                <div key={stop.id} className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${colors.pill} ${colors.text}`}>
                    {stop.city}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {stop.startDate.slice(5).replace('-', '/')} – {stop.endDate.slice(5).replace('-', '/')}
                  </span>
                  {i < sortedStops.length - 1 && (
                    <span className="text-amber-600/60 mx-1">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tripDates.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Add dates to your stops to see the calendar view</p>
          <Link href={`/trips/${id}/builder`}>
            <button className="btn-primary">Go to Builder</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <MonthCalendar
            year={viewYear}
            month={viewMonth}
            dayMap={dayMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
          />

          <AnimatePresence mode="wait">
            {selectedDayInfo && selectedDate && (
              <DayDetailPanel
                key={selectedDate}
                dayInfo={selectedDayInfo}
                dateKey={selectedDate}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
