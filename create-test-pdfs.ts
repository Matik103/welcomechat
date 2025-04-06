import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Ensure test-assets directory exists
const testAssetsDir = path.join(process.cwd(), 'test-assets');
if (!fs.existsSync(testAssetsDir)) {
  fs.mkdirSync(testAssetsDir, { recursive: true });
}

// Function to generate Lorem Ipsum text
function generateLoremIpsum(paragraphs: number): string {
  const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
  return Array(paragraphs).fill(loremIpsum).join('\n\n');
}

// Function to add wrapped text
function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * 10); // Return the new Y position
}

// Function to create a PDF with specified content
function createPDF(fileName: string, numSections: number, paragraphsPerSection: number) {
  console.log(`Creating ${fileName}...`);
  const doc = new jsPDF();
  let currentY = 20;

  // Add title
  doc.setFontSize(24);
  doc.text(`Test Document - ${numSections} sections`, 20, currentY);
  currentY += 20;

  // Add multiple sections with content
  for (let section = 1; section <= numSections; section++) {
    // Add section header
    doc.setFontSize(16);
    doc.text(`Section ${section}`, 20, currentY);
    currentY += 10;

    // Add normal text
    doc.setFontSize(12);
    currentY = addWrappedText(doc, generateLoremIpsum(paragraphsPerSection), 20, currentY, 170);
    currentY += 10;

    // Add some formatted text
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, `Important Note ${section}:`, 20, currentY, 170);
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(doc, 'This is a test document with multiple pages and various formatting to verify text extraction capabilities.', 20, currentY + 5, 170);
    currentY += 15;

    // Add a table-like structure
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, 'Test Data:', 20, currentY, 170);
    doc.setFont('helvetica', 'normal');
    for (let i = 1; i <= 5; i++) {
      currentY = addWrappedText(doc, `Item ${i}: Sample data point with some details and information`, 30, currentY + 5, 160);
    }
    currentY += 15;

    // Add more Lorem Ipsum
    currentY = addWrappedText(doc, generateLoremIpsum(1), 20, currentY, 170);
    currentY += 20;

    // Add a new page if needed
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  }

  // Save the PDF
  const filePath = path.join(testAssetsDir, fileName);
  doc.save(filePath);
  
  // Get file size
  const stats = fs.statSync(filePath);
  console.log(`Created ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
}

// Create PDFs of different sizes
console.log('Generating test PDFs...');

// Small PDF (1-2 pages)
createPDF('small-test.pdf', 2, 2);

// Medium PDF (5-7 pages)
createPDF('medium-test.pdf', 5, 3);

// Large PDF (15-20 pages)
createPDF('large-test.pdf', 15, 4);

// Extra Large PDF (30+ pages)
createPDF('xlarge-test.pdf', 30, 5);

console.log('All test PDFs generated successfully!'); 