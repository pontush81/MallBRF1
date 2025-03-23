import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PagesList from '../../components/PagesList';
import pageService from '../../services/pageService';
import { Page } from '../../types/Page';

// Mock the pageService
jest.mock('../../services/pageService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('PagesList Component', () => {
  const mockPages: Page[] = [
    {
      id: '1',
      title: 'Test Page 1',
      content: '# Test Content 1',
      slug: 'test-page-1',
      isPublished: true,
      show: true,
      createdAt: '2024-03-23T12:00:00Z',
      updatedAt: '2024-03-23T12:00:00Z',
      files: []
    },
    {
      id: '2',
      title: 'Test Page 2',
      content: '# Test Content 2',
      slug: 'test-page-2',
      isPublished: false,
      show: true,
      createdAt: '2024-03-23T13:00:00Z',
      updatedAt: '2024-03-23T13:00:00Z',
      files: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (pageService.getAllPages as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    expect(screen.getByText('Laddar...')).toBeInTheDocument();
  });

  it('renders pages when loaded', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
      expect(screen.getByText('Test Page 2')).toBeInTheDocument();
      expect(screen.getByText('Publicerad')).toBeInTheDocument();
      expect(screen.getByText('Ej publicerad')).toBeInTheDocument();
    });
  });

  it('handles load error', async () => {
    (pageService.getAllPages as jest.Mock).mockRejectedValue(new Error('Failed to load pages'));
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid laddning av sidorna')).toBeInTheDocument();
    });
  });

  it('navigates to create page when clicking create button', () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Skapa ny sida'));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/pages/new');
  });

  it('navigates to edit page when clicking edit button', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Redigera');
    fireEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/pages/1/edit');
  });

  it('handles page deletion', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    (pageService.deletePage as jest.Mock).mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Ta bort');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(pageService.deletePage).toHaveBeenCalledWith('1');
      expect(screen.queryByText('Test Page 1')).not.toBeInTheDocument();
    });
  });

  it('handles deletion error', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    (pageService.deletePage as jest.Mock).mockRejectedValue(new Error('Failed to delete page'));
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Ta bort');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid borttagning av sidan')).toBeInTheDocument();
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog before deletion', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    (pageService.deletePage as jest.Mock).mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Ta bort');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Är du säker på att du vill ta bort denna sida?')).toBeInTheDocument();
    expect(screen.getByText('Ja, ta bort')).toBeInTheDocument();
    expect(screen.getByText('Avbryt')).toBeInTheDocument();
  });

  it('cancels deletion when clicking cancel', async () => {
    (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);
    (pageService.deletePage as jest.Mock).mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <PagesList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Page 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Ta bort');
    fireEvent.click(deleteButtons[0]);

    fireEvent.click(screen.getByText('Avbryt'));

    await waitFor(() => {
      expect(pageService.deletePage).not.toHaveBeenCalled();
      expect(screen.queryByText('Är du säker på att du vill ta bort denna sida?')).not.toBeInTheDocument();
    });
  });
}); 