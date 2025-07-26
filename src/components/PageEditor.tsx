import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pageServiceSupabase from '../services/pageServiceSupabase';
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

        const loadedPage = await pageServiceSupabase.getPageById(id);
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

      const updatedPage = await pageServiceSupabase.updatePage(id, formData);
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
      const response = await pageServiceSupabase.uploadFile(id, file);
      console.log('Upload response:', response);

      if (!response || !response.originalName || !response.url) {
        throw new Error('Kunde inte ladda upp filen: Ogiltig svarsdata');
      }

      console.log('File uploaded successfully:', response.originalName);
      alert(`Filen "${response.originalName}" har laddats upp framgångsrikt!`);

      // Rensa fil-inputen
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

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
      await pageServiceSupabase.deleteFile(id, fileId);
      
      if (page) {
        setPage({
          ...page,
          files: page.files?.filter(f => f.id !== fileId) || []
        });
      }

      alert('Filen har raderats framgångsrikt!');
      setError(null);
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