/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { jsPDF } from 'jspdf';
import { GeneratedImage } from '../types';

/**
 * Generates and downloads a comprehensive PDF report for a Vizora generation.
 */
export const exportGenerationToPdf = async (image: GeneratedImage) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // 1. Header & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(14, 116, 144); // Cyan-800
  doc.text('Vizora Knowledge Report', margin, cursorY);
  
  cursorY += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date(image.timestamp).toLocaleString()}`, margin, cursorY);
  doc.text(`Topic: ${image.prompt.toUpperCase()}`, margin, cursorY + 5);

  cursorY += 15;

  // 2. Infographic Image
  try {
    const img = new Image();
    img.src = image.data;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const imgAspectRatio = img.width / img.height;
    const displayWidth = contentWidth;
    const displayHeight = displayWidth / imgAspectRatio;

    // Add image to PDF
    doc.addImage(image.data, 'PNG', margin, cursorY, displayWidth, displayHeight);
    cursorY += displayHeight + 15;
  } catch (err) {
    console.error("PDF Image processing failed:", err);
    doc.setTextColor(255, 0, 0);
    doc.text("[Image synthesis failed in PDF export]", margin, cursorY);
    cursorY += 10;
  }

  // 3. Metadata Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('GENERATION PARAMETERS', margin, cursorY);
  cursorY += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Audience Depth: ${image.level || 'Standard'}`, margin, cursorY);
  doc.text(`Visual Aesthetic: ${image.style || 'Default'}`, margin + 60, cursorY);
  doc.text(`Language: ${image.language || 'English'}`, margin + 120, cursorY);
  
  cursorY += 15;

  // 4. Detailed Report Section
  if (image.detailedSummary) {
    if (cursorY > pageHeight - 40) {
      doc.addPage();
      cursorY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('Research Synthesis', margin, cursorY);
    cursorY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50);

    const lines = image.detailedSummary.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') {
        cursorY += 5;
        continue;
      }

      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }

      let cleanLine = line.replace(/[#*]/g, '').trim();
      
      if (line.startsWith('###')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        cursorY += 5;
      } else if (line.startsWith('##') || line.startsWith('#')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        cursorY += 8;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }

      const splitText = doc.splitTextToSize(cleanLine, contentWidth);
      doc.text(splitText, margin, cursorY);
      cursorY += (splitText.length * 6);
    }
  }

  // 5. Footer on all pages
  // Note: Cast doc as any temporarily if types still conflict, 
  // though getNumberOfPages() is standard on the jsPDF instance.
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Vizora Intelligence Matrix • Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  const filename = `vizora-report-${image.prompt.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
};