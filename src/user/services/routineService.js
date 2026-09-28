/**
 * Routine Service Boundary.
 * Manages daily wellbeing routine tasks.
 * Currently uses local memory state with structured service calls ready for backend persistence.
 */

export const DEFAULT_ROUTINE_ITEMS = [
  { id: '1', key: 'routineWakeUp', defaultTitle: 'Wake up on time', icon: 'sun' },
  { id: '2', key: 'routineRegularMeals', defaultTitle: 'Have regular meals', icon: 'utensils' },
  { id: '3', key: 'routineShortWalk', defaultTitle: 'Take a short walk', icon: 'walk' },
  { id: '4', key: 'routineRelaxation', defaultTitle: 'Take quiet relaxation time', icon: 'book' },
  { id: '5', key: 'routineStayConnected', defaultTitle: 'Connect with someone you trust', icon: 'people' },
  { id: '6', key: 'routineSleepOnTime', defaultTitle: 'Sleep on time', icon: 'moon' },
];

export async function fetchTodayRoutines() {
  return DEFAULT_ROUTINE_ITEMS;
}

export async function toggleRoutineCompletion(routineId, currentStatus) {
  // Service boundary ready for Supabase persistence
  return !currentStatus;
}
