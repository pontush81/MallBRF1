import React from 'react';

interface ItemListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: T, index: number) => void;
}

function ItemList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'Inga objekt att visa',
  loading = false,
  loadingComponent = <div className="loading">Laddar...</div>,
  header,
  footer,
  className = '',
  itemClassName = '',
  onItemClick,
}: ItemListProps<T>) {
  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!items.length) {
    return <div className="empty-list-message">{emptyMessage}</div>;
  }

  return (
    <div className={`item-list ${className}`}>
      {header && <div className="item-list-header">{header}</div>}
      
      <div className="item-list-content">
        {items.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className={`item-list-item ${itemClassName}`}
            onClick={onItemClick ? () => onItemClick(item, index) : undefined}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {footer && <div className="item-list-footer">{footer}</div>}
    </div>
  );
}

export default ItemList; 