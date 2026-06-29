export const generateGoogleCalendarLink = ({
  title,
  description,
  location,
  startDate,
  endDate,
  allDay = true,
}) => {
  const baseUrl = "https://calendar.google.com/calendar/render";

  const formatCalendarDate = (dateStr, allDayEvent) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return "";

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");

    if (allDayEvent) {
      return `${year}${month}${day}`;
    } else {
      const hours = String(dateObj.getUTCHours()).padStart(2, "0");
      const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
      const seconds = String(dateObj.getUTCSeconds()).padStart(2, "0");
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }
  };

  const start = formatCalendarDate(startDate, allDay);
  if (!start) return "";

  let end = "";
  if (endDate) {
    end = formatCalendarDate(endDate, allDay);
  } else {
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    end = formatCalendarDate(nextDay, allDay);
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location,
    sf: "true",
    output: "xml",
  });

  return `${baseUrl}?${params.toString()}`;
};
