export function formatDate(date: Date | string) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date");
    }
    // Format: "Month DD, YYYY at HH:MM AM/PM"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(dateObj);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Date unavailable";
  }
}
