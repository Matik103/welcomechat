import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createLargeTestPDF() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Sample content for different pages
  const contents = [
    {
      title: 'Executive Summary',
      content: `This comprehensive report details the findings of our annual research study.
      
The study was conducted over a period of 12 months, involving multiple teams across different regions.
      
Key findings include:
• Increased market penetration in emerging markets
• Strong customer satisfaction metrics
• Technological advancement in key areas
• Sustainable growth in core business segments`
    },
    {
      title: 'Technical Analysis',
      content: `The technical analysis reveals several important patterns:

1. System Architecture
   - Microservices implementation
   - Cloud-native solutions
   - Containerized deployments
   - Scalable infrastructure

2. Performance Metrics
   - 99.99% uptime achieved
   - Response time under 100ms
   - Zero critical incidents
   - Successful disaster recovery tests`
    },
    {
      title: 'Market Research',
      content: `Our market research indicates significant opportunities:

Consumer Behavior:
• Increasing demand for digital solutions
• Preference for mobile-first experiences
• Growing awareness of security concerns
• Emphasis on user privacy

Market Trends:
• Shift towards sustainable products
• Integration of AI/ML technologies
• Focus on personalized experiences
• Remote work solutions`
    },
    {
      title: 'Financial Overview',
      content: `Financial performance exceeded expectations:

Revenue Growth:
• Q1: 15% increase YoY
• Q2: 18% increase YoY
• Q3: 22% increase YoY
• Q4: 25% increase YoY

Key Metrics:
• Gross Margin: 68%
• Operating Margin: 34%
• Net Profit: 28%
• Cash Flow: Positive`
    },
    {
      title: 'Future Outlook',
      content: `Strategic initiatives for the upcoming year:

1. Innovation Pipeline
   - AI-powered solutions
   - Blockchain integration
   - IoT platform development
   - Extended reality products

2. Market Expansion
   - New geographic regions
   - Strategic partnerships
   - Product diversification
   - Channel optimization`
    }
  ];
  
  // Add pages with content
  for (const { title, content } of contents) {
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: 16,
      maxWidth: width - 100
    });
    
    // Add content
    page.drawText(content, {
      x: 50,
      y: height - 100,
      size: 12,
      maxWidth: width - 100
    });
  }
  
  // Save the PDF to a file
  const pdfBytes = await pdfDoc.save();
  
  // Ensure the test-assets directory exists
  const testAssetsDir = path.join(__dirname, 'test-assets');
  if (!fs.existsSync(testAssetsDir)) {
    fs.mkdirSync(testAssetsDir, { recursive: true });
  }
  
  // Write the PDF to a file
  const filePath = path.join(testAssetsDir, 'large-test.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  
  console.log('Large test PDF created at:', filePath);
}

createLargeTestPDF().catch(console.error); 