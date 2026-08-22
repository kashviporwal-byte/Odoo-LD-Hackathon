import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import api from '../services/api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STOP_COLORS = [
  { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-800', pill: 'bg-amber-500/20' },
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-800', pill: 'bg-blue-500/15' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-800', pill: 'bg-emerald-500/15' },
  { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-800', pill: 'bg-violet-500/15' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-800', pill: 'bg-rose-500/15' },
];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDayMap(stops) {
  const dayMap = {};
  if (!stops) return dayMap;
  const sorted = [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  sorted.forEach((stop, stopIndex) => {
    if (!stop.start_date || !stop.end_date) return;
    const start = new Date(`${stop.start_date}T12:00:00`);
    const end = new Date(`${stop.end_date}T12:00:00`);
    let current = new Date(start);

    while (current <= end) {
      const dateKey = toDateKey(current);
      dayMap[dateKey] = {
        stop,
        stopIndex,
        activities: stop.activities || [],
        isFirstDay: dateKey === stop.start_date,
        isLastDay: dateKey === stop.end_date,
      };
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    }
  });

  return dayMap;
}

function getCalendarCells(year, month) {
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
}) {
  const todayKey = toDateKey(new Date());
  const cells = getCalendarCells(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{monthLabel}</h2>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
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
                'relative min-h-[92px] p-2 border-b border-r border-gray-200 text-left transition-colors',
                'flex flex-col gap-1',
                !isCurrentMonth && 'bg-gray-50/50',
                isCurrentMonth && !dayInfo && 'hover:bg-gray-50',
                dayInfo && colors?.bg,
                dayInfo && 'cursor-pointer hover:brightness-[0.98]',
                !dayInfo && 'cursor-default',
                isSelected && 'ring-2 ring-inset ring-primary-500/60',
              ].filter(Boolean).join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold flex-shrink-0',
                  !isCurrentMonth && 'text-gray-300',
                  isCurrentMonth && !isToday && !dayInfo && 'text-gray-700',
                  isCurrentMonth && dayInfo && colors?.text,
                  isToday && 'bg-primary-600 text-white',
                ].filter(Boolean).join(' ')}
              >
                {date.getDate()}
              </span>

              {dayInfo && (
                <div className="flex-grow w-full space-y-0.5 overflow-hidden">
                  <span
                    className={[
                      'block text-[10px] font-bold truncate px-1 py-0.5 rounded',
                      colors?.pill,
                      colors?.text,
                      !isCurrentMonth && 'opacity-70',
                    ].filter(Boolean).join(' ')}
                  >
                    {dayInfo.isFirstDay && '▶ '}
                    {dayInfo.stop.cityName}
                    {dayInfo.isLastDay && !dayInfo.isFirstDay && ' ◀'}
                  </span>
                  {isCurrentMonth && dayInfo.activities.slice(0, 2).map((act) => (
                    <p
                      key={act.id}
                      className="text-[10px] text-gray-600 truncate leading-tight px-0.5"
                    >
                      {act.time_slot ? `${act.time_slot} · ` : ''}{act.name}
                    </p>
                  ))}
                  {isCurrentMonth && dayInfo.activities.length > 2 && (
                    <p className="text-[10px] text-gray-400 px-0.5">
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

function DayDetailPanel({ dayInfo, dateKey }) {
  const d = new Date(`${dateKey}T12:00:00`);
  const totalCost = dayInfo.activities.reduce((a, act) => a + (parseFloat(act.cost) || 0), 0);
  const colors = STOP_COLORS[dayInfo.stopIndex % STOP_COLORS.length];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6 transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">
            {d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <MapPin className="w-5 h-5 text-primary-600" />
            {dayInfo.stop.cityName}, {dayInfo.stop.country}
          </h3>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.pill} ${colors.text}`}>
          {dayInfo.activities.length} activities
        </span>
      </div>

      {dayInfo.activities.length === 0 ? (
        <p className="text-sm text-gray-500">No activities planned for this day.</p>
      ) : (
        <div className="space-y-2">
          {dayInfo.activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl"
            >
              {act.image_url && (
                <img src={act.image_url} alt={act.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-950 truncate">{act.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {act.time_slot && (
                    <span className="flex items-center gap-0.5 capitalize">
                      <Clock className="w-3.5 h-3.5" />{act.time_slot}
                    </span>
                  )}
                  {act.duration && <span>{act.duration} mins</span>}
                </div>
              </div>
              <span className="text-green-600 text-sm font-semibold flex-shrink-0">
                {(parseFloat(act.cost) || 0) === 0 ? 'Free' : `$${parseFloat(act.cost).toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {totalCost > 0 && (
        <p className="text-sm text-gray-500 mt-3 text-right">
          Estimated day cost: <span className="font-semibold text-gray-900">${totalCost.toFixed(2)}</span>
        </p>
      )}
    </div>
  );
}

const Timeline = () => {
  const { tripId } = useParams();
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const res = await api.get(`/trips/${tripId}`);
        setTripData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTripDetails();
  }, [tripId]);

  const dayMap = useMemo(() => {
    return tripData ? buildDayMap(tripData.stops) : {};
  }, [tripData]);

  const tripDates = useMemo(() => {
    return Object.keys(dayMap).sort();
  }, [dayMap]);

  const initialMonth = useMemo(() => {
    if (tripDates.length === 0) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    }
    const first = new Date(`${tripDates[0]}T12:00:00`);
    return { year: first.getFullYear(), month: first.getMonth() };
  }, [tripDates]);

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // Sync initial month view and selected date when trip data arrives
  useEffect(() => {
    if (initialMonth && tripDates.length > 0) {
      setViewYear(initialMonth.year);
      setViewMonth(initialMonth.month);
      setSelectedDate(tripDates[0]);
    }
  }, [initialMonth, tripDates]);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Loading calendar view...</p>
      </div>
    );
  }

  if (!tripData || !tripData.trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Trip not found</h2>
        <Link to="/trips" className="text-primary-600 font-semibold mt-2 block">Back to trips</Link>
      </div>
    );
  }

  const { trip, stops } = tripData;
  const sortedStops = [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const selectedDayInfo = selectedDate ? dayMap[selectedDate] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/trips/${tripId}`} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Calendar</h1>
          <p className="text-gray-500 text-sm">{trip.name} · Monthly timeline view</p>
        </div>
      </div>

      {/* Stops Route Legend */}
      {sortedStops.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Journey Route</h2>
          <div className="flex flex-wrap items-center gap-2">
            {sortedStops.map((stop, i) => {
              const colors = STOP_COLORS[i % STOP_COLORS.length];
              return (
                <div key={stop.id} className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${colors.pill} ${colors.text}`}>
                    {stop.cityName}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {stop.start_date ? stop.start_date.slice(5).replace('-', '/') : ''} – {stop.end_date ? stop.end_date.slice(5).replace('-', '/') : ''}
                  </span>
                  {i < sortedStops.length - 1 && (
                    <span className="text-primary-600/60 mx-1">&rarr;</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tripDates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <p className="text-gray-500 mb-4">Add stops with dates to see the itinerary mapped on the calendar</p>
          <Link to={`/trips/${tripId}`}>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors">
              Go to Itinerary Builder
            </button>
          </Link>
        </div>
      ) : (
        <div>
          <MonthCalendar
            year={viewYear}
            month={viewMonth}
            dayMap={dayMap}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
          />

          {selectedDayInfo && selectedDate && (
            <DayDetailPanel
              dayInfo={selectedDayInfo}
              dateKey={selectedDate}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
