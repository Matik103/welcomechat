
// Simplified utility functions for activity types

// Map activity types to icon names (kept for backward compatibility)
export const activityTypeToIcon: Record<string, string> = {
  unknown: 'help-circle'
};

// Map activity types to colors (kept for backward compatibility)
export const activityTypeToColor: Record<string, string> = {
  unknown: 'gray'
};

// Get a readable label for an activity type
export const getActivityTypeLabel = (activityType: string): string => {
  return "Activity";
};
