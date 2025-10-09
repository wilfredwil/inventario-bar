// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Función principal para generar PDFs
export const generateInventoryPDF = (type, inventory, providers = []) => {
  try {
    const doc = new jsPDF();
    let itemsToInclude = [];
    let title = '';
    let subtitle = '';

    // Filtrar productos según el tipo de reporte
    switch(type) {
      case 'complete':
        itemsToInclude = inventory;
        title = 'REPORTE COMPLETO DE INVENTARIO';
        subtitle = `Total de productos: ${inventory.length}`;
        break;
      
      case 'low-stock':
        itemsToInclude = inventory.filter(i => i.stock <= (i.umbral_low || 5) && i.stock > 0);
        title = 'REPORTE DE STOCK BAJO';
        subtitle = `Productos con stock bajo: ${itemsToInclude.length}`;
        break;
      
      case 'out-of-stock':
        itemsToInclude = inventory.filter(i => i.stock === 0);
        title = 'REPORTE DE PRODUCTOS SIN STOCK';
        subtitle = `Productos agotados: ${itemsToInclude.length}`;
        break;
      
      case 'critical':
        itemsToInclude = inventory.filter(i => i.stock <= (i.umbral_low || 5));
        title = 'REPORTE DE STOCK CRÍTICO';
        subtitle = `Productos críticos: ${itemsToInclude.length}`;
        break;
      
      case 'by-category':
        itemsToInclude = inventory;
        title = 'REPORTE POR CATEGORÍAS';
        subtitle = 'Inventario agrupado por categorías';
        return generateCategoryPDF(doc, itemsToInclude, title, subtitle);
      
      case 'by-provider':
        itemsToInclude = inventory.filter(i => i.stock <= (i.umbral_low || 5));
        title = 'REPORTE DE REPOSICIÓN POR PROVEEDOR';
        subtitle = 'Productos que necesitan reposición';
        return generateProviderPDF(doc, itemsToInclude, providers, title, subtitle);
      
      case 'valuation':
        itemsToInclude = inventory;
        title = 'REPORTE DE VALORACIÓN DE INVENTARIO';
        subtitle = 'Análisis financiero del inventario';
        return generateValuationPDF(doc, itemsToInclude, title, subtitle);
      
      default:
        itemsToInclude = inventory;
        title = 'REPORTE DE INVENTARIO';
        subtitle = '';
    }

    // Generar PDF estándar
    generateStandardPDF(doc, itemsToInclude, title, subtitle);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor, intenta de nuevo.');
  }
};

