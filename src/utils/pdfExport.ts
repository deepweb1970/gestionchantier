import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string; width?: number }[];
  filename: string;
  includeStats?: boolean;
  stats?: { [key: string]: any };
}

export const exportToPDF = (options: PDFExportOptions) => {
  const { title, subtitle, data, columns, filename, includeStats = false, stats } = options;
  
  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [59, 130, 246]; // Blue-500
  const secondaryColor = [107, 114, 128]; // Gray-500
  const accentColor = [16, 185, 129]; // Green-500
  
  let yPosition = 20;
  
  // En-tête du document
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text(title, 20, yPosition);
  yPosition += 10;
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(...secondaryColor);
    doc.text(subtitle, 20, yPosition);
    yPosition += 10;
  }
  
  // Date de génération
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text(`Généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}`, 20, yPosition);
  yPosition += 15;
  
  // Statistiques (si incluses)
  if (includeStats && stats) {
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('Résumé Exécutif', 20, yPosition);
    yPosition += 10;
    
    const statsEntries = Object.entries(stats);
    const statsPerRow = 2;
    
    for (let i = 0; i < statsEntries.length; i += statsPerRow) {
      const rowStats = statsEntries.slice(i, i + statsPerRow);
      
      rowStats.forEach((stat, index) => {
        const xPosition = 20 + (index * 90);
        
        // Cadre pour la statistique
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        doc.rect(xPosition, yPosition, 80, 20);
        
        // Titre de la statistique
        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.text(stat[0], xPosition + 5, yPosition + 8);
        
        // Valeur de la statistique
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(String(stat[1]), xPosition + 5, yPosition + 16);
      });
      
      yPosition += 25;
    }
    
    yPosition += 10;
  }
  
  // Tableau des données
  if (data.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('Données Détaillées', 20, yPosition);
    yPosition += 10;
    
    // Préparer les données pour le tableau
    const tableData = data.map(row => 
      columns.map(col => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return String(value);
      })
    );
    
    // Configuration du tableau
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: tableData,
      startY: yPosition,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55] // Gray-800
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Gray-50
      },
      columnStyles: columns.reduce((styles, col, index) => {
        if (col.width) {
          styles[index] = { cellWidth: col.width };
        }
        return styles;
      }, {} as any),
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        // Pied de page
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setTextColor(...secondaryColor);
        doc.text(
          `Page ${data.pageNumber} sur ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        );
        
        doc.text(
          'Application de Gestion de Chantier',
          pageSize.width - 20 - 60,
          pageHeight - 10
        );
      }
    });
  }
  
  // Télécharger le PDF
  doc.save(`${filename}.pdf`);
};

// Fonction spécialisée pour l'export des rapports
export const exportRapportToPDF = (rapport: any, analysisData: any) => {
  const stats = {
    'Total Heures': `${analysisData.heures.total.toFixed(1)}h`,
    'Heures Validées': `${analysisData.heures.validees.toFixed(1)}h`,
    'Chiffre d\'Affaires': `${analysisData.finances.chiffreAffaires.toLocaleString()}€`,
    'Coût Main d\'Œuvre': `${analysisData.finances.coutMainOeuvre.toLocaleString()}€`,
    'Rentabilité': `${analysisData.rentabilite.toFixed(1)}%`,
    'Factures Payées': `${analysisData.finances.facturesPayees.toLocaleString()}€`
  };
  
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Ouvrier', dataKey: 'ouvrier' },
    { header: 'Chantier', dataKey: 'chantier' },
    { header: 'Heures', dataKey: 'heures' },
    { header: 'Description', dataKey: 'description', width: 60 },
    { header: 'Statut', dataKey: 'statut' }
  ];
  
  // Transformer les données pour le PDF
  const pdfData = analysisData.saisies.map((saisie: any) => ({
    date: new Date(saisie.date).toLocaleDateString(),
    ouvrier: saisie.ouvriers ? `${saisie.ouvriers.prenom} ${saisie.ouvriers.nom}` : '-',
    chantier: saisie.chantiers ? saisie.chantiers.nom : '-',
    heures: saisie.heures_total || (saisie.heures_normales + saisie.heures_supplementaires + (saisie.heures_exceptionnelles || 0)),
    description: saisie.description,
    statut: saisie.valide ? 'Validée' : 'En attente',
    dateSort: new Date(saisie.date) // Ajouter une date pour le tri
  })).sort((a, b) => a.dateSort.getTime() - b.dateSort.getTime()); // Trier par date croissante
  
  exportToPDF({
    title: rapport.nom,
    subtitle: `Période: ${new Date(rapport.dateDebut).toLocaleDateString()} - ${new Date(rapport.dateFin).toLocaleDateString()}`,
    data: pdfData,
    columns,
    filename: `rapport-${rapport.nom.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`,
    includeStats: true,
    stats
  });
};

// Fonction pour exporter les statistiques globales
export const exportStatsToPDF = (globalStats: any, performanceIndicators: any) => {
  const stats = {
    'Chantiers Actifs': `${globalStats.chantiers.actifs}/${globalStats.chantiers.total}`,
    'Ouvriers Actifs': `${globalStats.ouvriers.actifs}/${globalStats.ouvriers.total}`,
    'Matériel Disponible': `${globalStats.materiel.disponible}/${globalStats.materiel.total}`,
    'CA Total': `${globalStats.finances.total.toLocaleString()}€`,
    'Factures Payées': `${globalStats.finances.payees.toLocaleString()}€`,
    'Heures Totales': `${globalStats.heures.total.toFixed(1)}h`,
    'Taux Validation': `${performanceIndicators.tauxValidationHeures.toFixed(1)}%`,
    'Taux Paiement': `${performanceIndicators.tauxPaiementFactures.toFixed(1)}%`,
    'Utilisation Matériel': `${performanceIndicators.tauxUtilisationMateriel.toFixed(1)}%`,
    'Occupation Ouvriers': `${performanceIndicators.tauxOccupationOuvriers.toFixed(1)}%`
  };
  
  exportToPDF({
    title: 'Tableau de Bord - Statistiques Globales',
    subtitle: `Généré le ${new Date().toLocaleDateString()}`,
    data: [],
    columns: [],
    filename: `tableau-bord-${new Date().toISOString().split('T')[0]}`,
    includeStats: true,
    stats
  });
};