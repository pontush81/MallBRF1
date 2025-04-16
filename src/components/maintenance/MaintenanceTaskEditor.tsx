import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import { maintenanceCategoriesData } from '../../data/maintenanceTasksData';
import { v4 as uuidv4 } from 'uuid';

interface MaintenanceTaskEditorProps {
  task: MaintenanceTask | null;
  open: boolean;
  onSave: (task: MaintenanceTask) => void;
  onCancel: () => void;
}

const months = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
];

// Interface for backward compatibility with old task format
interface LegacyMaintenanceTask extends Omit<MaintenanceTask, 'months' | 'year'> {
  month?: string;
}

const MaintenanceTaskEditor: React.FC<MaintenanceTaskEditorProps> = ({
  task,
  open,
  onSave,
  onCancel
}) => {
  const [editedTask, setEditedTask] = useState<MaintenanceTask>({
    id: '',
    months: ['Januari'],
    year: new Date().getFullYear(),
    task: '',
    description: '',
    responsible: '',
    status: 'pending' as MaintenanceStatus,
    category: maintenanceCategoriesData[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const isNewTask = !task?.id;

  useEffect(() => {
    if (task) {
      // Convert old format (single month) to new format (array of months) if needed
      const legacyTask = task as unknown as LegacyMaintenanceTask;
      const months = task.months || (legacyTask.month ? [legacyTask.month] : ['Januari']);
      setEditedTask({
        ...task,
        months,
        year: task.year || new Date().getFullYear()
      });
    } else {
      // Reset to default for new task
      setEditedTask({
        id: '',
        months: ['Januari'],
        year: new Date().getFullYear(),
        task: '',
        description: '',
        responsible: '',
        status: 'pending' as MaintenanceStatus,
        category: maintenanceCategoriesData[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({
      ...prev,
      [name]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>, field: string) => {
    const value = e.target.value;
    setEditedTask(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleMonthChange = (month: string) => {
    setEditedTask(prev => {
      const updatedMonths = prev.months.includes(month)
        ? prev.months.filter(m => m !== month)
        : [...prev.months, month];
      
      return {
        ...prev,
        months: updatedMonths,
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value) || new Date().getFullYear();
    setEditedTask(prev => ({
      ...prev,
      year,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = () => {
    const finalTask = {
      ...editedTask,
      id: editedTask.id || uuidv4(),
      updatedAt: new Date().toISOString()
    };
    onSave(finalTask);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {isNewTask ? 'Lägg till ny uppgift' : 'Redigera uppgift'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Välj månader
            </Typography>
            <FormGroup row>
              {months.map((month) => (
                <FormControlLabel
                  key={month}
                  control={
                    <Checkbox
                      checked={editedTask.months.includes(month)}
                      onChange={() => handleMonthChange(month)}
                    />
                  }
                  label={month}
                />
              ))}
            </FormGroup>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="År"
              name="year"
              type="number"
              value={editedTask.year}
              onChange={handleYearChange}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Kategori</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                value={editedTask.category || ''}
                label="Kategori"
                onChange={(e) => handleSelectChange(e, 'category')}
              >
                {maintenanceCategoriesData.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Arbetsuppgift"
              name="task"
              value={editedTask.task}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Beskrivning"
              name="description"
              value={editedTask.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ansvarig"
              name="responsible"
              value={editedTask.responsible}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={editedTask.status}
                label="Status"
                onChange={(e) => handleSelectChange(e, 'status')}
              >
                <MenuItem value="pending">Ej påbörjad</MenuItem>
                <MenuItem value="in_progress">Pågår</MenuItem>
                <MenuItem value="completed">Klar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Kommentarer"
              name="comments"
              value={editedTask.comments || ''}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Avbryt</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!editedTask.task || editedTask.months.length === 0}
        >
          Spara
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaintenanceTaskEditor; 