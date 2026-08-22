/**
 * Itinerary Assembly and Timeline Calculation Engine
 * Person B Deliverable
 */

/**
 * Format a Date object as YYYY-MM-DD string
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate an array of date strings between start and end dates inclusive
 */
function getDaysList(startDateStr, endDateStr) {
  const dates = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [formatDate(startDateStr || new Date())];
  }

  const curr = new Date(start);
  while (curr <= end) {
    dates.push(formatDate(curr));
    curr.setDate(curr.getDate() + 1);
  }

  return dates;
}

/**
 * Maps standard time slot strings to representative time offsets
 */
const TIME_SLOT_HOURS = {
  morning: { start: '09:00:00', end: '12:00:00', label: 'Morning (9:00 AM - 12:00 PM)' },
  afternoon: { start: '13:00:00', end: '17:00:00', label: 'Afternoon (1:00 PM - 5:00 PM)' },
  evening: { start: '18:00:00', end: '21:00:00', label: 'Evening (6:00 PM - 9:00 PM)' },
};

/**
 * Assemble day-by-day itinerary structured response
 * @param {Object} trip - Trip object
 * @param {Array} stops - Stops with joined city info
 * @param {Array} tripActivities - Booked activities for the stops
 * @returns {Object} Structured day-wise itinerary
 */
function assembleItinerary(trip, stops = [], tripActivities = []) {
  const tripDates = getDaysList(trip.start_date, trip.end_date);
  const totalDays = tripDates.length;

  // Build a lookup map of activities by stop_id and day_number
  const activitiesByStopAndDay = {};
  let totalActivityCost = 0;

  tripActivities.forEach((act) => {
    const key = `${act.stop_id}_${act.day_number}`;
    if (!activitiesByStopAndDay[key]) {
      activitiesByStopAndDay[key] = [];
    }
    const costNum = parseFloat(act.cost || 0);
    totalActivityCost += costNum;

    activitiesByStopAndDay[key].push({
      tripActivityId: act.id,
      activityId: act.activity_id,
      name: act.custom_name || act.activity_name || act.name,
      type: act.type || 'sightseeing',
      timeSlot: act.time_slot || 'morning',
      cost: costNum,
      duration: act.duration,
      description: act.description,
      imageUrl: act.image_url,
      notes: act.notes,
    });
  });

  // Sort stops by order_index
  const sortedStops = [...stops].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  // Construct day-wise breakdown
  const days = tripDates.map((dateStr, index) => {
    const dayNumber = index + 1;
    const dateObj = new Date(dateStr);

    // Find which stop corresponds to this day (by date range or stop assignment)
    let matchingStop = sortedStops.find((stop) => {
      if (!stop.start_date || !stop.end_date) return false;
      const sStart = new Date(stop.start_date);
      const sEnd = new Date(stop.end_date);
      return dateObj >= sStart && dateObj <= sEnd;
    });

    // Fallback to stop based on day sequence if dates not strictly bounded
    if (!matchingStop && sortedStops.length > 0) {
      const stopIndex = Math.min(
        Math.floor((index / totalDays) * sortedStops.length),
        sortedStops.length - 1
      );
      matchingStop = sortedStops[stopIndex];
    }

    let dayActivities = [];
    let stopCity = null;

    if (matchingStop) {
      stopCity = {
        stopId: matchingStop.id,
        cityId: matchingStop.city_id,
        name: matchingStop.city_name || matchingStop.name,
        country: matchingStop.country,
        lat: parseFloat(matchingStop.lat),
        lng: parseFloat(matchingStop.lng),
        imageUrl: matchingStop.image_url,
        costIndex: matchingStop.cost_index,
      };

      // Retrieve activities assigned to this stop for this day
      // Check both absolute trip dayNumber and relative stop day
      const keyAbsolute = `${matchingStop.id}_${dayNumber}`;
      const relativeDay = matchingStop.start_date
        ? Math.max(1, Math.floor((dateObj - new Date(matchingStop.start_date)) / (1000 * 60 * 60 * 24)) + 1)
        : 1;
      const keyRelative = `${matchingStop.id}_${relativeDay}`;

      const matchedActs = activitiesByStopAndDay[keyAbsolute] || activitiesByStopAndDay[keyRelative] || [];
      dayActivities = matchedActs;
    }

    const dayCost = dayActivities.reduce((sum, a) => sum + a.cost, 0);

    return {
      dayNumber,
      date: dateStr,
      city: stopCity,
      dayTotalCost: dayCost,
      activitiesCount: dayActivities.length,
      activities: dayActivities,
    };
  });

  return {
    tripId: trip.id,
    tripName: trip.name,
    startDate: formatDate(trip.start_date),
    endDate: formatDate(trip.end_date),
    totalDays,
    description: trip.description,
    coverPhotoUrl: trip.cover_photo_url,
    totalActivities: tripActivities.length,
    totalActivityCost,
    days,
  };
}

/**
 * Assemble calendar / timeline events for Screen 10
 */
function assembleCalendarEvents(trip, stops = [], tripActivities = []) {
  const itinerary = assembleItinerary(trip, stops, tripActivities);
  const events = [];

  itinerary.days.forEach((day) => {
    day.activities.forEach((act) => {
      const slot = (act.timeSlot || 'morning').toLowerCase();
      const timeInfo = TIME_SLOT_HOURS[slot] || { start: '10:00:00', end: '12:00:00' };

      events.push({
        id: act.tripActivityId,
        title: act.name,
        activityId: act.activityId,
        cityName: day.city ? day.city.name : 'Unknown City',
        cityId: day.city ? day.city.cityId : null,
        stopId: day.city ? day.city.stopId : null,
        dayNumber: day.dayNumber,
        date: day.date,
        start: `${day.date}T${timeInfo.start}`,
        end: `${day.date}T${timeInfo.end}`,
        timeSlot: act.timeSlot,
        type: act.type,
        cost: act.cost,
        description: act.description,
        imageUrl: act.imageUrl,
      });
    });
  });

  return events;
}

module.exports = {
  formatDate,
  getDaysList,
  assembleItinerary,
  assembleCalendarEvents,
};
