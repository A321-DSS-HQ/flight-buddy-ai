import { VercelRequest, VercelResponse } from '@vercel/node';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createWorker } from 'tesseract.js';
import formidable from 'formidable';
import { readFileSync } from 'fs';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');

// Disable body parsing for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface PDFPageContent {
  pageNumber: number;
  text: string;
  textDensity: number;
  needsOCR: boolean;
}

interface ProcessedContent {
  text: string;
  metadata: {
    pages: number;
    title: string;
    author: string;
    subject: string;
    creator: string;
    producer: string;
    creationDate: string | null;
    modificationDate: string | null;
    processingMethod: 'text-extraction' | 'ocr' | 'hybrid';
    pageDetails: PDFPageContent[];
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Enhanced PDF extraction started');

    // Parse form data with formidable
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file || !Array.isArray(files.file) || files.file.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = files.file[0];
    
    if (!uploadedFile.filepath) {
      return res.status(400).json({ error: 'Invalid file upload' });
    }

    // Read the uploaded file
    const dataBuffer = readFileSync(uploadedFile.filepath);
    
    if (dataBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty file uploaded' });
    }

    console.log(`Processing PDF file: ${uploadedFile.originalFilename}, size: ${dataBuffer.length} bytes`);

    // Stage 1: Load PDF with PDF.js
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      verbosity: 0
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log(`PDF loaded successfully with ${pdfDoc.numPages} pages`);

    // Extract metadata
    const metadata = await pdfDoc.getMetadata();
    const info = metadata.info || {};

    // Stage 2: Process each page
    const pageContents: PDFPageContent[] = [];
    let totalTextLength = 0;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text from page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim();

      // Calculate text density (characters per "visual unit")
      const viewport = page.getViewport({ scale: 1.0 });
      const pageArea = viewport.width * viewport.height;
      const textDensity = pageText.length / (pageArea / 10000); // Normalized density

      const needsOCR = textDensity < 0.5 && pageText.length < 50; // Low density threshold

      pageContents.push({
        pageNumber: pageNum,
        text: pageText,
        textDensity,
        needsOCR
      });

      totalTextLength += pageText.length;
      
      console.log(`Page ${pageNum}: ${pageText.length} chars, density: ${textDensity.toFixed(2)}, OCR needed: ${needsOCR}`);
    }

    // Stage 3: OCR processing for pages that need it (simplified for Vercel)
    const ocrPages = pageContents.filter(page => page.needsOCR);
    
    if (ocrPages.length > 0 && ocrPages.length <= 3) { // Limit OCR to 3 pages for performance
      console.log(`Processing ${ocrPages.length} pages with OCR`);
      
      try {
        const worker = await createWorker('eng');
        
        for (const pageContent of ocrPages.slice(0, 3)) { // Process max 3 pages
          try {
            // Get page as canvas
            const page = await pdfDoc.getPage(pageContent.pageNumber);
            const viewport = page.getViewport({ scale: 1.5 }); // Moderate scale for performance
            
            // Create canvas
            const canvas = require('canvas').createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d');
            
            // Render page to canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Convert canvas to image buffer
            const imageBuffer = canvas.toBuffer('image/png');
            
            // Perform OCR with timeout
            const { data: { text } } = await Promise.race([
              worker.recognize(imageBuffer),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OCR timeout')), 15000)
              )
            ]) as any;
            
            if (text.trim().length > pageContent.text.length) {
              console.log(`OCR improved page ${pageContent.pageNumber}: ${text.trim().length} chars vs ${pageContent.text.length} chars`);
              pageContent.text = text.trim();
              pageContent.textDensity = text.trim().length / (viewport.width * viewport.height / 10000);
            }
            
          } catch (ocrError) {
            console.error(`OCR failed for page ${pageContent.pageNumber}:`, ocrError);
            // Keep original text extraction
          }
        }
        
        await worker.terminate();
      } catch (workerError) {
        console.error('OCR worker initialization failed:', workerError);
      }
    }

    // Stage 4: Combine all text and determine processing method
    const finalText = pageContents
      .map(page => page.text)
      .filter(text => text.length > 0)
      .join('\n\n');

    const processingMethod = ocrPages.length > 0 
      ? (pageContents.some(p => !p.needsOCR) ? 'hybrid' : 'ocr')
      : 'text-extraction';

    // Structure the extracted content
    const extractedContent: ProcessedContent = {
      text: finalText,
      metadata: {
        pages: pdfDoc.numPages,
        title: info.Title || uploadedFile.originalFilename || 'Untitled Document',
        author: info.Author || 'Unknown',
        subject: info.Subject || '',
        creator: info.Creator || '',
        producer: info.Producer || '',
        creationDate: info.CreationDate || null,
        modificationDate: info.ModDate || null,
        processingMethod,
        pageDetails: pageContents
      }
    };

    // Fallback content if no text was extracted
    if (!extractedContent.text.trim() && extractedContent.metadata.pages > 0) {
      extractedContent.text = `This document contains ${extractedContent.metadata.pages} page(s). Title: ${extractedContent.metadata.title}. The content may require specialized processing or contains primarily non-text elements.`;
    }

    console.log(`Enhanced PDF extraction completed: ${finalText.length} characters, method: ${processingMethod}`);

    return res.status(200).json({
      success: true,
      content: extractedContent.text,
      metadata: extractedContent.metadata,
      extractedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Enhanced PDF extraction failed:', error);
    
    return res.status(500).json({
      error: 'PDF processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
