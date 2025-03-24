import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
      title: 'Welcome',
      content: 'This is a test page',
      published: true,
      visible: true,
      fileAttachments: []
    },
    {
      id: '2',
      title: 'Information',
      content: 'Some important information',
      published: true,
      visible: true,
      fileAttachments: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (pageService.getVisiblePages as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <PublicPages />
          </BrowserRouter>
        </ThemeProvider>
      );
    });

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders published and visible pages when loaded', async () => {
    const mockPages = [
      {
        id: '1',
        title: 'Welcome',
        content: 'This is a test page',
        slug: 'welcome',
        isPublished: true,
        show: true,
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Information',
        content: 'Some important information',
        slug: 'information',
        isPublished: true,
        show: true,
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (pageService.getVisiblePages as jest.Mock).mockResolvedValue(mockPages);

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <PublicPages />
          </BrowserRouter>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('This is a test page')).toBeInTheDocument();
      expect(screen.getByText('Some important information')).toBeInTheDocument();
    });
  });

  it('renders fallback pages when API fails', async () => {
    (pageService.getVisiblePages as jest.Mock).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <PublicPages />
          </BrowserRouter>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Välkomstsida')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });
  });

  it('displays file attachments when available', async () => {
    const mockPages = [
      {
        id: '1',
        title: 'Welcome',
        content: 'This is a test page',
        slug: 'welcome',
        isPublished: true,
        show: true,
        files: [
          {
            id: '1',
            filename: 'test.pdf',
            originalName: 'test.pdf',
            url: 'https://example.com/test.pdf'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    (pageService.getVisiblePages as jest.Mock).mockResolvedValue(mockPages);

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <PublicPages />
          </BrowserRouter>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Bilagor')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
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