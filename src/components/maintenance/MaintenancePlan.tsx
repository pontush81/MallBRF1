import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import MaintenanceTaskEditor from './MaintenanceTaskEditor';
import { useMaintenanceContext } from '../../context/MaintenanceContext';
import { maintenanceCategoriesData } from '../../data/maintenanceTasksData';

const statusColors: Record<MaintenanceStatus, 'warning' | 'info' | 'success'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
};

const statusLabels = {
  pending: 'Ej påbörjad',
  in_progress: 'Pågår',
  completed: 'Klar',
};

const MaintenancePlan: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useMaintenanceContext();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | ''>('');
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleMonthChange = (event: SelectChangeEvent<string>) => {
    setSelectedMonth(event.target.value);
  };

  const handleYearChange = (event: SelectChangeEvent<string>) => {
    setSelectedYear(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value as MaintenanceStatus | '');
  };

  const handleEditClick = (task: MaintenanceTask) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingTask(null);
    setIsEditorOpen(true);
  };

  const handleSaveTask = async (task: MaintenanceTask) => {
    if (task.id) {
      await updateTask(task.id, task);
    } else {
      await addTask(task);
    }
    setIsEditorOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna uppgift?')) {
      await deleteTask(taskId);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesMonth = !selectedMonth || task.months.includes(selectedMonth);
    const matchesYear = !selectedYear || task.year.toString() === selectedYear;
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    return matchesMonth && matchesYear && matchesCategory && matchesStatus;
  });

  // Get unique years from tasks
  const years = Array.from(new Set(tasks.map(task => task.year))).sort((a, b) => b - a);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Underhållsplan
        </Typography>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-filter-label">Månad</InputLabel>
            <Select
              labelId="month-filter-label"
              value={selectedMonth}
              label="Månad"
              onChange={handleMonthChange}
            >
              <MenuItem value="">Alla</MenuItem>
              {[
                'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
                'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
              ].map(month => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="year-filter-label">År</InputLabel>
            <Select
              labelId="year-filter-label"
              value={selectedYear}
              label="År"
              onChange={handleYearChange}
            >
              <MenuItem value="">Alla</MenuItem>
              {years.map(year => (
                <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="category-filter-label">Kategori</InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              label="Kategori"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">Alla</MenuItem>
              {maintenanceCategoriesData.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={selectedStatus}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="">Alla</MenuItem>
              <MenuItem value="pending">Ej påbörjad</MenuItem>
              <MenuItem value="in_progress">Pågår</MenuItem>
              <MenuItem value="completed">Klar</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleAddNewClick}
            sx={{ ml: 'auto' }}
          >
            Lägg till uppgift
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Månader</TableCell>
                <TableCell>År</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Uppgift</TableCell>
                <TableCell>Beskrivning</TableCell>
                <TableCell>Ansvarig</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.months.join(', ')}</TableCell>
                  <TableCell>{task.year}</TableCell>
                  <TableCell>{task.category}</TableCell>
                  <TableCell>{task.task}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>{task.responsible}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[task.status]}
                      color={statusColors[task.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(task)}
                      aria-label="redigera"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTask(task.id)}
                      aria-label="ta bort"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <MaintenanceTaskEditor
          task={editingTask}
          open={isEditorOpen}
          onSave={handleSaveTask}
          onCancel={() => setIsEditorOpen(false)}
        />
      </Box>
    </Container>
  );
};

export default MaintenancePlan; 