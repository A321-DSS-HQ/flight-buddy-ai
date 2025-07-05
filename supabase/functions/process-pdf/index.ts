import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log(`Processing document: ${documentId}`);

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) {
      throw new Error(`Failed to fetch document: ${docError.message}`);
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Extract text from PDF using PDF.js via a web service
    const formData = new FormData();
    formData.append('file', fileData, document.file_name);

    // Use a PDF text extraction service (you could also implement PDF.js directly)
    const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': 'demo', // Replace with actual PDF.co key or use alternative service
      },
      body: formData,
    });

    let extractedText = '';
    if (extractResponse.ok) {
      const extractResult = await extractResponse.json();
      extractedText = extractResult.body || '';
    } else {
      // Fallback: Basic text extraction (simplified for demo)
      const arrayBuffer = await fileData.arrayBuffer();
      const textDecoder = new TextDecoder();
      extractedText = textDecoder.decode(arrayBuffer);
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the PDF');
    }

    console.log(`Extracted ${extractedText.length} characters of text`);

    // Split text into chunks (approximately 1000 characters with overlap)
    const chunks = splitTextIntoChunks(extractedText, 1000, 200);
    console.log(`Created ${chunks.length} text chunks`);

    // Process chunks and create embeddings
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Create embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk.content,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Failed to create embedding for chunk ${i}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store chunk in database
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: chunk.content,
          page_number: chunk.page,
          section_title: chunk.section,
          embedding: embedding,
        });

      if (chunkError) {
        console.error(`Failed to store chunk ${i}:`, chunkError);
        throw new Error(`Failed to store chunk ${i}: ${chunkError.message}`);
      }

      processedChunks.push({
        index: i,
        content: chunk.content.substring(0, 100) + '...',
        page: chunk.page,
      });

      // Log progress
      if (i % 10 === 0) {
        console.log(`Processed ${i + 1}/${chunks.length} chunks`);
      }
    }

    // Update document status to completed
    await supabase
      .from('documents')
      .update({ 
        processing_status: 'completed',
        total_chunks: chunks.length,
      })
      .eq('id', documentId);

    console.log(`Successfully processed document ${documentId} with ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        chunks: processedChunks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Update document status to failed if we have documentId
    const body = await req.text();
    const data = JSON.parse(body || '{}');
    if (data.documentId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', data.documentId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function splitTextIntoChunks(text: string, chunkSize: number, overlap: number) {
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunkText = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastSentence = chunkText.lastIndexOf('.');
      const lastNewline = chunkText.lastIndexOf('\n');
      const breakPoint = Math.max(lastSentence, lastNewline);
      
      if (breakPoint > start + chunkSize * 0.5) {
        chunkText = chunkText.slice(0, breakPoint + 1);
        end = start + breakPoint + 1;
      }
    }

    // Extract page number from content (basic heuristic)
    const pageMatch = chunkText.match(/\bpage\s+(\d+)\b/i) || chunkText.match(/\b(\d+)\s*$/m);
    const pageNumber = pageMatch ? parseInt(pageMatch[1]) : Math.floor(chunkIndex / 5) + 1;

    // Extract section title (look for headings)
    const sectionMatch = chunkText.match(/^([A-Z][A-Z\s]{5,50})\n/m) || 
                        chunkText.match(/^\d+\.?\s+([A-Z][A-Za-z\s]{5,50})\n/m);
    const sectionTitle = sectionMatch ? sectionMatch[1].trim() : null;

    chunks.push({
      content: chunkText.trim(),
      page: pageNumber,
      section: sectionTitle,
    });

    start = end - overlap;
    chunkIndex++;

    // Prevent infinite loop
    if (start >= end) break;
  }

  return chunks;
}