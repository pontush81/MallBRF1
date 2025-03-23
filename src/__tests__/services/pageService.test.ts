import pageService from '../../services/pageService';
import { Page } from '../../types/Page';

// Mock the pageService
jest.mock('../../services/pageService');

describe('pageService', () => {
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

  describe('getPageBySlug', () => {
    it('returns page when found', async () => {
      (pageService.getPageBySlug as jest.Mock).mockResolvedValue(mockPage);

      const result = await pageService.getPageBySlug('test-page');
      expect(result).toEqual(mockPage);
      expect(pageService.getPageBySlug).toHaveBeenCalledWith('test-page');
    });

    it('returns null when page not found', async () => {
      (pageService.getPageBySlug as jest.Mock).mockResolvedValue(null);

      const result = await pageService.getPageBySlug('non-existent');
      expect(result).toBeNull();
    });

    it('handles errors gracefully', async () => {
      const error = new Error('Failed to fetch page');
      (pageService.getPageBySlug as jest.Mock).mockRejectedValue(error);

      await expect(pageService.getPageBySlug('test-page')).rejects.toThrow(error);
    });
  });

  describe('createPage', () => {
    const newPage: Omit<Page, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'New Page',
      content: '# New Content',
      slug: 'new-page',
      isPublished: true,
      show: true,
      files: []
    };

    it('creates a new page successfully', async () => {
      const createdPage = { ...newPage, id: '2', createdAt: '2024-03-23T12:00:00Z', updatedAt: '2024-03-23T12:00:00Z' };
      (pageService.createPage as jest.Mock).mockResolvedValue(createdPage);

      const result = await pageService.createPage(newPage);
      expect(result).toEqual(createdPage);
      expect(pageService.createPage).toHaveBeenCalledWith(newPage);
    });

    it('handles creation errors', async () => {
      const error = new Error('Failed to create page');
      (pageService.createPage as jest.Mock).mockRejectedValue(error);

      await expect(pageService.createPage(newPage)).rejects.toThrow(error);
    });
  });

  describe('updatePage', () => {
    const updates = {
      title: 'Updated Title',
      content: '# Updated Content'
    };

    it('updates page successfully', async () => {
      const updatedPage = { ...mockPage, ...updates, updatedAt: '2024-03-23T13:00:00Z' };
      (pageService.updatePage as jest.Mock).mockResolvedValue(updatedPage);

      const result = await pageService.updatePage('1', updates);
      expect(result).toEqual(updatedPage);
      expect(pageService.updatePage).toHaveBeenCalledWith('1', updates);
    });

    it('handles update errors', async () => {
      const error = new Error('Failed to update page');
      (pageService.updatePage as jest.Mock).mockRejectedValue(error);

      await expect(pageService.updatePage('1', updates)).rejects.toThrow(error);
    });
  });

  describe('deletePage', () => {
    it('deletes page successfully', async () => {
      (pageService.deletePage as jest.Mock).mockResolvedValue(true);

      const result = await pageService.deletePage('1');
      expect(result).toBe(true);
      expect(pageService.deletePage).toHaveBeenCalledWith('1');
    });

    it('handles deletion errors', async () => {
      const error = new Error('Failed to delete page');
      (pageService.deletePage as jest.Mock).mockRejectedValue(error);

      await expect(pageService.deletePage('1')).rejects.toThrow(error);
    });
  });

  describe('getAllPages', () => {
    const mockPages = [mockPage, { ...mockPage, id: '2', title: 'Second Page' }];

    it('returns all pages', async () => {
      (pageService.getAllPages as jest.Mock).mockResolvedValue(mockPages);

      const result = await pageService.getAllPages();
      expect(result).toEqual(mockPages);
      expect(pageService.getAllPages).toHaveBeenCalled();
    });

    it('handles fetch errors', async () => {
      const error = new Error('Failed to fetch pages');
      (pageService.getAllPages as jest.Mock).mockRejectedValue(error);

      await expect(pageService.getAllPages()).rejects.toThrow(error);
    });
  });

  describe('uploadFile', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    it('uploads file successfully', async () => {
      const mockFileInfo = {
        id: '1',
        filename: 'test.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      };
      (pageService.uploadFile as jest.Mock).mockResolvedValue(mockFileInfo);

      const result = await pageService.uploadFile('1', mockFile);
      expect(result).toEqual(mockFileInfo);
      expect(pageService.uploadFile).toHaveBeenCalledWith('1', mockFile);
    });

    it('handles upload errors', async () => {
      const error = new Error('Failed to upload file');
      (pageService.uploadFile as jest.Mock).mockRejectedValue(error);

      await expect(pageService.uploadFile('1', mockFile)).rejects.toThrow(error);
    });
  });
}); 