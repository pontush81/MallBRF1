import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageEditor from '../../components/PageEditor';
import pageServiceSupabase from '../../services/pageServiceSupabase';
import { Page } from '../../types/Page';

// Mock the pageServiceSupabase
jest.mock('../../services/pageServiceSupabase');

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
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
  });

  it('renders loading state initially', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders page data when loaded', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Page')).toBeInTheDocument();
      expect(screen.getByDisplayValue('# Test Content\n\nThis is a test page.')).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('handles page not found', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(null);
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Sidan kunde inte hittas')).toBeInTheDocument();
    });
  });

  it('handles load error', async () => {
    const error = new Error('Failed to load page');
    (pageServiceSupabase.getPageById as jest.Mock).mockRejectedValue(error);
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid laddning av sidan')).toBeInTheDocument();
    });
  });

  it('updates page successfully', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageServiceSupabase.updatePage as jest.Mock).mockResolvedValue({ ...mockPage, title: 'Updated Title' });
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Titel')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Titel'), { target: { value: 'Updated Title' } });
    fireEvent.click(screen.getByText('Spara'));

    await waitFor(() => {
      expect(pageServiceSupabase.updatePage).toHaveBeenCalledWith('1', {
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
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageServiceSupabase.updatePage as jest.Mock).mockRejectedValue(new Error('Failed to update page'));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

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
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const uploadedFile = {
      id: '1',
      filename: 'test.txt',
      originalName: 'test.txt',
      mimetype: 'text/plain',
      size: 1024
    };
    
    (pageServiceSupabase.uploadFile as jest.Mock).mockResolvedValue(uploadedFile);
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Ladda upp fil')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Ladda upp fil'), { 
        target: { files: [file] } 
      });
    });

    await waitFor(() => {
      expect(pageServiceSupabase.uploadFile).toHaveBeenCalledWith('1', file);
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('handles file upload error', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageServiceSupabase.uploadFile as jest.Mock).mockRejectedValue(new Error('Failed to upload file'));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

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
    
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(pageWithFile);
    (pageServiceSupabase.deleteFile as jest.Mock).mockResolvedValue(true);
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Ta bort'));
    });

    await waitFor(() => {
      expect(pageServiceSupabase.deleteFile).toHaveBeenCalledWith('1', '1');
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });
  });

  it('handles file deletion error', async () => {
    (pageServiceSupabase.getPageById as jest.Mock).mockResolvedValue(mockPage);
    (pageServiceSupabase.deleteFile as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PageEditor />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-file-button');
    
    await act(async () => {
      deleteButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Ett fel uppstod vid borttagning av filen')).toBeInTheDocument();
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });
}); 