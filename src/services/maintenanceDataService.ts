import { MaintenanceTask } from '../types/MaintenancePlan';

const STORAGE_KEY = 'maintenanceTasks';

export const saveMaintenanceTasks = async (tasks: MaintenanceTask[]): Promise<void> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving maintenance tasks:', error);
    throw error;
  }
};

export const loadMaintenanceTasks = async (): Promise<MaintenanceTask[]> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // If no data exists yet, return empty array
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading maintenance tasks:', error);
    throw error;
  }
}; 