export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  filename: string;
  includeImages?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const exportToPDF = async (data: any[], options: ExportOptions) => {
  // Simulation de génération PDF
  console.log('Export PDF:', { data, options });
  
  // Ici on utiliserait une bibliothèque comme jsPDF ou Puppeteer
  const content = `PDF Export - ${options.filename}\n\nData: ${JSON.stringify(data, null, 2)}`;
  
  const blob = new Blob([content], { type: 'application/pdf' });
  downloadBlob(blob, `${options.filename}.pdf`);
};

export const exportToCSV = (data: any[], options: ExportOptions) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les virgules et guillemets
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${options.filename}.csv`);
};

export const exportToExcel = async (data: any[], options: ExportOptions) => {
  // Simulation de génération Excel
  console.log('Export Excel:', { data, options });
  
  // Ici on utiliserait une bibliothèque comme SheetJS
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  downloadBlob(blob, `${options.filename}.xlsx`);
};

export const exportToJSON = (data: any[], options: ExportOptions) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${options.filename}.json`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const printData = (data: any[], title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Généré le ${new Date().toLocaleString()}</p>
        ${generateTableHTML(data)}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

const generateTableHTML = (data: any[]): string => {
  if (!data || !data.length) return '<p>Aucune donnée à afficher</p>';

  const headers = Object.keys(data[0]);
  
  return `
    <table>
      <thead>
        <tr>
          ${headers.map(header => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(header => {
              const value = row[header];
              // Format values appropriately
              if (value === null || value === undefined) {
                return '<td>-</td>';
              } else if (typeof value === 'number') {
                return `<td>${value.toLocaleString()}</td>`;
              } else if (value instanceof Date) {
                return `<td>${value.toLocaleString()}</td>`;
              } else if (typeof value === 'boolean') {
                return `<td>${value ? 'Oui' : 'Non'}</td>`;
              } else {
                return `<td>${value}</td>`;
              }
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};