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
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for user's own Gemini API key first, then fall back to Lovable AI
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    console.log('Generating image for prompt:', prompt.substring(0, 50) + '...');

    // Enhanced prompt for 16:9 aspect ratio
    const enhancedPrompt = `Create a high-quality 16:9 aspect ratio image. ${prompt}. The image should be cinematic, professional, and visually striking with a 16:9 widescreen composition.`;

    let response;
    
    // Try using user's Gemini API key first if available
    if (GEMINI_API_KEY) {
      console.log('Using user Gemini API key');
      
      // Use Gemini 2.5 Flash Image Preview (aka Nano Banana)
      try {
        response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: enhancedPrompt }
              ]
            }]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Gemini API failed:', errorText);
          console.log('Falling back to Lovable AI');
          response = null;
        } else {
          const data = await response.json();
          console.log('Successfully generated image with user Gemini API');
          
          // Extract base64 image data from response
          const imageData = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
          
          if (!imageData) {
            console.log('No image data from Gemini, falling back to Lovable AI');
            response = null;
          } else {
            return new Response(
              JSON.stringify({ 
                image: `data:image/png;base64,${imageData}`,
                source: 'user_gemini_api'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error) {
        console.error('Error with Gemini API:', error);
        response = null;
      }
    }
    
    // Fall back to Lovable AI Gateway if user key not available or failed
    if (!response) {
      if (!LOVABLE_API_KEY) {
        console.error('No API keys configured');
        return new Response(
          JSON.stringify({ error: 'AI service not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Using Lovable AI Gateway');
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });
    }

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
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI image generation response received');
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log('Successfully generated image');

    return new Response(
      JSON.stringify({ 
        image: imageUrl,
        source: 'lovable_ai'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
