import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import { useMaintenanceContext } from '../../context/MaintenanceContext';

interface KanbanColumnProps {
  title: string;
  status: MaintenanceStatus;
  tasks: MaintenanceTask[];
  color: string;
  icon: React.ReactNode;
  onEditTask: (task: MaintenanceTask) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: MaintenanceStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  color,
  icon,
  onEditTask,
  onDeleteTask,
  onStatusChange
}) => {
  const isOverdue = (task: MaintenanceTask) => {
    if (task.status === 'completed') return false;
    const currentMonth = new Date().getMonth();
    const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
                       'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
    
    const taskMonths = task.months.map(month => monthNames.indexOf(month));
    return taskMonths.some(monthIndex => monthIndex < currentMonth && monthIndex !== -1);
  };

  const handleDragStart = (e: React.DragEvent, task: MaintenanceTask) => {
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData('application/json');
    if (taskData) {
      const task = JSON.parse(taskData) as MaintenanceTask;
      if (task.status !== status) {
        onStatusChange(task.id, status);
      }
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        minHeight: 600,
        backgroundColor: '#fafafa'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={{ bgcolor: color, width: 28, height: 28 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          <Badge badgeContent={tasks.length} color="primary" />
        </Box>
        <Divider />
      </Box>

      {/* Tasks */}
      <Stack spacing={2}>
        {tasks.map((task) => (
          <Card
            key={task.id}
            elevation={1}
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            sx={{
              cursor: 'grab',
              '&:hover': {
                elevation: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              },
              '&:active': {
                cursor: 'grabbing'
              },
              position: 'relative',
              border: isOverdue(task) ? '2px solid #f44336' : 'none'
            }}
          >
            {isOverdue(task) && (
              <Chip
                icon={<WarningIcon />}
                label="Overdue"
                color="error"
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  zIndex: 1 
                }}
              />
            )}
            
            <CardContent sx={{ pb: '8px !important' }}>
              <Typography variant="subtitle2" component="h4" gutterBottom>
                {task.task}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {task.description}
              </Typography>

              {/* Task Metadata */}
              <Box sx={{ mb: 2 }}>
                {task.category && (
                  <Chip
                    icon={<CategoryIcon />}
                    label={task.category}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                )}
                
                <Chip
                  icon={<PersonIcon />}
                  label={task.responsible}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />

                <Chip
                  icon={<ScheduleIcon />}
                  label={task.months.join(', ')}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              {/* Actions */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {task.year}
                </Typography>
                
                <Box>
                  <Tooltip title="Redigera uppgift">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Ta bort uppgift">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Är du säker på att du vill ta bort denna uppgift?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {tasks.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">Inga uppgifter i denna kolumn</Typography>
        </Box>
      )}
    </Paper>
  );
};

interface MaintenanceKanbanBoardProps {
  selectedYear: string;
  onEditTask: (task: MaintenanceTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const MaintenanceKanbanBoard: React.FC<MaintenanceKanbanBoardProps> = ({
  selectedYear,
  onEditTask,
  onDeleteTask
}) => {
  const { tasks, updateTask } = useMaintenanceContext();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => task.year.toString() === selectedYear);
  }, [tasks, selectedYear]);

  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(task => task.status === 'pending'),
      in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
      completed: filteredTasks.filter(task => task.status === 'completed')
    };
  }, [filteredTasks]);

  const handleStatusChange = async (taskId: string, newStatus: MaintenanceStatus) => {
    await updateTask(taskId, { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    });
  };

  const columns = [
    {
      title: 'Ej påbörjad',
      status: 'pending' as MaintenanceStatus,
      tasks: tasksByStatus.pending,
      color: '#ff9800',
      icon: <ScheduleIcon fontSize="small" />
    },
    {
      title: 'Pågående',
      status: 'in_progress' as MaintenanceStatus,
      tasks: tasksByStatus.in_progress,
      color: '#2196f3',
      icon: <TimeIcon fontSize="small" />
    },
    {
      title: 'Slutförd',
      status: 'completed' as MaintenanceStatus,
      tasks: tasksByStatus.completed,
      color: '#4caf50',
      icon: <CheckCircleIcon fontSize="small" />
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Kanban-tavla - {selectedYear}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Dra och släpp uppgifter mellan kolumner för att uppdatera deras status. Röda ramar indikerar försenade uppgifter.
      </Typography>

      <Grid container spacing={3}>
        {columns.map((column) => (
          <Grid item xs={12} md={4} key={column.status}>
            <KanbanColumn
              title={column.title}
              status={column.status}
              tasks={column.tasks}
              color={column.color}
              icon={column.icon}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onStatusChange={handleStatusChange}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MaintenanceKanbanBoard;