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
    const { thumbnailUrl } = await req.json();
    
    if (!thumbnailUrl) {
      return new Response(
        JSON.stringify({ error: 'Thumbnail URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating prompts for thumbnail:', thumbnailUrl);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing images and creating detailed, creative prompts for image generation. Generate 3 distinct and detailed prompts that could recreate similar images. Each prompt should be descriptive, specific, and suitable for AI image generation. Return ONLY a JSON array of 3 strings, nothing else.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this YouTube thumbnail and create 3 different creative prompts that could be used to generate similar images. Focus on the composition, style, colors, and mood. Return your response as a JSON array of exactly 3 strings.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: thumbnailUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate prompts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received');
    
    let prompts: string[];
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    try {
      // Try to parse as JSON
      prompts = JSON.parse(content);
    } catch {
      // If not valid JSON, try to extract JSON array from the text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        prompts = content
          .split('\n')
          .filter((line: string) => line.trim())
          .slice(0, 3);
      }
    }

    // Ensure we have exactly 3 prompts
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Invalid prompts format');
    }

    // Take first 3 prompts and clean them
    prompts = prompts
      .slice(0, 3)
      .map((p: string) => typeof p === 'string' ? p.trim() : String(p));

    console.log('Successfully generated prompts:', prompts.length);

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-prompts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
