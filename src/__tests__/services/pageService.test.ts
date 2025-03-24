import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import pageService from '../../services/pageService';
import { Page, FileInfo } from '../../types/Page';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('../../services/firebase', () => ({
  db: {},
  storage: {}
}));

describe('Page Service', () => {
  const mockPage: Page = {
    id: 'test-page-id',
    title: 'Test Page',
    content: '# Test Content',
    slug: 'test-page',
    isPublished: true,
    show: true,
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockFile: FileInfo = {
    id: 'test-file-id',
    filename: 'test.pdf',
    originalName: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    url: 'https://example.com/test.pdf'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get page by ID', async () => {
    const mockPageDoc = {
      exists: () => true,
      data: () => mockPage
    };

    (doc as jest.Mock).mockReturnValue({});
    (getDoc as jest.Mock).mockResolvedValue(mockPageDoc);

    const result = await pageService.getPageById(mockPage.id);

    expect(doc).toHaveBeenCalledWith(db, 'pages', mockPage.id);
    expect(getDoc).toHaveBeenCalled();
    expect(result).toEqual(mockPage);
  });

  it('should get all pages', async () => {
    const mockQuerySnapshot = {
      docs: [
        { data: () => mockPage },
        { data: () => ({ ...mockPage, id: 'test-page-2' }) }
      ]
    };

    (collection as jest.Mock).mockReturnValue({});
    (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

    const result = await pageService.getAllPages();

    expect(collection).toHaveBeenCalledWith(db, 'pages');
    expect(getDocs).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockPage);
  });

  it('should get visible pages', async () => {
    const mockQuerySnapshot = {
      docs: [
        { data: () => mockPage }
      ]
    };

    (collection as jest.Mock).mockReturnValue({});
    (query as jest.Mock).mockReturnValue({});
    (where as jest.Mock).mockReturnValue({});
    (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

    const result = await pageService.getVisiblePages();

    expect(collection).toHaveBeenCalledWith(db, 'pages');
    expect(query).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('show', '==', true);
    expect(getDocs).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockPage);
  });

  it('should create new page', async () => {
    const { id, createdAt, updatedAt, ...pageData } = mockPage;
    
    (doc as jest.Mock).mockReturnValue({});
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await pageService.createPage(pageData);

    expect(doc).toHaveBeenCalledWith(db, 'pages', expect.any(String));
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      title: mockPage.title,
      content: mockPage.content,
      slug: mockPage.slug,
      isPublished: mockPage.isPublished,
      show: mockPage.show
    }));
    expect(result).toEqual(expect.objectContaining(pageData));
  });

  it('should update page', async () => {
    const updates = {
      title: 'Updated Title',
      content: 'Updated Content'
    };

    const mockUpdatedPage = { ...mockPage, ...updates };
    const mockPageDoc = {
      exists: () => true,
      data: () => mockUpdatedPage
    };

    (doc as jest.Mock).mockReturnValue({});
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue(mockPageDoc);

    const result = await pageService.updatePage(mockPage.id, updates);

    expect(doc).toHaveBeenCalledWith(db, 'pages', mockPage.id);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining(updates));
    expect(result).toEqual(mockUpdatedPage);
  });

  it('should delete page', async () => {
    (doc as jest.Mock).mockReturnValue({});
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await pageService.deletePage(mockPage.id);

    expect(doc).toHaveBeenCalledWith(db, 'pages', mockPage.id);
    expect(deleteDoc).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should upload file', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const mockUploadResult = { ref: {} };
    const mockDownloadURL = 'https://example.com/test.pdf';

    (ref as jest.Mock).mockReturnValue({});
    (uploadBytes as jest.Mock).mockResolvedValue(mockUploadResult);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (doc as jest.Mock).mockReturnValue({});
    (updateDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await pageService.uploadFile(mockPage.id, mockFile);

    expect(ref).toHaveBeenCalledWith(storage, expect.stringContaining('pages'));
    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), mockFile);
    expect(getDownloadURL).toHaveBeenCalled();
    expect(doc).toHaveBeenCalledWith(db, 'pages', mockPage.id);
    expect(updateDoc).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    (getDoc as jest.Mock).mockRejectedValue(error);

    const result = await pageService.getPageById('non-existent-id');
    expect(result).toBeNull();
  });
}); 