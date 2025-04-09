import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new PDF document
const doc = new jsPDF();

// Add multiple pages of content
const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`;

// Function to add text with word wrap
function addWrappedText(text: string, y: number) {
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 15, y);
  return y + (lines.length * 7);
}

// Add content to multiple pages
let y = 20;
doc.setFontSize(20);
doc.text('Large Test PDF Document', 15, y);

y = 40;
doc.setFontSize(12);

// Add several pages of content
for (let i = 0; i < 5; i++) {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(16);
  doc.text(`Section ${i + 1}`, 15, y);
  y += 10;
  
  doc.setFontSize(12);
  y = addWrappedText(loremIpsum, y);
  y += 20;
  
  // Add some formatted text
  doc.setFont('helvetica', 'bold');
  doc.text(`Important Note ${i + 1}:`, 15, y);
  y += 10;
  
  doc.setFont('helvetica', 'normal');
  y = addWrappedText('This is a test document created to verify PDF text extraction capabilities. It contains multiple pages and various text formatting.', y);
  y += 20;
}

// Save the PDF
const testAssetsDir = path.join(__dirname, 'test-assets');
if (!fs.existsSync(testAssetsDir)) {
  fs.mkdirSync(testAssetsDir, { recursive: true });
}

const outputPath = path.join(testAssetsDir, 'large-test.pdf');
fs.writeFileSync(outputPath, doc.output(), 'binary');

console.log(`Created large test PDF at: ${outputPath}`); 