
/**
 * Document conversion utilities for processing different document formats
 */

// PDF.js for parsing and manipulating PDFs
import { PDFDocument } from 'pdf-lib';

/**
 * Convert a Word document (docx) to PDF format
 * @param {File} file The Word document file
 * @returns {Promise<ArrayBuffer>} The PDF file as an ArrayBuffer
 */
export async function convertWordToPdf(file) {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to convert docx to HTML
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Convert the HTML to PDF
    return await convertHtmlToPdf(html);
  } catch (error) {
    console.error('Error converting Word to PDF:', error);
    throw new Error('Failed to convert Word document to PDF');
  }
}

/**
 * Convert HTML content to PDF format
 * @param {string} html The HTML content
 * @returns {Promise<ArrayBuffer>} The PDF file as an ArrayBuffer
 */
export async function convertHtmlToPdf(html) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Simple HTML text extraction (for basic conversion)
    const textContent = html.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add the text to the PDF
    const { width, height } = page.getSize();
    page.drawText(textContent, {
      x: 50,
      y: height - 50,
      size: 12,
      maxWidth: width - 100,
      lineHeight: 16
    });
    
    // Serialize the PDF to bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw new Error('Failed to convert HTML to PDF');
  }
}

/**
 * Split a PDF file into chunks based on page count
 * @param {File} file The PDF file to split
 * @param {number} pagesPerChunk Maximum pages per chunk
 * @returns {Promise<File[]>} Array of PDF file chunks
 */
export async function splitPdfIntoChunks(file, pagesPerChunk) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // If the document is small enough, return it as is
    if (pageCount <= pagesPerChunk) {
      return [file];
    }
    
    const chunks = [];
    
    // Split the document into chunks
    for (let i = 0; i < pageCount; i += pagesPerChunk) {
      const chunkPdf = await PDFDocument.create();
      const pagesToCopy = Math.min(pagesPerChunk, pageCount - i);
      
      // Copy the pages from the original document
      const copiedPages = await chunkPdf.copyPages(
        pdfDoc, 
        Array.from({ length: pagesToCopy }, (_, idx) => i + idx)
      );
      
      // Add the copied pages to the new document
      copiedPages.forEach(page => chunkPdf.addPage(page));
      
      // Save the chunk as a PDF file
      const chunkBytes = await chunkPdf.save();
      const chunkBlob = new Blob([chunkBytes], { type: 'application/pdf' });
      chunks.push(new File([chunkBlob], `chunk-${i/pagesPerChunk+1}.pdf`, { type: 'application/pdf' }));
    }
    
    return chunks;
  } catch (error) {
    console.error('Error splitting PDF:', error);
    throw new Error('Failed to split PDF into chunks');
  }
}
