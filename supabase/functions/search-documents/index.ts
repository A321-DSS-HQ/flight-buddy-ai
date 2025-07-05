import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, documentTypes } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log(`Searching for: "${query}"`);

    // Get user token from authorization header
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    
    // Initialize Supabase client with user context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    // Create embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to create search embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Build the SQL query for vector similarity search
    let sqlQuery = `
      SELECT 
        dc.id,
        dc.content,
        dc.page_number,
        dc.section_title,
        d.title as document_title,
        d.document_type,
        d.file_name,
        (dc.embedding <-> $1::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.processing_status = 'completed'
    `;

    const queryParams = [JSON.stringify(queryEmbedding)];

    // Filter by document types if specified
    if (documentTypes && documentTypes.length > 0) {
      sqlQuery += ` AND d.document_type = ANY($${queryParams.length + 1})`;
      queryParams.push(documentTypes);
    }

    sqlQuery += `
      ORDER BY dc.embedding <-> $1::vector
      LIMIT $${queryParams.length + 1}
    `;
    queryParams.push(limit);

    // Execute the search
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_similar_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.8,
        match_count: limit,
        document_types: documentTypes,
      });

    // If the RPC doesn't exist, fall back to direct query
    if (searchError && searchError.message.includes('function search_similar_chunks')) {
      console.log('Using fallback search method');
      
      // Simple text search as fallback
      let fallbackQuery = supabase
        .from('document_chunks')
        .select(`
          id,
          content,
          page_number,
          section_title,
          documents!inner(title, document_type, file_name)
        `)
        .textSearch('content', query)
        .eq('documents.processing_status', 'completed')
        .limit(limit);

      if (documentTypes && documentTypes.length > 0) {
        fallbackQuery = fallbackQuery.in('documents.document_type', documentTypes);
      }

      const { data: fallbackResults, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        throw new Error(`Search failed: ${fallbackError.message}`);
      }

      const formattedResults = fallbackResults?.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        document_title: chunk.documents.title,
        document_type: chunk.documents.document_type,
        file_name: chunk.documents.file_name,
        similarity: 0.5, // Default similarity for text search
      })) || [];

      return new Response(
        JSON.stringify({
          results: formattedResults,
          query,
          total: formattedResults.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`);
    }

    console.log(`Found ${searchResults?.length || 0} similar chunks`);

    return new Response(
      JSON.stringify({
        results: searchResults || [],
        query,
        total: searchResults?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching documents:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});