
/**
 * Get date range based on time range string
 * @param timeRange Time range string (1d, 1m, 1y, all)
 * @returns Object containing start and end dates
 */
export const getDateRange = (
  timeRange: "1d" | "1m" | "1y" | "all"
): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "1d":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "1m":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "all":
      startDate = new Date(0); // Beginning of time (1970)
      break;
  }

  return { startDate, endDate };
};
