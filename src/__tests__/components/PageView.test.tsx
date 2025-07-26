import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PageView from '../../pages/public/PageView';
import pageServiceSupabase from '../../services/pageServiceSupabase';

// Mock the pageServiceSupabase
jest.mock('../../services/pageServiceSupabase');

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: 'test-page' })
}));

describe('PageView Component', () => {
  const mockPage = {
    id: '1',
    title: 'Test Page',
    content: '# Test Content\n\nThis is a test page.',
    slug: 'test-page',
    createdAt: '2024-03-23T12:00:00Z',
    updatedAt: '2024-03-23T12:00:00Z',
    files: []
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the pageServiceSupabase.getPageBySlug function
    (pageServiceSupabase.getPageBySlug as jest.Mock).mockResolvedValue(mockPage);
  });

  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <PageView />
      </BrowserRouter>
    );

    // Check for loading indicators
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders page content when loaded', async () => {
    render(
      <BrowserRouter>
        <PageView />
      </BrowserRouter>
    );

    // Wait for the page content to load
    const title = await screen.findByText('Test Page');
    expect(title).toBeInTheDocument();

    // Check if markdown content is rendered
    const content = await screen.findByText('Test Content');
    expect(content).toBeInTheDocument();
  });

  it('displays error message when page loading fails', async () => {
    // Mock the pageServiceSupabase to throw an error
    (pageServiceSupabase.getPageBySlug as jest.Mock).mockRejectedValue(new Error('Failed to load page'));

    render(
      <BrowserRouter>
        <PageView />
      </BrowserRouter>
    );

    // Wait for error message
    const errorMessage = await screen.findByText(/Failed to load page/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    render(
      <BrowserRouter>
        <PageView />
      </BrowserRouter>
    );

    // Wait for the page to load
    await screen.findByText('Test Page');

    // Find and click the back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    // Check if navigate was called
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('displays file attachments when available', async () => {
    const pageWithFiles = {
      ...mockPage,
      files: [
        {
          id: '1',
          filename: 'test.pdf',
          originalName: 'Test Document.pdf',
          mimetype: 'application/pdf',
          size: 1024
        }
      ]
    };

    (pageServiceSupabase.getPageBySlug as jest.Mock).mockResolvedValue(pageWithFiles);

    render(
      <BrowserRouter>
        <PageView />
      </BrowserRouter>
    );

    // Wait for the page to load
    await screen.findByText('Test Page');

    // Check if file attachment is displayed
    const fileAttachment = await screen.findByText('Test Document.pdf');
    expect(fileAttachment).toBeInTheDocument();
  });
}); 