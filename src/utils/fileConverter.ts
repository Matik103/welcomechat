
import { PDFDocument } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

/**
 * Convert text file to PDF
 */
export const textToPdf = async (file: File): Promise<Uint8Array> => {
  try {
    const text = await file.text();
    const doc = new jsPDF();
    
    // Split text into chunks to handle long documents
    const textChunks = [];
    const chunkSize = 2000; // Characters per chunk
    for (let i = 0; i < text.length; i += chunkSize) {
      textChunks.push(text.substring(i, i + chunkSize));
    }
    
    // Add text chunks to document
    const lineHeight = 7;
    const margin = 20;
    let yPosition = margin;
    
    for (const chunk of textChunks) {
      // Add a new page if we're at the bottom
      if (yPosition > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Split chunk into lines and add them
      const lines = doc.splitTextToSize(chunk, doc.internal.pageSize.width - 2 * margin);
      for (const line of lines) {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
        
        // Add a new page if we're at the bottom
        if (yPosition > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPosition = margin;
        }
      }
    }
    
    return new Uint8Array(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error converting text to PDF:', error);
    throw new Error('Failed to convert text file to PDF');
  }
};

/**
 * Convert DOCX file to PDF
 */
export const docxToPdf = async (file: File): Promise<Uint8Array> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text content from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Split text into chunks to handle long documents
    const textChunks = [];
    const chunkSize = 2000; // Characters per chunk
    for (let i = 0; i < text.length; i += chunkSize) {
      textChunks.push(text.substring(i, i + chunkSize));
    }
    
    // Add text chunks to document
    const lineHeight = 7;
    const margin = 20;
    let yPosition = margin;
    
    for (const chunk of textChunks) {
      // Add a new page if we're at the bottom
      if (yPosition > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Split chunk into lines and add them
      const lines = doc.splitTextToSize(chunk, doc.internal.pageSize.width - 2 * margin);
      for (const line of lines) {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
        
        // Add a new page if we're at the bottom
        if (yPosition > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPosition = margin;
        }
      }
    }
    
    return new Uint8Array(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    throw new Error('Failed to convert DOCX file to PDF');
  }
};

/**
 * Convert CSV file to PDF
 */
export const csvToPdf = async (file: File): Promise<Uint8Array> => {
  try {
    const text = await file.text();
    const lines = text.split('\n');
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Process CSV data
    const lineHeight = 7;
    const margin = 10;
    let yPosition = margin;
    
    // Calculate column widths
    const maxCols = lines.reduce((max, line) => {
      const cols = line.split(',');
      return Math.max(max, cols.length);
    }, 0);
    
    const colWidth = (doc.internal.pageSize.width - 2 * margin) / maxCols;
    
    // Add each row
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Add a new page if we're at the bottom
      if (yPosition > doc.internal.pageSize.height - margin - lineHeight) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Process columns
      const cols = line.split(',');
      cols.forEach((col, index) => {
        const xPosition = margin + (index * colWidth);
        doc.text(col.trim(), xPosition, yPosition);
      });
      
      yPosition += lineHeight;
    }
    
    return new Uint8Array(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error converting CSV to PDF:', error);
    throw new Error('Failed to convert CSV file to PDF');
  }
};

/**
 * Convert a file to PDF format
 */
export const convertToPdf = async (file: File): Promise<File> => {
  try {
    // If already PDF, return as is
    if (file.type === 'application/pdf') {
      return file;
    }
    
    let pdfBytes: Uint8Array;
    
    // Convert based on file type
    if (file.type === 'text/plain') {
      pdfBytes = await textToPdf(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      pdfBytes = await docxToPdf(file);
    } else if (file.type === 'text/csv') {
      pdfBytes = await csvToPdf(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    // Create a new file with PDF data
    const pdfFilename = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
    return new File([pdfBytes], pdfFilename, { type: 'application/pdf' });
  } catch (error) {
    console.error('Error converting file to PDF:', error);
    throw error;
  }
};
