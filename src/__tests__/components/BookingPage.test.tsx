import React, { forwardRef } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sv } from 'date-fns/locale';
import theme from '../../theme';
import BookingPage from '../../pages/public/BookingPage';
import bookingServiceSupabase from '../../services/bookingServiceSupabase';
import pageServiceSupabase from '../../services/pageServiceSupabase';

// Mock the services
jest.mock('../../services/bookingServiceSupabase');
jest.mock('../../services/pageServiceSupabase');
jest.mock('@mui/material/useMediaQuery', () => () => false);

interface CalendarProps {
  select: (info: { start: Date; end: Date; view: { calendar: { addEvent: () => void } } }) => void;
}

// Mock FullCalendar
jest.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: forwardRef<HTMLDivElement, CalendarProps>(function DummyCalendar({ select }, ref) {
    return (
      <div data-testid="mock-calendar" ref={ref}>
        <button 
          onClick={() => select({ 
            start: new Date('2024-04-01'), 
            end: new Date('2024-04-03'),
            view: { calendar: { addEvent: jest.fn() } }
          })}
        >
          Select Dates
        </button>
      </div>
    );
  })
}));

describe('BookingPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingServiceSupabase.getAllBookings as jest.Mock).mockResolvedValue([]);
    (bookingServiceSupabase.checkAvailability as jest.Mock).mockResolvedValue({ available: true });
    (bookingServiceSupabase.createBooking as jest.Mock).mockResolvedValue({ id: '1' });
    (pageServiceSupabase.getPageBySlug as jest.Mock).mockResolvedValue(null);
  });

  const renderComponent = () => {
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

  it('renders booking page', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Boka boende')).toBeInTheDocument();
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
  });

  it('validates form fields and submits booking', async () => {
    renderComponent();

    // Fill in form fields
    const nameInput = screen.getByRole('textbox', { name: /namn/i });
    const emailInput = screen.getByRole('textbox', { name: /e-post/i });
    const phoneInput = screen.getByRole('textbox', { name: /telefon/i });
    const notesInput = screen.getByRole('textbox', { name: /meddelande/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      fireEvent.change(notesInput, { target: { value: 'Test notes' } });
    });

    // Select dates using the mock calendar
    const selectDatesButton = screen.getByRole('button', { name: /select dates/i });
    await act(async () => {
      fireEvent.click(selectDatesButton);
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /bekräfta bokning/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Tack för din bokning!')).toBeInTheDocument();
    });

    // Verify booking service was called
    expect(bookingServiceSupabase.createBooking).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      startDate: expect.any(String),
      endDate: expect.any(String),
      notes: 'Test notes',
      phone: '1234567890'
    });
  });

  it('shows validation errors for empty fields', async () => {
    renderComponent();

    // Submit form without filling in fields
    const submitButton = screen.getByRole('button', { name: /bekräfta bokning/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify validation messages
    await waitFor(() => {
      const nameInput = screen.getByRole('textbox', { name: /namn/i });
      const emailInput = screen.getByRole('textbox', { name: /e-post/i });
      const phoneInput = screen.getByRole('textbox', { name: /telefon/i });

      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Välj ett ankomstdatum')).toBeInTheDocument();
      expect(screen.getByText('Välj ett avresedatum')).toBeInTheDocument();
    });
  });

  it('shows error message on booking failure', async () => {
    // Mock booking service to throw error
    (bookingServiceSupabase.createBooking as jest.Mock).mockRejectedValue(new Error('Booking failed'));

    renderComponent();

    // Fill in form fields
    const nameInput = screen.getByRole('textbox', { name: /namn/i });
    const emailInput = screen.getByRole('textbox', { name: /e-post/i });
    const phoneInput = screen.getByRole('textbox', { name: /telefon/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    });

    // Select dates using the mock calendar
    const selectDatesButton = screen.getByRole('button', { name: /select dates/i });
    await act(async () => {
      fireEvent.click(selectDatesButton);
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /bekräfta bokning/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod när bokningen skulle skapas. Försök igen senare.')).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    renderComponent();

    // Fill in form fields
    const nameInput = screen.getByRole('textbox', { name: /namn/i });
    const emailInput = screen.getByRole('textbox', { name: /e-post/i });
    const phoneInput = screen.getByRole('textbox', { name: /telefon/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    });

    // Select dates using the mock calendar
    const selectDatesButton = screen.getByRole('button', { name: /select dates/i });
    await act(async () => {
      fireEvent.click(selectDatesButton);
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /bekräfta bokning/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Tack för din bokning!')).toBeInTheDocument();
    });

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /gör en ny bokning/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    // Verify form is reset
    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
    });
  });
});