import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pageService from '../services/pageService';
import { Page } from '../types/Page';
import '../styles/PageEditor.css';

const PageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    isPublished: false,
    show: false
  });

  useEffect(() => {
    const loadPage = async () => {
      try {
        if (!id) {
          setError('Inget sid-ID angivet');
          setLoading(false);
          return;
        }

        const loadedPage = await pageService.getPageById(id);
        if (!loadedPage) {
          setError('Sidan kunde inte hittas');
          setLoading(false);
          return;
        }

        setPage(loadedPage);
        setFormData({
          title: loadedPage.title,
          content: loadedPage.content,
          slug: loadedPage.slug,
          isPublished: loadedPage.isPublished,
          show: loadedPage.show
        });
      } catch (err) {
        setError('Ett fel uppstod vid laddning av sidan');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id) return;

      const updatedPage = await pageService.updatePage(id, formData);
      if (updatedPage) {
        navigate('/admin/pages');
      } else {
        setError('Kunde inte uppdatera sidan');
      }
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av sidan');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Starting file upload for:', file.name);
      const response = await pageService.uploadFile(id, file);
      console.log('Upload response:', response);

      if (!response || !response.success || !response.file) {
        throw new Error('Kunde inte ladda upp filen: Ogiltig svarsdata');
      }

      // Kontrollera att filobjektet har alla nödvändiga fält
      const fileData = response.file;
      console.log('File data received:', fileData);

      // Vänta en kort stund för att låta Supabase processa filen
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Hämta den uppdaterade sidan
      console.log('Fetching updated page data');
      const updatedPage = await pageService.getPageById(id);
      console.log('Updated page data:', updatedPage);

      if (!updatedPage) {
        throw new Error('Kunde inte uppdatera sidan med den nya filen');
      }

      // Säkerställ att files-arrayen är giltig
      if (!updatedPage.files) {
        updatedPage.files = [];
      } else if (!Array.isArray(updatedPage.files)) {
        updatedPage.files = [];
      }

      // Skapa en säker kopia av sidan med validerade filobjekt
      const safePage = {
        ...updatedPage,
        files: updatedPage.files.map(f => {
          // Om f är null eller undefined, skapa ett tomt filobjekt
          if (!f) return null;
          
          return {
            id: f.id || String(Date.now()),
            filename: f.filename || 'unknown',
            originalName: f.originalName || f.filename || 'Namnlös fil',
            mimetype: f.mimetype || 'application/octet-stream',
            size: typeof f.size === 'number' ? f.size : 0,
            url: typeof f.url === 'string' ? f.url : '',
            uploadedAt: f.uploadedAt || new Date().toISOString()
          };
        }).filter(Boolean) // Ta bort eventuella null-värden
      };

      console.log('Setting safe page:', safePage);
      setPage(safePage);
      setError(null);
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid uppladdning av filen');
    } finally {
      setLoading(false);
      // Rensa filinputen
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!id) return;

    try {
      const success = await pageService.deleteFile(id, fileId);
      if (success && page) {
        setPage({
          ...page,
          files: page.files?.filter(f => f.id !== fileId) || []
        });

        const updatedPage = await pageService.getPageById(id);
        if (updatedPage) {
          setPage(updatedPage);
        }

        setError(null);
      } else {
        setError('Kunde inte ta bort filen');
      }
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av filen');
    }
  };

  if (loading) {
    return <div data-testid="loading">Laddar...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!page) {
    return <div>Sidan kunde inte hittas</div>;
  }

  return (
    <div className="page-editor">
      <h1>Redigera sida</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Titel</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Innehåll</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={10}
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">Slug</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
            />
            Publicerad
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="show"
              checked={formData.show}
              onChange={handleInputChange}
            />
            Visa i sidlistan
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="file">Ladda upp fil</label>
          <input
            type="file"
            id="file"
            onChange={handleFileUpload}
          />
        </div>

        {page.files && Array.isArray(page.files) && page.files.length > 0 && (
          <div className="files-list">
            <h3>Uppladdade filer</h3>
            <ul>
              {page.files.filter(file => file && typeof file === 'object').map(file => {
                // Säkerställ att alla nödvändiga fält finns
                const fileId = String(file.id || Date.now());
                const fileName = String(file.originalName || file.filename || 'Namnlös fil');
                const fileSize = typeof file.size === 'number' ? Math.round(file.size / 1024) : 0;
                // Konvertera url till en säker sträng
                const fileUrl = typeof file.url === 'string' ? file.url : '';

                return (
                  <li key={fileId} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{fileName}</span>
                      <span className="file-size">({fileSize} KB)</span>
                    </div>
                    <div className="file-actions">
                      {fileUrl && (
                        <button 
                          type="button"
                          onClick={() => {
                            try {
                              window.open(fileUrl, '_blank');
                            } catch (err) {
                              console.error('Could not open file:', err);
                            }
                          }}
                          className="download-link"
                        >
                          Ladda ner
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleFileDelete(fileId)}
                        className="delete-button"
                      >
                        Ta bort
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="form-actions">
          <button type="submit">Spara</button>
          <button
            type="button"
            onClick={() => navigate('/admin/pages')}
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
};

export default PageEditor; 