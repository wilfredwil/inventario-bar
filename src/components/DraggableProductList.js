// src/components/DraggableProductList.js
import React, { useState } from 'react';
import { Table, Badge, Button, ButtonGroup } from 'react-bootstrap';
import { FaGripVertical, FaStar, FaRegStar, FaEdit, FaTrash } from 'react-icons/fa';

function DraggableProductList({ 
  items, 
  providers, 
  onEdit, 
  onDelete, 
  onToggleImportant,
  onReorder 
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
    
    // Añadir efecto visual
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.classList.remove('dragging');
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem !== null && draggedItem !== index) {
      setDraggedOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      return;
    }

    // Crear copia del array
    const newItems = [...items];
    
    // Remover el item arrastrado
    const [removed] = newItems.splice(draggedItem, 1);
    
    // Insertar en la nueva posición
    newItems.splice(dropIndex, 0, removed);
    
    // Llamar al callback con el nuevo orden
    onReorder(newItems);
    
    setDraggedOverIndex(null);
  };

  const getStockBadge = (item) => {
    if (item.stock === 0) {
      return <Badge bg="danger">Sin Stock</Badge>;
    }
    if (item.stock <= (item.umbral_low || 5)) {
      return <Badge bg="warning" text="dark">Stock Bajo</Badge>;
    }
    return <Badge bg="success">OK</Badge>;
  };

  return (
    <div className="table-responsive">
      <Table hover className="mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: '50px', padding: '1rem 0.75rem' }}></th>
            <th style={{ width: '60px', padding: '1rem 1rem' }}></th>
            <th style={{ padding: '1rem 1.25rem' }}>Producto</th>
            <th style={{ padding: '1rem 1.25rem' }}>Categoría</th>
            <th className="text-center" style={{ padding: '1rem 1.25rem' }}>Stock</th>
            <th style={{ padding: '1rem 1.25rem' }}>Proveedor</th>
            <th className="text-center" style={{ padding: '1rem 1.25rem' }}>Estado</th>
            <th className="text-end" style={{ padding: '1rem 1.25rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center text-muted py-4">
                No se encontraron productos
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const provider = providers?.find(p => p.id === item.proveedor_id);
              const isDraggingOver = draggedOverIndex === index && draggedItem !== index;
              
              return (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`draggable-row ${isDraggingOver ? 'drag-over' : ''} ${item.importante ? 'important-product' : ''}`}
                  style={{
                    cursor: 'move',
                    transition: 'all 0.2s ease',
                    backgroundColor: isDraggingOver ? 'rgba(99, 102, 241, 0.1)' : undefined
                  }}
                >
                  {/* Handle para arrastrar */}
                  <td className="text-center drag-handle" style={{ padding: '1rem 0.75rem' }}>
                    <FaGripVertical 
                      className="text-muted" 
                      style={{ cursor: 'grab' }}
                      title="Arrastra para reordenar"
                    />
                  </td>

                  {/* Estrella importante */}
                  <td className="text-center" style={{ padding: '1rem 1rem' }}>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onToggleImportant(item)}
                      className="p-0"
                    >
                      {item.importante ? 
                        <FaStar className="text-warning" /> : 
                        <FaRegStar className="text-muted" />
                      }
                    </Button>
                  </td>

                  {/* Producto */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div>
                      <strong>{item.marca ? `${item.marca} - ` : ''}{item.nombre}</strong>
                    </div>
                    {item.codigo_barras && (
                      <small className="text-muted">
                        Código: {item.codigo_barras}
                      </small>
                    )}
                  </td>

                  {/* Categoría */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Badge bg="secondary">
                      {item.tipo ? item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1) : 'N/A'}
                    </Badge>
                  </td>

                  {/* Stock */}
                  <td className="text-center" style={{ padding: '1rem 1.25rem' }}>
                    <strong 
                      style={{ 
                        color: item.stock === 0 ? '#dc3545' : 
                               item.stock <= (item.umbral_low || 5) ? '#ffc107' : '#28a745',
                        fontSize: '1.1rem'
                      }}
                    >
                      {item.stock || 0}
                    </strong>
                  </td>

                  {/* Proveedor */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {provider ? (
                      <small>{provider.nombre}</small>
                    ) : (
                      <small className="text-muted">Sin proveedor</small>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="text-center" style={{ padding: '1rem 1.25rem' }}>
                    {getStockBadge(item)}
                  </td>

                  {/* Acciones */}
                  <td className="text-end" style={{ padding: '1rem 1.25rem' }}>
                    <ButtonGroup size="sm">
                      <Button 
                        variant="outline-primary" 
                        onClick={() => onEdit(item)}
                        title="Editar"
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => onDelete(item)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <style>{`
        .draggable-row {
          user-select: none;
        }

        .draggable-row.dragging {
          opacity: 0.4;
        }

        .draggable-row.drag-over {
          border-top: 3px solid #6366f1 !important;
        }

        .drag-handle:active {
          cursor: grabbing !important;
        }

        .draggable-row:hover {
          background-color: var(--bg-secondary);
        }

        body.dark-mode .draggable-row:hover {
          background-color: var(--bg-tertiary);
        }

        /* Animación suave al soltar */
        tbody tr {
          transition: transform 0.2s ease;
        }

        /* Efecto visual al arrastrar sobre un elemento */
        .drag-over {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

export default DraggableProductList;