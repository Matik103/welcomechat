
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';

/**
 * Convert a DOCX file to PDF
 * @param file The DOCX file to convert
 * @returns A Promise resolving to the converted PDF file
 */
const convertDocxToPdf = async (file: File): Promise<File> => {
  try {
    // Read the DOCX file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to convert DOCX to HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    
    // Add HTML content to PDF (very basic, just text)
    const { width, height } = page.getSize();
    page.drawText(html.replace(/<[^>]*>/g, ' ').slice(0, 1000), {
      x: 50,
      y: height - 50,
      size: 12,
      maxWidth: width - 100,
    });
    
    // Save PDF as bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a new PDF file
    const pdfFile = new File([pdfBytes], `${file.name.replace(/\.docx$/, '')}.pdf`, {
      type: 'application/pdf',
    });
    
    return pdfFile;
  } catch (error) {
    console.error('Error converting DOCX to PDF:', error);
    throw new Error(`Failed to convert DOCX to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert a text file to PDF
 * @param file The text file to convert
 * @returns A Promise resolving to the converted PDF file
 */
const convertTextToPdf = async (file: File): Promise<File> => {
  try {
    // Read the text file content
    const text = await file.text();
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Split text into chunks of 1000 characters to fit on pages
    const textChunks = text.match(/.{1,1000}/g) || [];
    
    for (const chunk of textChunks) {
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();
      
      page.drawText(chunk, {
        x: 50,
        y: height - 50,
        size: 12,
        maxWidth: width - 100,
      });
    }
    
    // Save PDF as bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a new PDF file
    const pdfFile = new File([pdfBytes], `${file.name.replace(/\.(txt|csv)$/, '')}.pdf`, {
      type: 'application/pdf',
    });
    
    return pdfFile;
  } catch (error) {
    console.error('Error converting text to PDF:', error);
    throw new Error(`Failed to convert text to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert a file to PDF based on its type
 * @param file The file to convert
 * @returns A Promise resolving to the converted PDF file
 */
export const convertToPdf = async (file: File): Promise<File> => {
  // If the file is already a PDF, return it as is
  if (file.type === 'application/pdf') {
    return file;
  }
  
  // DOCX file
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return convertDocxToPdf(file);
  }
  
  // Text or CSV file
  if (file.type === 'text/plain' || file.type === 'text/csv') {
    return convertTextToPdf(file);
  }
  
  // Unsupported file type
  throw new Error(`File type ${file.type} not supported for conversion to PDF`);
};

/**
 * Convert a file to PDF if needed
 * @param file The file to potentially convert
 * @returns A Promise resolving to the original file or the converted PDF file
 */
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  // Only convert if the file is not already a PDF
  if (file.type !== 'application/pdf') {
    console.log(`Converting ${file.type} file to PDF: ${file.name}`);
    return convertToPdf(file);
  }
  return file;
};
