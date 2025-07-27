import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MaintenancePlan from '../../../components/maintenance/MaintenancePlan';
import { MaintenanceTask } from '../../../types/MaintenancePlan';
import { maintenanceTasks } from '../../../data/maintenanceTasks';

// Mock the MaintenanceTaskEditor component to avoid rendering it in tests
jest.mock('../../../components/maintenance/MaintenanceTaskEditor', () => {
  return function MockEditor({ onSave, onCancel }: any) {
    return (
      <div data-testid="mock-editor">
        <button onClick={() => onCancel()}>Cancel</button>
        <button onClick={() => onSave({
          id: 'test-id',
          task: 'Test Task',
          month: 'Januari',
          description: 'Test Description',
          responsible: 'Test Person',
          status: 'completed',
          category: 'Test Category',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })}>Save</button>
      </div>
    );
  };
});

describe('MaintenancePlan Component', () => {
  test('renders the maintenance plan with tasks', () => {
    render(<MaintenancePlan />);
    
    // Check that the component title is rendered
    expect(screen.getByText('Underhållsplan - Årsöversikt')).toBeInTheDocument();
    
    // Check table headers are present
    expect(screen.getByText('Månad')).toBeInTheDocument();
    expect(screen.getByText('Arbetsuppgift')).toBeInTheDocument();
    expect(screen.getByText('Beskrivning / Info')).toBeInTheDocument();
    expect(screen.getByText('Ansvarig')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check sample tasks are displayed
    maintenanceTasks.forEach(task => {
      expect(screen.getByText(task.task)).toBeInTheDocument();
      expect(screen.getByText(task.description)).toBeInTheDocument();
      expect(screen.getByText(task.responsible)).toBeInTheDocument();
    });
  });
  
  test('filters tasks by month', () => {
    render(<MaintenancePlan />);
    
    // Find the month filter and select a specific month
    const monthFilter = screen.getByLabelText('Månad');
    fireEvent.mouseDown(monthFilter);
    
    // Select 'Mars' from the dropdown
    const marsOption = screen.getByText('Mars');
    fireEvent.click(marsOption);
    
    // There should only be one task for Mars
    const marsTask = maintenanceTasks.find(task => task.months?.includes('Mars'));
    if (marsTask) {
      // The Mars task should be visible
      expect(screen.getByText(marsTask.task)).toBeInTheDocument();
      
      // Other tasks should not be visible
      const januariTask = maintenanceTasks.find(task => task.months?.includes('Januari'));
      if (januariTask) {
        expect(screen.queryByText(januariTask.task)).not.toBeInTheDocument();
      }
    }
  });
  
  test('changes task status', () => {
    render(<MaintenancePlan />);
    
    // Find the first task
    const firstTask = maintenanceTasks[0];
    const taskRow = screen.getByText(firstTask.task).closest('tr');
    
    if (taskRow) {
      // Find status select in the row and change it
      const statusSelect = within(taskRow).getByRole('combobox');
      fireEvent.mouseDown(statusSelect);
      
      // Select 'Klar' status
      const completedOption = screen.getByText('Klar');
      fireEvent.click(completedOption);
      
      // The status should be updated to 'completed'
      expect(statusSelect).toHaveValue('completed');
    }
  });
  
  test('opens editor when edit button is clicked', () => {
    render(<MaintenancePlan />);
    
    // Find the first task row
    const firstTask = maintenanceTasks[0];
    const taskRow = screen.getByText(firstTask.task).closest('tr');
    
    if (taskRow) {
      // Find edit button and click it
      const editButton = within(taskRow).getByRole('button');
      fireEvent.click(editButton);
      
      // The mock editor should be visible
      expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
      
      // Close the editor
      fireEvent.click(screen.getByText('Cancel'));
      
      // The editor should be closed
      expect(screen.queryByTestId('mock-editor')).not.toBeInTheDocument();
    }
  });
}); 