import { VercelRequest, VercelResponse } from '@vercel/node';
import pdf from 'pdf-parse';

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
    console.log('PDF extraction started');
    
    // Parse the uploaded file from form data
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content must be multipart/form-data' });
    }

    // Get raw body buffer
    const chunks: Buffer[] = [];
    
    // Handle the raw buffer from the request
    if (req.body && Buffer.isBuffer(req.body)) {
      chunks.push(req.body);
    } else {
      // If body is not a buffer, we need to handle the multipart data
      return res.status(400).json({ error: 'Invalid file data format' });
    }

    const dataBuffer = Buffer.concat(chunks);
    
    if (dataBuffer.length === 0) {
      return res.status(400).json({ error: 'No file data received' });
    }

    console.log(`Processing PDF buffer of size: ${dataBuffer.length} bytes`);

    // Extract text using pdf-parse
    const pdfData = await pdf(dataBuffer);
    
    console.log(`Extracted text from ${pdfData.numpages} pages`);

    // Structure the extracted content
    const extractedContent = {
      text: pdfData.text.trim(),
      metadata: {
        pages: pdfData.numpages,
        info: pdfData.info,
        title: pdfData.info?.Title || 'Untitled Document',
        author: pdfData.info?.Author || 'Unknown',
        subject: pdfData.info?.Subject || '',
        creator: pdfData.info?.Creator || '',
        producer: pdfData.info?.Producer || '',
        creationDate: pdfData.info?.CreationDate || null,
        modificationDate: pdfData.info?.ModDate || null
      }
    };

    // If no text was extracted, provide fallback content
    if (!extractedContent.text && extractedContent.metadata.pages > 0) {
      extractedContent.text = `This document contains ${extractedContent.metadata.pages} page(s). Title: ${extractedContent.metadata.title}. The content may be image-based or require OCR processing.`;
    }

    console.log('PDF extraction completed successfully');

    return res.status(200).json({
      success: true,
      content: extractedContent.text,
      metadata: extractedContent.metadata,
      extractedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    
    return res.status(500).json({
      error: 'PDF processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}