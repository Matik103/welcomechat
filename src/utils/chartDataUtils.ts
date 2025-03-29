
/**
 * Utilities for generating chart data for dashboard components
 */

/**
 * Generates random chart data for visualization purposes
 * @param length The number of data points to generate
 * @returns An array of random values between 0-100
 */
export const generateChartData = (length = 24): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100));
};

/**
 * Creates initial empty dashboard chart data structure
 * @returns Initial activity chart data structure with empty values
 */
export const createInitialActivityCharts = () => {
  return {
    database: {
      value: "0",
      title: "Database",
      subtitle: "REST Requests",
      data: []
    },
    auth: {
      value: "0",
      title: "Auth",
      subtitle: "Auth Requests",
      data: []
    },
    storage: {
      value: "0",
      title: "Storage",
      subtitle: "Storage Requests",
      data: []
    },
    realtime: {
      value: "0",
      title: "Realtime",
      subtitle: "Realtime Requests",
      data: []
    }
  };
};
