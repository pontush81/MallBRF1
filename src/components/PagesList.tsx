import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pageService from '../services/pageService';
import { Page } from '../types/Page';

const PagesList: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const loadedPages = await pageService.getAllPages();
      setPages(loadedPages);
    } catch (err) {
      setError('Ett fel uppstod vid laddning av sidorna');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = () => {
    navigate('/admin/pages/new');
  };

  const handleEditPage = (id: string) => {
    navigate(`/admin/pages/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    setDeletePageId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePageId) return;

    try {
      await pageService.deletePage(deletePageId);
      setPages(pages.filter(page => page.id !== deletePageId));
    } catch (err) {
      setError('Ett fel uppstod vid borttagning av sidan');
    } finally {
      setDeletePageId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletePageId(null);
  };

  if (loading) {
    return <div data-testid="loading">Laddar...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="pages-list">
      <div className="header">
        <h1>Sidor</h1>
        <button onClick={handleCreatePage}>Skapa ny sida</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Titel</th>
            <th>Status</th>
            <th>Senast uppdaterad</th>
            <th>Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          {pages && pages.length > 0 ? (
            pages.map(page => (
              <tr key={page.id}>
                <td>{page.title}</td>
                <td>{page.isPublished ? 'Publicerad' : 'Ej publicerad'}</td>
                <td>{new Date(page.updatedAt || '').toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditPage(page.id)}>Redigera</button>
                  <button onClick={() => handleDeleteClick(page.id)}>Ta bort</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>Inga sidor hittades</td>
            </tr>
          )}
        </tbody>
      </table>

      {deletePageId && (
        <div className="modal">
          <div className="modal-content">
            <h2>Bekräfta borttagning</h2>
            <p>Är du säker på att du vill ta bort denna sida?</p>
            <div className="modal-actions">
              <button onClick={handleDeleteConfirm}>Ja, ta bort</button>
              <button onClick={handleDeleteCancel}>Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesList; 