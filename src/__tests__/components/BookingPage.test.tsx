import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sv } from 'date-fns/locale';
import BookingPage from '../../pages/public/BookingPage';
import theme from '../../theme';
import bookingService from '../../services/bookingService';
import pageService from '../../services/pageService';

// Mock the services
jest.mock('../../services/bookingService');
jest.mock('../../services/pageService');

// Mock FullCalendar to avoid issues with DOM manipulation
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar(props: any) {
    return <div data-testid="mock-calendar" {...props} />;
  };
});

describe('BookingPage Component', () => {
  const mockBookings = [
    {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      startDate: '2024-03-25',
      endDate: '2024-03-27',
      status: 'confirmed',
      phone: '1234567890',
      notes: 'Test booking'
    }
  ];

  const mockApartmentInfo = {
    id: '1',
    title: 'Lägenhetsinformation',
    content: 'Test content',
    slug: 'lagenhet-info',
    isPublished: true,
    show: true,
    files: []
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (bookingService.getAllBookings as jest.Mock).mockResolvedValue(mockBookings);
    (bookingService.createBooking as jest.Mock).mockResolvedValue({ id: '2', ...mockBookings[0] });
    (pageService.getPageBySlug as jest.Mock).mockResolvedValue(mockApartmentInfo);
  });

  const renderBookingPage = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
            <BookingPage />
          </LocalizationProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  test('renders booking page with initial state', () => {
    renderBookingPage();
    
    // Check for main components
    expect(screen.getByText('Boka lägenhet')).toBeInTheDocument();
    expect(screen.getByText('Välj datum och dina uppgifter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
  });

  test('loads and displays existing bookings', async () => {
    renderBookingPage();
    
    // Wait for bookings to load
    await waitFor(() => {
      expect(bookingService.getAllBookings).toHaveBeenCalled();
    });
  });

  test('validates form fields correctly', async () => {
    renderBookingPage();
    
    // Try to proceed without filling any fields
    const nextButton = screen.getByText('Nästa');
    fireEvent.click(nextButton);
    
    // Check for validation messages
    expect(screen.getByText('Välj ett ankomstdatum')).toBeInTheDocument();
    expect(screen.getByText('Välj ett avresedatum')).toBeInTheDocument();
    expect(screen.getByText('Namn krävs')).toBeInTheDocument();
    expect(screen.getByText('E-post krävs')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    renderBookingPage();
    
    // Fill in the form with invalid email
    const nameInput = screen.getByLabelText('Namn');
    const emailInput = screen.getByLabelText('E-post');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const nextButton = screen.getByText('Nästa');
    fireEvent.click(nextButton);
    
    // Check for email validation message
    expect(screen.getByText('Ogiltig e-postadress')).toBeInTheDocument();
  });

  test('submits booking successfully', async () => {
    renderBookingPage();
    
    // Fill in the form
    const nameInput = screen.getByLabelText('Namn');
    const emailInput = screen.getByLabelText('E-post');
    const phoneInput = screen.getByLabelText('Telefon');
    const notesInput = screen.getByLabelText('Anteckningar');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });
    
    // Select dates (you'll need to implement date selection based on your UI)
    // This is a simplified version - you might need to adjust based on your actual date picker implementation
    
    // Submit the booking
    const nextButton = screen.getByText('Nästa');
    fireEvent.click(nextButton);
    
    // Wait for the booking to be created
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalled();
    });
    
    // Check for success message
    expect(screen.getByText(/Bokningen har skapats/i)).toBeInTheDocument();
  });

  test('handles booking errors gracefully', async () => {
    // Mock the createBooking to throw an error
    (bookingService.createBooking as jest.Mock).mockRejectedValue(new Error('Booking failed'));
    
    renderBookingPage();
    
    // Fill in the form
    const nameInput = screen.getByLabelText('Namn');
    const emailInput = screen.getByLabelText('E-post');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the booking
    const nextButton = screen.getByText('Nästa');
    fireEvent.click(nextButton);
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/Ett fel uppstod/i)).toBeInTheDocument();
    });
  });

  test('loads apartment information', async () => {
    renderBookingPage();
    
    // Wait for apartment info to load
    await waitFor(() => {
      expect(pageService.getPageBySlug).toHaveBeenCalledWith('lagenhet-info');
    });
  });

  test('resets form after successful submission', async () => {
    renderBookingPage();
    
    // Fill in the form
    const nameInput = screen.getByLabelText('Namn');
    const emailInput = screen.getByLabelText('E-post');
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the booking
    const nextButton = screen.getByText('Nästa');
    fireEvent.click(nextButton);
    
    // Wait for the booking to be created
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalled();
    });
    
    // Click reset button
    const resetButton = screen.getByText('Boka igen');
    fireEvent.click(resetButton);
    
    // Check if form is reset
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });
}); 