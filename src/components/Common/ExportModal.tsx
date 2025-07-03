import React, { useState } from 'react';
import { Download, FileText, Table, Printer, Mail, Calendar, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  filename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  filename
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [includeImages, setIncludeImages] = useState(false);
  const [emailAfterExport, setEmailAfterExport] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulation de l'export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (exportFormat === 'pdf') {
        generatePDF();
      } else if (exportFormat === 'csv') {
        generateCSV();
      } else if (exportFormat === 'excel') {
        generateExcel();
      }

      if (emailAfterExport && emailAddress) {
        // Simulation d'envoi par email
        console.log(`Envoi par email à: ${emailAddress}`);
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = () => {
    // Simulation de génération PDF
    console.log('Génération PDF:', { data, filename, includeImages });
    
    // Créer un blob simulé et déclencher le téléchargement
    const blob = new Blob(['PDF Content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExcel = () => {
    // Simulation de génération Excel
    console.log('Génération Excel:', { data, filename });
    
    const blob = new Blob(['Excel Content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Exporter {title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Format d'export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format d'export</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                  className="mr-3"
                />
                <FileText className="w-5 h-5 mr-2 text-red-500" />
                <span>PDF - Document formaté</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'csv')}
                  className="mr-3"
                />
                <Table className="w-5 h-5 mr-2 text-green-500" />
                <span>CSV - Données tabulaires</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                  className="mr-3"
                />
                <Table className="w-5 h-5 mr-2 text-blue-500" />
                <span>Excel - Feuille de calcul</span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
            <div className="space-y-2">
              {exportFormat === 'pdf' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm">Inclure les images</span>
                </label>
              )}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailAfterExport}
                  onChange={(e) => setEmailAfterExport(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm">Envoyer par email après export</span>
              </label>
            </div>
          </div>

          {/* Email */}
          {emailAfterExport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Aperçu */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu de l'export</h4>
            <div className="text-sm text-gray-600">
              <p>• {data.length} élément(s) à exporter</p>
              <p>• Format: {exportFormat.toUpperCase()}</p>
              <p>• Nom du fichier: {filename}.{exportFormat === 'excel' ? 'xlsx' : exportFormat}</p>
              {includeImages && <p>• Images incluses</p>}
              {emailAfterExport && emailAddress && <p>• Envoi à: {emailAddress}</p>}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <Button
            variant="secondary"
            onClick={handlePrint}
            size="sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || (emailAfterExport && !emailAddress)}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};