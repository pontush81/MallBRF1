import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MaintenanceTask } from '../types/MaintenancePlan';
import { saveMaintenanceTasks, loadMaintenanceTasks } from '../services/maintenanceDataService';
import { maintenanceTasksData } from '../data/maintenanceTasksData';



interface MaintenanceContextType {
  tasks: MaintenanceTask[];
  setTasks: React.Dispatch<React.SetStateAction<MaintenanceTask[]>>;
  updateTask: (taskId: string, updates: Partial<MaintenanceTask>) => Promise<void>;
  addTask: (task: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenanceContext = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceContext must be used within a MaintenanceProvider');
  }
  return context;
};

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTasks = async () => {
      try {
        let loadedTasks = await loadMaintenanceTasks();
        
        // Convert any old format tasks to new format
        const convertedTasks: MaintenanceTask[] = [];
        for (const task of loadedTasks) {
          const taskObj = task as any;
          const newTask: MaintenanceTask = {
            id: taskObj.id,
            months: taskObj.months || (taskObj.month ? [taskObj.month] : ['Januari']),
            year: taskObj.year || new Date().getFullYear(),
            task: taskObj.task,
            description: taskObj.description,
            responsible: taskObj.responsible,
            status: taskObj.status,
            comments: taskObj.comments,
            category: taskObj.category,
            dueDate: taskObj.dueDate,
            createdAt: taskObj.createdAt,
            updatedAt: taskObj.updatedAt
          };
          convertedTasks.push(newTask);
        }
        
        if (convertedTasks.length === 0 && !isInitialized) {
          // If no tasks exist, initialize with default data
          const currentYear = new Date().getFullYear();
          const defaultTasks: MaintenanceTask[] = [];
          
          for (const task of maintenanceTasksData) {
            const taskObj = task as any;
            const newTask: MaintenanceTask = {
              id: taskObj.id,
              months: taskObj.months || (taskObj.month ? [taskObj.month] : ['Januari']),
              year: taskObj.year || currentYear,
              task: taskObj.task,
              description: taskObj.description,
              responsible: taskObj.responsible,
              status: taskObj.status,
              comments: taskObj.comments,
              category: taskObj.category,
              dueDate: taskObj.dueDate,
              createdAt: taskObj.createdAt,
              updatedAt: taskObj.updatedAt
            };
            defaultTasks.push(newTask);
          }
          
          await saveMaintenanceTasks(defaultTasks);
          setIsInitialized(true);
          setTasks(defaultTasks);
        } else {
          setTasks(convertedTasks);
        }
      } catch (error) {
        console.error('Error loading maintenance tasks:', error);
      }
    };

    initializeTasks();
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveMaintenanceTasks(tasks).catch(error => {
        console.error('Error saving maintenance tasks:', error);
      });
    }
  }, [tasks, isInitialized]);

  const updateTask = async (taskId: string, updates: Partial<MaintenanceTask>) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      return newTasks;
    });
  };

  const addTask = async (taskData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: MaintenanceTask = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  return (
    <MaintenanceContext.Provider
      value={{
        tasks,
        setTasks,
        updateTask,
        addTask,
        deleteTask,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}; 