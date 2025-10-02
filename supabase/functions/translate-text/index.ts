import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang } = await req.json();

    if (!text || !sourceLang) {
      return new Response(
        JSON.stringify({ error: 'Text and source language are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the correct model based on source language
    const modelMap: Record<string, string> = {
      'nep': 'Helsinki-NLP/opus-mt-ne-en',
      'sin': 'Helsinki-NLP/opus-mt-si-en',
    };

    const model = modelMap[sourceLang];
    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Unsupported language. Only Nepali (nep) and Sinhala (sin) are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Translating from ${sourceLang} using model: ${model}`);

    const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!HF_TOKEN) {
      throw new Error('HUGGING_FACE_ACCESS_TOKEN is not configured');
    }

    // Call Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);
      
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ error: 'Translation model is loading. Please try again in a few seconds.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Translation failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Translation result:', result);

    // Extract translated text from response
    let translatedText = '';
    if (Array.isArray(result) && result[0]?.translation_text) {
      translatedText = result[0].translation_text;
    } else if (result.translation_text) {
      translatedText = result.translation_text;
    } else {
      console.error('Unexpected response format:', result);
      return new Response(
        JSON.stringify({ error: 'Unexpected response format from translation API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-text function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