// PDF Estándar con tabla simple
const generateStandardPDF = (doc, items, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Encabezado
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 25, { align: 'center' });
  
  if (subtitle) {
    doc.text(subtitle, pageWidth / 2, 30, { align: 'center' });
  }

  currentY = 45;

  // Resumen ejecutivo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RESUMEN EJECUTIVO', 14, currentY);
  currentY += 8;

  const totalValue = items.reduce((sum, item) => sum + ((item.precio_venta || 0) * (item.stock || 0)), 0);
  const lowStock = items.filter(i => i.stock <= (i.umbral_low || 5) && i.stock > 0).length;
  const outOfStock = items.filter(i => i.stock === 0).length;
  const important = items.filter(i => i.importante).length;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`• Total de productos: ${items.length}`, 14, currentY);
  currentY += 6;
  doc.text(`• Valor total del inventario: $${totalValue.toFixed(2)}`, 14, currentY);
  currentY += 6;
  doc.text(`• Productos con stock bajo: ${lowStock}`, 14, currentY);
  currentY += 6;
  doc.text(`• Productos sin stock: ${outOfStock}`, 14, currentY);
  currentY += 6;
  if (important > 0) {
    doc.text(`• Productos importantes: ${important}`, 14, currentY);
    currentY += 6;
  }
  currentY += 5;

  // Tabla de productos
  const tableData = items.map(item => [
    item.nombre || '',
    item.marca || '-',
    item.tipo || '',
    (item.stock || 0).toString(),
    item.unidad_medida || '',
    `${(item.precio_venta || 0).toFixed(2)}`,
    `${((item.precio_venta || 0) * (item.stock || 0)).toFixed(2)}`,
    item.importante ? 'Sí' : 'No'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Producto', 'Marca', 'Categoría', 'Stock', 'Unidad', 'Precio', 'Valor Total', 'Imp.']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [102, 126, 234],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 28 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 10, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Asegurar que los estilos se apliquen correctamente
    },
    willDrawCell: (data) => {
      if (data.section === 'body') {
        const item = items[data.row.index];
        
        // Fondo amarillo para productos importantes - FORZAR
        if (item?.importante) {
          data.cell.styles.fillColor = [255, 255, 204]; // Amarillo más visible
        }
        
        // Color del texto en columna Stock
        if (data.column.index === 3) {
          const stock = parseInt(data.cell.raw);
          const umbral = item?.umbral_low || 5;
          
          if (stock === 0) {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          } else if (stock <= umbral) {
            data.cell.styles.textColor = [255, 193, 7];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [40, 167, 69];
          }
        }
        
        // Color naranja para "Sí" en columna Importante
        if (data.column.index === 7 && item?.importante) {
          data.cell.styles.textColor = [245, 158, 11];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawCell: (data) => {
      // Redibujar fondo amarillo si es necesario
      if (data.section === 'body') {
        const item = items[data.row.index];
        if (item?.importante) {
          doc.setFillColor(255, 255, 204);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          
          // Redibujar el texto encima del fondo
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          
          // Para la columna de Stock con colores especiales
          if (data.column.index === 3) {
            const stock = parseInt(data.cell.raw);
            const umbral = item?.umbral_low || 5;
            
            if (stock === 0) {
              doc.setTextColor(220, 53, 69);
              doc.setFont(undefined, 'bold');
            } else if (stock <= umbral) {
              doc.setTextColor(255, 193, 7);
              doc.setFont(undefined, 'bold');
            } else {
              doc.setTextColor(40, 167, 69);
              doc.setFont(undefined, 'normal');
            }
            doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
          }
          // Para la columna Importante
          else if (data.column.index === 7) {
            doc.setTextColor(245, 158, 11);
            doc.setFont(undefined, 'bold');
            doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
          }
          // Para las demás columnas
          else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            const align = data.column.dataKey === 5 || data.column.dataKey === 6 ? 'right' : 
                         data.column.dataKey === 3 || data.column.dataKey === 4 ? 'center' : 'left';
            const xPos = align === 'right' ? data.cell.x + data.cell.width - 3 :
                        align === 'center' ? data.cell.x + data.cell.width / 2 :
                        data.cell.x + 3;
            doc.text(data.cell.text[0], xPos, data.cell.y + data.cell.height / 2 + 2, { align: align });
          }
        }
      }
    }
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Guardar
  const filename = `inventario_${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
};

// PDF por Categorías
const generateCategoryPDF = (doc, items, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Encabezado
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 25, { align: 'center' });

  currentY = 45;

  // Agrupar por categoría
  const categories = ['licor', 'vino', 'cerveza', 'whisky', 'vodka', 'gin', 'ron', 'tequila'];
  const groupedItems = {};

  categories.forEach(cat => {
    groupedItems[cat] = items.filter(item => item.tipo === cat);
  });

  groupedItems['otros'] = items.filter(item => !categories.includes(item.tipo));

  // Generar tabla por cada categoría
  Object.keys(groupedItems).forEach(category => {
    const categoryItems = groupedItems[category];
    
    if (categoryItems.length === 0) return;

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const categoryValue = categoryItems.reduce((sum, item) => 
      sum + ((item.precio_venta || 0) * (item.stock || 0)), 0
    );

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Título de categoría
    doc.setFillColor(102, 126, 234);
    doc.rect(14, currentY, pageWidth - 28, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(
      `${categoryName} (${categoryItems.length} productos - Valor: $${categoryValue.toFixed(2)})`,
      20,
      currentY + 7
    );
    currentY += 15;

    // Tabla de productos
    const tableData = categoryItems.map(item => [
      item.nombre || '',
      item.marca || '-',
      (item.stock || 0).toString(),
      item.unidad_medida || '',
      `${(item.precio_venta || 0).toFixed(2)}`,
      `${((item.precio_venta || 0) * (item.stock || 0)).toFixed(2)}`,
      item.importante ? 'Sí' : 'No'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Producto', 'Marca', 'Stock', 'Unidad', 'Precio', 'Valor Total', 'Imp.']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [102, 126, 234],
        textColor: 255,
        fontSize: 9
      },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { cellWidth: 12, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      willDrawCell: (data) => {
        if (data.section === 'body') {
          const item = categoryItems[data.row.index];
          
          // Fondo amarillo para productos importantes
          if (item?.importante) {
            data.cell.styles.fillColor = [255, 255, 204];
          }
          
          // Color del texto en columna Stock
          if (data.column.index === 2) {
            const stock = parseInt(data.cell.raw);
            const umbral = item?.umbral_low || 5;
            
            if (stock === 0) {
              data.cell.styles.textColor = [220, 53, 69];
              data.cell.styles.fontStyle = 'bold';
            } else if (stock <= umbral) {
              data.cell.styles.textColor = [255, 193, 7];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [40, 167, 69];
            }
          }
          
          // Color naranja para "Sí" en columna Importante
          if (data.column.index === 6 && item?.importante) {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const item = categoryItems[data.row.index];
          if (item?.importante) {
            doc.setFillColor(255, 255, 204);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            
            if (data.column.index === 2) {
              const stock = parseInt(data.cell.raw);
              const umbral = item?.umbral_low || 5;
              
              if (stock === 0) {
                doc.setTextColor(220, 53, 69);
                doc.setFont(undefined, 'bold');
              } else if (stock <= umbral) {
                doc.setTextColor(255, 193, 7);
                doc.setFont(undefined, 'bold');
              } else {
                doc.setTextColor(40, 167, 69);
                doc.setFont(undefined, 'normal');
              }
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
            }
            else if (data.column.index === 6) {
              doc.setTextColor(245, 158, 11);
              doc.setFont(undefined, 'bold');
              doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
            }
            else {
              doc.setTextColor(0, 0, 0);
              doc.setFont(undefined, 'normal');
              const align = data.column.index === 4 || data.column.index === 5 ? 'right' : 
                           data.column.index === 2 || data.column.index === 3 ? 'center' : 'left';
              const xPos = align === 'right' ? data.cell.x + data.cell.width - 3 :
                          align === 'center' ? data.cell.x + data.cell.width / 2 :
                          data.cell.x + 3;
              doc.text(data.cell.text[0], xPos, data.cell.y + data.cell.height / 2 + 2, { align: align });
            }
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 12;
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`inventario_por_categorias_${Date.now()}.pdf`);
};

// PDF por Proveedor
const generateProviderPDF = (doc, items, providers, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Encabezado
  doc.setFillColor(220, 53, 69);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 25, { align: 'center' });

  currentY = 45;

  // Agrupar por proveedor
  const groupedByProvider = {};
  
  items.forEach(item => {
    const providerId = item.proveedor_id || 'sin_proveedor';
    if (!groupedByProvider[providerId]) {
      groupedByProvider[providerId] = [];
    }
    groupedByProvider[providerId].push(item);
  });

  // Generar sección por cada proveedor
  Object.keys(groupedByProvider).forEach(providerId => {
    const providerItems = groupedByProvider[providerId];
    const provider = providers.find(p => p.id === providerId);
    const providerName = provider ? provider.empresa : 'Sin Proveedor Asignado';

    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Información del proveedor
    doc.setFillColor(220, 53, 69);
    doc.rect(14, currentY, pageWidth - 28, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${providerName} (${providerItems.length} productos)`, 20, currentY + 7);
    currentY += 15;

    // Información de contacto
    if (provider) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      let infoText = '';
      if (provider.telefono) infoText += `Tel: ${provider.telefono}  `;
      if (provider.email) infoText += `Email: ${provider.email}`;
      if (infoText) {
        doc.text(infoText, 20, currentY);
        currentY += 7;
      }
    }

    // Tabla de productos
    const tableData = providerItems.map(item => [
      item.nombre || '',
      item.marca || '-',
      item.tipo || '',
      (item.stock || 0).toString(),
      (item.umbral_low || 5).toString(),
      item.importante ? 'Sí' : 'No'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Producto', 'Marca', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Imp.']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [220, 53, 69],
        textColor: 255,
        fontSize: 9,
        halign: 'center'
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 45, halign: 'left' },
        1: { cellWidth: 35, halign: 'left' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' }
      },
      margin: { left: 14, right: 14 },
      willDrawCell: (data) => {
        if (data.section === 'body') {
          const item = providerItems[data.row.index];
          
          // Fondo amarillo para productos importantes
          if (item?.importante) {
            data.cell.styles.fillColor = [255, 255, 204];
          }
          
          // Color del texto en columna Stock Actual
          if (data.column.index === 3) {
            const stock = parseInt(data.cell.raw);
            const umbral = item?.umbral_low || 5;
            
            if (stock === 0) {
              data.cell.styles.textColor = [220, 53, 69];
              data.cell.styles.fontStyle = 'bold';
            } else if (stock <= umbral) {
              data.cell.styles.textColor = [255, 193, 7];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [40, 167, 69];
            }
          }
          
          // Color naranja para "Sí" en columna Importante
          if (data.column.index === 5 && item?.importante) {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const item = providerItems[data.row.index];
          if (item?.importante) {
            doc.setFillColor(255, 255, 204);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            
            if (data.column.index === 3) {
              const stock = parseInt(data.cell.raw);
              const umbral = item?.umbral_low || 5;
              
              if (stock === 0) {
                doc.setTextColor(220, 53, 69);
                doc.setFont(undefined, 'bold');
              } else if (stock <= umbral) {
                doc.setTextColor(255, 193, 7);
                doc.setFont(undefined, 'bold');
              } else {
                doc.setTextColor(40, 167, 69);
                doc.setFont(undefined, 'normal');
              }
              doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
            }
            else if (data.column.index === 5) {
              doc.setTextColor(245, 158, 11);
              doc.setFont(undefined, 'bold');
              doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 2, { align: 'center' });
            }
            else {
              doc.setTextColor(0, 0, 0);
              doc.setFont(undefined, 'normal');
              const align = data.column.index === 3 || data.column.index === 4 ? 'center' : 'left';
              const xPos = align === 'center' ? data.cell.x + data.cell.width / 2 : data.cell.x + 3;
              doc.text(data.cell.text[0], xPos, data.cell.y + data.cell.height / 2 + 2, { align: align });
            }
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 12;
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`reposicion_por_proveedor_${Date.now()}.pdf`);
};

// PDF de Valoración
const generateValuationPDF = (doc, items, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  // Encabezado
  doc.setFillColor(40, 167, 69);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 25, { align: 'center' });

  currentY = 45;

  // Cálculos financieros
  const totalCost = items.reduce((sum, item) => sum + ((item.precio_compra || 0) * (item.stock || 0)), 0);
  const totalValue = items.reduce((sum, item) => sum + ((item.precio_venta || 0) * (item.stock || 0)), 0);
  const potentialProfit = totalValue - totalCost;
  const profitMargin = totalCost > 0 ? ((potentialProfit / totalCost) * 100) : 0;

  // Resumen financiero
  doc.setFillColor(245, 247, 250);
  doc.rect(14, currentY, pageWidth - 28, 40, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RESUMEN FINANCIERO', 20, currentY + 8);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Costo Total del Inventario: $${totalCost.toFixed(2)}`, 20, currentY + 18);
  doc.text(`Valor de Venta Total: $${totalValue.toFixed(2)}`, 20, currentY + 26);
  doc.text(`Ganancia Potencial: $${potentialProfit.toFixed(2)}`, 20, currentY + 34);
  doc.text(`Margen de Ganancia: ${profitMargin.toFixed(2)}%`, pageWidth - 80, currentY + 34);

  currentY += 50;

  // Top 10 productos
  const topProducts = [...items]
    .sort((a, b) => ((b.precio_venta || 0) * (b.stock || 0)) - ((a.precio_venta || 0) * (a.stock || 0)))
    .slice(0, 10);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('TOP 10 PRODUCTOS MÁS VALIOSOS', 14, currentY);
  currentY += 8;

  const topTableData = topProducts.map((item, index) => [
    (index + 1).toString(),
    item.nombre || '',
    item.marca || '-',
    (item.stock || 0).toString(),
    `$${(item.precio_venta || 0).toFixed(2)}`,
    `$${((item.precio_venta || 0) * (item.stock || 0)).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Producto', 'Marca', 'Stock', 'Precio', 'Valor Total']],
    body: topTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [40, 167, 69],
      textColor: 255,
      fontSize: 9
    },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    willDrawCell: (data) => {
      if (data.section === 'body') {
        const item = topProducts[data.row.index];
        
        // Fondo amarillo para productos importantes
        if (item?.importante) {
          data.cell.styles.fillColor = [255, 255, 204];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const item = topProducts[data.row.index];
        if (item?.importante) {
          doc.setFillColor(255, 255, 204);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          
          const align = data.column.index === 0 || data.column.index === 3 ? 'center' :
                       data.column.index === 4 || data.column.index === 5 ? 'right' : 'left';
          const xPos = align === 'right' ? data.cell.x + data.cell.width - 3 :
                      align === 'center' ? data.cell.x + data.cell.width / 2 :
                      data.cell.x + 3;
          doc.text(data.cell.text[0], xPos, data.cell.y + data.cell.height / 2 + 2, { align: align });
        }
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Valoración por categoría
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('VALORACIÓN POR CATEGORÍA', 14, currentY);
  currentY += 8;

  const categories = ['licor', 'vino', 'cerveza', 'whisky', 'vodka', 'gin', 'ron', 'tequila'];
  const categoryData = categories.map(cat => {
    const catItems = items.filter(item => item.tipo === cat);
    const catValue = catItems.reduce((sum, item) => sum + ((item.precio_venta || 0) * (item.stock || 0)), 0);
    const catCost = catItems.reduce((sum, item) => sum + ((item.precio_compra || 0) * (item.stock || 0)), 0);
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: catItems.length,
      cost: catCost,
      value: catValue,
      profit: catValue - catCost
    };
  }).filter(cat => cat.count > 0);

  const catTableData = categoryData.map(cat => [
    cat.name,
    cat.count.toString(),
    `$${cat.cost.toFixed(2)}`,
    `$${cat.value.toFixed(2)}`,
    `$${cat.profit.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Categoría', 'Productos', 'Costo', 'Valor Venta', 'Ganancia']],
    body: catTableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [40, 167, 69],
      textColor: 255,
      fontSize: 9
    },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`valoracion_inventario_${Date.now()}.pdf`);
};