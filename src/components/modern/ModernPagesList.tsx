import React, { useState, useMemo, useEffect } from 'react';
import { Page } from '../../types/Page';

interface ModernPagesListProps {
  pages: Page[];
  onPageClick: (page: Page) => void;
  isLoading?: boolean;
}

export const ModernPagesList: React.FC<ModernPagesListProps> = ({
  pages,
  onPageClick,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Tvinga kortvy på mobil för bättre UX
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setViewMode('cards');
      }
    };

    // Sätt kortvy direkt om vi är på mobil
    handleResize();
    
    // Lyssna på förändringar i skärmstorlek
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter pages based on search term
  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;
    
    const searchLower = searchTerm.toLowerCase();
    return pages.filter((page) => 
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  const truncateContent = (content: string, maxLength: number): string => {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'  
      : cleanContent;
  };

  const formatTextContent = (content: string, maxLength?: number) => {
    let text = content.replace(/<[^>]*>/g, '').trim();
    
    // Trunkera om maxLength är specificerat
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    // Rensa bort ### rubriker och formatera dem separat
    text = text
      .replace(/###\s*([^#]+?)\s*###/g, '$1') // Ta bort ### runt rubriker
      .replace(/####\s*([^#]+?)(?:\s*####)?/g, '$1') // Ta bort #### runt rubriker
      .replace(/\([A-Z]\)/g, '') // Ta bort (B), (A) etc
      .replace(/\s+/g, ' ') // Normalisera mellanslag
      .trim();

    // Dela upp och formatera endast tydliga markeringar
    return text.split(/(\*\*[^*]+\*\*|\*[A-Za-zÅÄÖåäö\s]+\*(?=\s|$|,|\.|:))/g).map((part, index) => {
      // Dubbla asterisker = fetstil (t.ex. **Sommar**)
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} style={{
            fontWeight: '600',
            color: '#111827',
          }}>
            {part.replace(/^\*\*|\*\*$/g, '')}
          </strong>
        );
      }
      // Enkla asterisker = fetstil för ord eller fraser (t.ex. *kolgrill* eller *bruna påsar*)
      else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        const innerText = part.replace(/^\*|\*$/g, '').trim();
        if (innerText && /^[A-Za-zÅÄÖåäö\s]+$/.test(innerText)) {
    return (
            <strong key={index} style={{
              fontWeight: '600',
              color: '#111827',
            }}>
              {innerText}
            </strong>
          );
        }
      }
      // Vanlig text
      return part;
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCardClick = (page: Page, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Om kortet redan är expanderat, stäng det
    if (expandedCard === page.id) {
      setExpandedCard(null);
      return;
    }
    
    // Expandera det klickade kortet på plats
    setExpandedCard(page.id);
  };

  // VANILLA CSS VERSION - Inga MUI komponenter som kan lägga till spacing!
  return (
    <div style={{ 
      margin: 0, 
      padding: 0,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    }}>
      {/* Utility Bar - Vanilla CSS */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 0',
        margin: 0,
      }}>
        <div 
          className="utility-bar-content"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          {/* Search Field */}
          <div className="search-field" style={{ display: 'flex', alignItems: 'center', minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Sök information..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '8px 12px 8px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <svg 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#6b7280'
                }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* View Toggle - Endast på desktop */}
          <div className="toggle-buttons" style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                backgroundColor: viewMode === 'cards' ? '#dbeafe' : '#ffffff',
                color: viewMode === 'cards' ? '#1e40af' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📱 Kort
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '0 8px 8px 0',
                backgroundColor: viewMode === 'list' ? '#dbeafe' : '#ffffff',
                color: viewMode === 'list' ? '#1e40af' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📋 Lista
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Direkt under utility bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
      }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '32px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : (
          <>
            {/* Search Results */}
            {searchTerm && (
              <div style={{ 
                  textAlign: 'center',
                margin: '16px 0',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                {filteredPages.length} av {pages.length} dokument
              </div>
            )}

            {/* Cards Grid or List View */}
            {viewMode === 'cards' ? (
              // Card View
              <div className="cards-grid">
                {filteredPages.map((page) => {
                  const isExpanded = expandedCard === page.id;
                  
                return (
                  <div
                    key={page.id}
                    id={`card-${page.id}`}
                    onClick={(e) => handleCardClick(page, e)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: `2px solid ${isExpanded ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isExpanded ? '0 10px 25px -3px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                      gridColumn: isExpanded ? '1 / -1' : 'auto', // Ta full bredd när expanderat
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    {/* Title */}
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: isExpanded ? '24px' : '18px',
                      fontWeight: '600',
                      color: '#111827',
                      lineHeight: '1.25',
                      transition: 'font-size 0.3s ease',
                    }}>
                      {page.title}
                    </h3>

                    {/* Content */}
                    <div style={{
                      margin: '0 0 16px 0',
                      fontSize: isExpanded ? '16px' : '14px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      flexGrow: 1,
                      transition: 'font-size 0.3s ease',
                    }}>
                      {isExpanded ? (
                        // Expanderat innehåll - visa allt innehåll med formatering
                        <div>
                          <div 
                            className="expanded-content"
                            style={{ 
                              margin: '0 0 16px 0',
                              lineHeight: '1.7',
                              fontSize: '15px',
                              color: '#374151',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {/* Formatera strukturerat innehåll */}
                            {page.content
                              .replace(/<[^>]*>/g, '') // Ta bort HTML-taggar
                              .split('\n')
                              .map((line, index) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;
                                
                                // ### Huvudrubriker (H2-stil)
                                if (trimmed.match(/^###\s+[^#]/)) {
                                  return (
                                    <h2 key={index} style={{
                                      fontSize: '20px',
                                      fontWeight: '700',
                                      color: '#111827',
                                      margin: '24px 0 16px 0',
                                      lineHeight: '1.2',
                                      borderBottom: '2px solid #e5e7eb',
                                      paddingBottom: '8px',
                                    }}>
                                      {trimmed.replace(/^###\s*/, '')}
                                    </h2>
                                  );
                                }
                                
                                // #### Underrubriker (H3-stil)
                                if (trimmed.match(/^####\s+/)) {
                                  return (
                                    <h3 key={index} style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#111827',
                                      margin: '20px 0 12px 0',
                                      lineHeight: '1.3',
                                    }}>
                                      {trimmed.replace(/^####\s*/, '')}
                                    </h3>
                                  );
                                }
                                
                                // Listpunkter som börjar med -
                                if (trimmed.startsWith('- ')) {
                                  return (
                                    <div key={index} style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      margin: '8px 0',
                                      paddingLeft: '16px',
                                    }}>
                                      <span style={{
                                        color: '#6b7280',
                                        marginRight: '8px',
                                        fontSize: '14px',
                                      }}>
                                        •
                                      </span>
                                      <span style={{
                                        color: '#374151',
                                        lineHeight: '1.5',
                                      }}>
                                        {trimmed.substring(2).replace(/\([A-Z]\)/g, '').trim()}
                                      </span>
                                    </div>
                                  );
                                }
                                
                                // **Rubriker med dubbla asterisker**
                                if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                                  return (
                                    <h3 key={index} style={{
                                      fontSize: '18px',
                                      fontWeight: '600',
                                      color: '#111827',
                                      margin: '20px 0 12px 0',
                                      lineHeight: '1.3',
                                    }}>
                                      {trimmed.replace(/^\*\*|\*\*$/g, '')}
                                    </h3>
                                  );
                                }
                                
                                // Vanlig paragraf
                                return (
                                  <p key={index} style={{
                                    margin: '12px 0',
                                    lineHeight: '1.6',
                                    color: '#374151',
                                  }}>
                                    {trimmed}
                                  </p>
                                );
                              })
                              .filter(Boolean)}
                          </div>
                        </div>
                      ) : (
                        // Kompakt innehåll med formatering
                        <p style={{ margin: 0 }}>
                          {formatTextContent(page.content, 120)}
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                              display: 'flex', 
                      alignItems: 'center',
                              justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: '1px solid #f3f4f6',
                    }}>
                      <div style={{
                                display: 'flex', 
                                alignItems: 'center', 
                        gap: '8px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        🕒 {formatDate(page.updatedAt)}
                      </div>
                      
                      <div style={{
                        fontSize: '12px',
                        color: isExpanded ? '#ef4444' : '#3b82f6',
                        fontWeight: '500',
                      }}>
                        {isExpanded ? '✕ Stäng' : '↗ Expandera'}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              // List View - Expanderade kort i vertikal lista
              <div style={{ marginTop: '16px' }}>
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => onPageClick(page)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {/* Expanderat kort innehåll */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}>
                      {/* Title */}
                      <h3 style={{
                        margin: '0',
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#111827',
                        lineHeight: '1.25',
                      }}>
                          {page.title}
                      </h3>

                      {/* Full content - mer text än i kortvy */}
                      <div style={{
                        margin: '0',
                        fontSize: '15px',
                        color: '#6b7280',
                        lineHeight: '1.6',
                      }}>
                        {formatTextContent(page.content, 200)}
                      </div>

                      {/* Footer med datum och eventuell extra info */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '16px',
                        borderTop: '1px solid #f3f4f6',
                      }}>
                        <div style={{
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: '#9ca3af',
                        }}>
                          🕒 {formatDate(page.updatedAt)}
                        </div>
                        
                        {/* Klick-indikator */}
                        <div style={{
                          fontSize: '12px',
                          color: '#3b82f6',
                          fontWeight: '500',
                        }}>
                          Klicka för att läsa mer →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredPages.length === 0 && searchTerm && (
              <div style={{ 
                textAlign: 'center', 
                padding: '64px 16px',
                color: '#6b7280'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  marginBottom: '8px',
                  color: '#6b7280'
                }}>
                  Inga resultat hittades
                </h3>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    Prova att söka på något annat
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS Animation och Responsive Design */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .cards-grid {
          display: grid;
          gap: 24px;
          margin-top: 16px;
          grid-template-columns: 1fr;
        }
        
        @media (min-width: 640px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          }
        }
        
        @media (min-width: 1024px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }
        
        .utility-bar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        
                @media (max-width: 640px) {
          .utility-bar-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          
          .search-field {
            min-width: 100% !important;
          }
          
          .toggle-buttons {
            display: none !important; /* Dölj toggle-knappar på mobil */
          }
        }
      
      /* Styling för HTML-innehåll i expanderade kort */
      .expanded-content h1, .expanded-content h2, .expanded-content h3, 
      .expanded-content h4, .expanded-content h5, .expanded-content h6 {
        color: #111827;
        font-weight: 600;
        margin: 16px 0 8px 0;
        line-height: 1.25;
      }
      
      .expanded-content h1 { font-size: 24px; }
      .expanded-content h2 { font-size: 20px; }
      .expanded-content h3 { font-size: 18px; }
      .expanded-content h4 { font-size: 16px; }
      
      .expanded-content p {
        margin: 12px 0;
        color: #374151;
        line-height: 1.6;
      }
      
      .expanded-content ul, .expanded-content ol {
        margin: 12px 0;
        padding-left: 24px;
        color: #374151;
      }
      
      .expanded-content li {
        margin: 4px 0;
        line-height: 1.5;
      }
      
      .expanded-content strong, .expanded-content b {
        font-weight: 600;
        color: #111827;
      }
      
      .expanded-content em, .expanded-content i {
        font-style: italic;
      }
      
      .expanded-content a {
        color: #3b82f6;
        text-decoration: underline;
      }
      
      .expanded-content a:hover {
        color: #2563eb;
      }
      
      .expanded-content blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 16px;
        margin: 16px 0;
        font-style: italic;
        color: #6b7280;
      }
      
      .expanded-content code {
        background-color: #f3f4f6;
        padding: 2px 4px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 14px;
      }
      `}</style>
    </div>
  );
}; 