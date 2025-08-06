import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Button,
  ButtonGroup
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { MaintenanceTask, MaintenanceStatus } from '../../types/MaintenancePlan';
import { useMaintenanceContext } from '../../context/MaintenanceContext';

interface CalendarDayProps {
  month: string;
  monthIndex: number;
  tasks: MaintenanceTask[];
  currentMonth: number;
  onEditTask: (task: MaintenanceTask) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  month, 
  monthIndex, 
  tasks, 
  currentMonth, 
  onEditTask 
}) => {
  const isCurrentMonth = monthIndex === currentMonth;
  const isPastMonth = monthIndex < currentMonth;
  
  const statusCounts = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<MaintenanceStatus, number>);
  }, [tasks]);

  const overdueCount = useMemo(() => {
    return tasks.filter(task => 
      isPastMonth && task.status !== 'completed'
    ).length;
  }, [tasks, isPastMonth]);

  return (
    <Card 
      elevation={isCurrentMonth ? 3 : 1} 
      sx={{ 
        height: 240, 
        border: isCurrentMonth ? '2px solid #1976d2' : 'none',
        backgroundColor: isPastMonth ? '#fafafa' : 'white'
      }}
    >
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Month Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="h3" color={isCurrentMonth ? 'primary' : 'inherit'}>
            {month}
          </Typography>
          {isCurrentMonth && (
            <Chip icon={<TodayIcon />} label="Current" size="small" color="primary" />
          )}
          {overdueCount > 0 && (
            <Badge badgeContent={overdueCount} color="error">
              <WarningIcon color="error" />
            </Badge>
          )}
        </Box>

        {/* Status Summary */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {statusCounts.pending > 0 && (
            <Chip 
              label={`${statusCounts.pending} Pending`} 
              size="small" 
              color="warning" 
              variant="outlined"
            />
          )}
          {statusCounts.in_progress > 0 && (
            <Chip 
              label={`${statusCounts.in_progress} In Progress`} 
              size="small" 
              color="info" 
              variant="outlined"
            />
          )}
          {statusCounts.completed > 0 && (
            <Chip 
              label={`${statusCounts.completed} Done`} 
              size="small" 
              color="success" 
              variant="outlined"
            />
          )}
        </Box>

        {/* Task List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {tasks.length > 0 ? (
            <List dense sx={{ p: 0 }}>
              {tasks.slice(0, 3).map((task, index) => {
                const isOverdue = isPastMonth && task.status !== 'completed';
                return (
                  <ListItem 
                    key={task.id} 
                    sx={{ 
                      px: 0, 
                      py: 0.5,
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'action.hover' },
                      border: isOverdue ? '1px solid #f44336' : 'none',
                      backgroundColor: isOverdue ? '#ffebee' : 'transparent'
                    }}
                    onClick={() => onEditTask(task)}
                  >
                    <ListItemAvatar sx={{ minWidth: 32 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {task.status === 'completed' ? (
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        ) : task.status === 'in_progress' ? (
                          <TimeIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <ScheduleIcon sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {task.task}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {task.responsible}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
              
              {tasks.length > 3 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText>
                    <Typography variant="caption" color="text.secondary" align="center">
                      +{tasks.length - 3} more tasks...
                    </Typography>
                  </ListItemText>
                </ListItem>
              )}
            </List>
          ) : (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              color="text.secondary"
            >
              <Typography variant="body2">No tasks scheduled</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

interface MaintenanceCalendarViewProps {
  selectedYear: string;
  onEditTask: (task: MaintenanceTask) => void;
}

const MaintenanceCalendarView: React.FC<MaintenanceCalendarViewProps> = ({
  selectedYear,
  onEditTask
}) => {
  const { tasks } = useMaintenanceContext();
  const [selectedQuarter, setSelectedQuarter] = useState(0);

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const quarters = [
    { label: 'Q1', months: ['Januari', 'Februari', 'Mars'] },
    { label: 'Q2', months: ['April', 'Maj', 'Juni'] },
    { label: 'Q3', months: ['Juli', 'Augusti', 'September'] },
    { label: 'Q4', months: ['Oktober', 'November', 'December'] }
  ];

  const currentMonth = new Date().getMonth();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => task.year.toString() === selectedYear);
  }, [tasks, selectedYear]);

  const tasksByMonth = useMemo(() => {
    const monthTasks: Record<string, MaintenanceTask[]> = {};
    
    monthNames.forEach(month => {
      monthTasks[month] = filteredTasks.filter(task => 
        task.months.includes(month)
      );
    });
    
    return monthTasks;
  }, [filteredTasks, monthNames]);

  const currentQuarter = quarters[selectedQuarter];

  const handleQuarterChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedQuarter > 0) {
      setSelectedQuarter(selectedQuarter - 1);
    } else if (direction === 'next' && selectedQuarter < 3) {
      setSelectedQuarter(selectedQuarter + 1);
    }
  };

  const goToCurrentQuarter = () => {
    const currentQuarterIndex = Math.floor(currentMonth / 3);
    setSelectedQuarter(currentQuarterIndex);
  };

  return (
    <Box>
      {/* Calendar Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Maintenance Calendar - {selectedYear}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage tasks by month. Click on tasks to edit them.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={goToCurrentQuarter}
          >
            Current Quarter
          </Button>
          
          <ButtonGroup size="small" variant="outlined">
            <IconButton 
              onClick={() => handleQuarterChange('prev')}
              disabled={selectedQuarter === 0}
            >
              <ChevronLeftIcon />
            </IconButton>
            
            <Button sx={{ minWidth: 80 }}>
              {currentQuarter.label}
            </Button>
            
            <IconButton 
              onClick={() => handleQuarterChange('next')}
              disabled={selectedQuarter === 3}
            >
              <ChevronRightIcon />
            </IconButton>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Quarter View */}
      <Grid container spacing={3}>
        {currentQuarter.months.map((month, index) => {
          const monthIndex = monthNames.indexOf(month);
          const monthTasks = tasksByMonth[month] || [];
          
          return (
            <Grid item xs={12} md={4} key={month}>
              <CalendarDay
                month={month}
                monthIndex={monthIndex}
                tasks={monthTasks}
                currentMonth={currentMonth}
                onEditTask={onEditTask}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Annual Summary */}
      <Paper elevation={1} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Annual Summary - {selectedYear}
        </Typography>
        
        <Grid container spacing={3}>
          {monthNames.map((month) => {
            const monthTasks = tasksByMonth[month] || [];
            const completedTasks = monthTasks.filter(t => t.status === 'completed').length;
            const totalTasks = monthTasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            
            return (
              <Grid item xs={6} sm={4} md={2} key={month}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    {month.substring(0, 3)}
                  </Typography>
                  <Typography variant="h6">
                    {completedTasks}/{totalTasks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {completionRate.toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
};

export default MaintenanceCalendarView;