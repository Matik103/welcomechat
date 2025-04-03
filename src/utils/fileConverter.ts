import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

/**
 * Convert text content to PDF
 */
async function textToPdf(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { height } = page.getSize();
  
  // Split text into lines (max 80 characters per line)
  const lines = text.split('\n').flatMap(line => {
    const words = line.split(' ');
    const result: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if (currentLine.length + word.length + 1 <= 80) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        result.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) {
      result.push(currentLine);
    }
    
    return result;
  });
  
  // Write lines to PDF
  let y = height - 50;
  const lineHeight = 12;
  let currentPage = page;
  
  for (const line of lines) {
    if (y < 50) {
      currentPage = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }
    
    currentPage.drawText(line, {
      x: 50,
      y,
      size: 11
    });
    
    y -= lineHeight;
  }
  
  return pdfDoc.save();
}

/**
 * Convert DOCX content to PDF
 */
async function docxToPdf(file: File): Promise<Uint8Array> {
  // First convert DOCX to HTML using mammoth
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  
  // Then convert HTML to PDF using jsPDF
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  // Remove HTML tags and split into lines
  const text = html.replace(/<[^>]*>/g, '');
  const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - 20);
  
  let y = 10;
  for (const line of lines) {
    if (y > pageHeight - 10) {
      doc.addPage();
      y = 10;
    }
    doc.text(line, 10, y);
    y += 7;
  }
  
  return doc.output('arraybuffer');
}

/**
 * Convert CSV content to PDF
 */
async function csvToPdf(file: File): Promise<Uint8Array> {
  const text = await file.text();
  const lines = text.split('\n');
  
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let y = 10;
  
  // Set font size smaller for table data
  doc.setFontSize(10);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const cells = line.split(',').map(cell => cell.trim());
    let x = 10;
    
    // Check if we need a new page
    if (y > pageHeight - 10) {
      doc.addPage();
      y = 10;
    }
    
    // Draw cells
    for (const cell of cells) {
      const cellWidth = doc.getTextWidth(cell);
      doc.text(cell, x, y);
      x += Math.max(cellWidth + 5, 30); // Minimum 30 points between columns
    }
    
    y += 7;
  }
  
  return doc.output('arraybuffer');
}

/**
 * Convert any supported file type to PDF
 */
export async function convertToPdf(file: File): Promise<File> {
  try {
    if (file.type === 'application/pdf') {
      return file;
    }
    
    let pdfBytes: Uint8Array;
    
    switch (file.type) {
      case 'text/plain':
        const text = await file.text();
        pdfBytes = await textToPdf(text);
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        pdfBytes = await docxToPdf(file);
        break;
        
      case 'text/csv':
        pdfBytes = await csvToPdf(file);
        break;
        
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    // Create a new File object with the PDF content
    return new File([pdfBytes], `${file.name.split('.')[0]}.pdf`, {
      type: 'application/pdf',
      lastModified: new Date().getTime()
    });
  } catch (error) {
    console.error('Error converting file to PDF:', error);
    throw new Error(`Failed to convert file to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 