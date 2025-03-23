import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageEditor from '../../components/PageEditor';
import pageService from '../../services/pageService';
import { Page } from '../../types/Page';

// Mock the pageService
jest.mock('../../services/pageService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' })
}));

describe('PageEditor Component', () => {
  const mockPage: Page = {
    id: '1',
    title: 'Test Page',
    content: '# Test Content\n\nThis is a test page.',
    slug: 'test-page',
    isPublished: true,
    show: true,
    createdAt: '2024-03-23T12:00:00Z',
    updatedAt: '2024-03-23T12:00:00Z',
    files: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (pageService.getPageById as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    expect(screen.getByText('Laddar...')).toBeInTheDocument();
  });

  it('renders page data when loaded', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(mockPage);
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Titel')).toHaveValue('Test Page');
      expect(screen.getByLabelText('Innehåll')).toHaveValue('# Test Content\n\nThis is a test page.');
      expect(screen.getByLabelText('Slug')).toHaveValue('test-page');
      expect(screen.getByLabelText('Publicerad')).toBeChecked();
      expect(screen.getByLabelText('Visa i sidlistan')).toBeChecked();
    });
  });

  it('handles page not found', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(null);
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sidan kunde inte hittas')).toBeInTheDocument();
    });
  });

  it('handles load error', async () => {
    const error = new Error('Failed to load page');
    (pageService.getPageById as jest.Mock).mockRejectedValue(error);
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid laddning av sidan')).toBeInTheDocument();
    });
  });

  it('updates page successfully', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageService.updatePage as jest.Mock).mockResolvedValue({ ...mockPage, title: 'Updated Title' });
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Titel')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Titel'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('Spara'));

    await waitFor(() => {
      expect(pageService.updatePage).toHaveBeenCalledWith('1', {
        title: 'Updated Title',
        content: '# Test Content\n\nThis is a test page.',
        slug: 'test-page',
        isPublished: true,
        show: true
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/pages');
    });
  });

  it('handles update error', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageService.updatePage as jest.Mock).mockRejectedValue(new Error('Failed to update page'));
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Titel')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Titel'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('Spara'));

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid uppdatering av sidan')).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageService.uploadFile as jest.Mock).mockResolvedValue({
      id: '1',
      filename: 'test.txt',
      originalName: 'test.txt',
      mimetype: 'text/plain',
      size: 1024
    });
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Ladda upp fil')).toBeInTheDocument();
    });

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Ladda upp fil'), { target: { files: [file] } });

    await waitFor(() => {
      expect(pageService.uploadFile).toHaveBeenCalledWith('1', file);
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('handles file upload error', async () => {
    (pageService.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageService.uploadFile as jest.Mock).mockRejectedValue(new Error('Failed to upload file'));
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Ladda upp fil')).toBeInTheDocument();
    });

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Ladda upp fil'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid uppladdning av filen')).toBeInTheDocument();
    });
  });

  it('handles file deletion', async () => {
    const pageWithFile = {
      ...mockPage,
      files: [{
        id: '1',
        filename: 'test.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      }]
    };
    (pageService.getPageById as jest.Mock).mockResolvedValue(pageWithFile);
    (pageService.deleteFile as jest.Mock).mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ta bort'));

    await waitFor(() => {
      expect(pageService.deleteFile).toHaveBeenCalledWith('1', '1');
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });
  });

  it('handles file deletion error', async () => {
    const pageWithFile = {
      ...mockPage,
      files: [{
        id: '1',
        filename: 'test.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      }]
    };
    (pageService.getPageById as jest.Mock).mockResolvedValue(pageWithFile);
    (pageService.deleteFile as jest.Mock).mockRejectedValue(new Error('Failed to delete file'));
    
    render(
      <BrowserRouter>
        <PageEditor />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Ta bort'));

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid borttagning av filen')).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });
}); 