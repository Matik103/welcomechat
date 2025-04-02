
import mammoth from 'mammoth';
import * as pdfLib from 'pdf-lib';
import { supabase } from '../integrations/supabase/client';
import axios from 'axios';

/**
 * Convert a Word document to PDF format
 * @param {File|Blob} wordFile The Word document file
 * @returns {Promise<Uint8Array>} The PDF file as a Uint8Array
 */
export async function convertWordToPdf(wordFile) {
  try {
    console.log('Converting Word document to PDF...');
    
    // Read the Word file as an ArrayBuffer
    const arrayBuffer = await wordFile.arrayBuffer();
    
    // Convert to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Now convert the HTML to PDF
    return await convertHtmlToPdf(html);
  } catch (error) {
    console.error('Error converting Word to PDF:', error);
    throw new Error(`Failed to convert Word document: ${error.message}`);
  }
}

/**
 * Convert HTML content to PDF format
 * @param {string} htmlContent The HTML content
 * @returns {Promise<Uint8Array>} The PDF file as a Uint8Array
 */
export async function convertHtmlToPdf(htmlContent) {
  try {
    console.log('Converting HTML to PDF...');
    
    // Create a new PDF document
    const pdfDoc = await pdfLib.PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    
    // Simple HTML to text conversion (for complex HTML, a proper HTML-to-PDF library would be better)
    const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Calculate how many pages we need based on text length
    const fontSize = 12;
    const lineHeight = 16;
    const maxWidth = 500;
    const maxLinesPerPage = 40;
    const words = text.split(' ');
    let currentLine = '';
    let lines = [];
    
    // Simple text wrapping algorithm
    for (const word of words) {
      if ((currentLine + word).length * (fontSize / 2) < maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Add additional pages if needed
    const pagesNeeded = Math.ceil(lines.length / maxLinesPerPage);
    
    // Add more pages if needed
    for (let i = 1; i < pagesNeeded; i++) {
      pdfDoc.addPage([612, 792]);
    }
    
    // Write text to all pages
    for (let i = 0; i < pagesNeeded; i++) {
      const pageContent = lines.slice(i * maxLinesPerPage, (i + 1) * maxLinesPerPage);
      const pageToDraw = pdfDoc.getPage(i);
      
      pageContent.forEach((line, lineIndex) => {
        pageToDraw.drawText(line, {
          x: 50,
          y: 700 - (lineIndex * lineHeight),
          size: fontSize,
          lineHeight: lineHeight
        });
      });
    }
    
    // Serialize the PDF to bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw new Error(`Failed to convert HTML: ${error.message}`);
  }
}

/**
 * Split a PDF document into smaller chunks
 * @param {Uint8Array} pdfData The PDF file as a Uint8Array
 * @param {number} maxChunkSize Maximum size of each chunk in pages
 * @returns {Promise<Array<Uint8Array>>} Array of PDF chunks
 */
export async function splitPdfIntoChunks(pdfData, maxChunkSize = 5) {
  try {
    console.log(`Splitting PDF into chunks of ${maxChunkSize} pages...`);
    
    // Load the PDF document
    const pdfDoc = await pdfLib.PDFDocument.load(pdfData);
    
    // Get the total number of pages
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);
    
    // If document is small enough, return it as is
    if (pageCount <= maxChunkSize) {
      console.log('PDF is small enough, no need to split');
      return [pdfData];
    }
    
    // Calculate number of chunks needed
    const chunkCount = Math.ceil(pageCount / maxChunkSize);
    console.log(`Splitting into ${chunkCount} chunks`);
    
    const chunks = [];
    
    // Create each chunk
    for (let i = 0; i < chunkCount; i++) {
      // Calculate page range for this chunk
      const startPage = i * maxChunkSize;
      const endPage = Math.min((i + 1) * maxChunkSize, pageCount) - 1;
      
      console.log(`Creating chunk ${i + 1} with pages ${startPage} to ${endPage}`);
      
      // Create a new PDF document for this chunk
      const chunkDoc = await pdfLib.PDFDocument.create();
      
      // Copy pages from the original document
      const pagesToCopy = [];
      for (let j = startPage; j <= endPage; j++) {
        pagesToCopy.push(j);
      }
      
      const copiedPages = await chunkDoc.copyPages(pdfDoc, pagesToCopy);
      
      // Add the copied pages to the chunk document
      copiedPages.forEach(page => {
        chunkDoc.addPage(page);
      });
      
      // Serialize the chunk to bytes and add to the result array
      const chunkBytes = await chunkDoc.save();
      chunks.push(chunkBytes);
    }
    
    console.log(`Successfully split PDF into ${chunks.length} chunks`);
    return chunks;
  } catch (error) {
    console.error('Error splitting PDF:', error);
    throw new Error(`Failed to split PDF: ${error.message}`);
  }
}

/**
 * Download a file from a URL
 * @param {string} url The URL to download
 * @returns {Promise<{data: Uint8Array, filename: string, contentType: string}>} The file data and metadata
 */
export async function downloadFileFromUrl(url) {
  try {
    console.log(`Downloading file from ${url}...`);
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    // Get filename from URL or Content-Disposition header
    let filename = url.split('/').pop() || 'downloaded-file';
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    // Get content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    return {
      data: new Uint8Array(response.data),
      filename,
      contentType
    };
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
}
