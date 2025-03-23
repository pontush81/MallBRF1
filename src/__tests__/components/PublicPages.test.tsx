import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PublicPages from '../../components/PublicPages';
import pageService from '../../services/pageService';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';

// Mock the pageService
jest.mock('../../services/pageService');

describe('PublicPages Component', () => {
  const mockPages = [
    {
      id: '1',
      title: 'Test Page 1',
      content: '# Welcome\n\nThis is a test page.',
      slug: 'test-page-1',
      isPublished: true,
      show: true,
      files: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      title: 'Test Page 2',
      content: '## Information\n\nSome important information.',
      slug: 'test-page-2',
      isPublished: true,
      show: true,
      files: [
        {
          id: 'file1',
          filename: 'test.pdf',
          originalName: 'Test Document.pdf',
          url: 'https://example.com/test.pdf'
        }
      ],
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );
    expect(screen.getByText('Laddar...')).toBeInTheDocument();
  });

  it('renders published and visible pages when loaded', async () => {
    (pageService.getVisiblePages as jest.Mock).mockResolvedValue(mockPages);

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
      expect(screen.getByText('Test Page 2')).toBeInTheDocument();
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });
  });

  it('handles load error and displays error message', async () => {
    (pageService.getVisiblePages as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid laddning av sidorna')).toBeInTheDocument();
    });
  });

  it('renders fallback pages when API fails', async () => {
    (pageService.getVisiblePages as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Välkomstsida')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });
  });

  it('displays file attachments when available', async () => {
    (pageService.getVisiblePages as jest.Mock).mockResolvedValue(mockPages);

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Bilagor')).toBeInTheDocument();
      expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    });
  });

  it('displays empty state when no pages are available', async () => {
    (pageService.getVisiblePages as jest.Mock).mockResolvedValue([]);

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PublicPages />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Inga sidor tillgängliga')).toBeInTheDocument();
    });
  });
}); 