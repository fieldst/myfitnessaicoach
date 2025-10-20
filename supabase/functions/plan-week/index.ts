import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlanRequest {
  minutes: number;
  days: number;
  goal: string;
  style: string;
  intensity: string;
  experience: string;
  focus: string[];
  equipment: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: PlanRequest = await req.json();

    const minutes = Math.max(20, Math.min(90, body.minutes || 40));
    const days = Math.max(2, Math.min(10, body.days || 3));
    const goal = body.goal || 'recomp';
    const style = body.style || 'hybrid';
    const intensity = body.intensity || 'moderate';
    const experience = body.experience || 'intermediate';
    const focus = body.focus || [];
    const equipment = body.equipment || [];

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey || openaiKey === 'your_openai_api_key_here') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured. Please add your API key to continue.',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const prompt = `Create a ${days}-day workout plan with the following parameters:
- Goal: ${goal}
- Style: ${style}
- Experience: ${experience}
- Intensity: ${intensity}
- Minutes per session: ${minutes}
- Focus areas: ${focus.join(', ') || 'general fitness'}
- Equipment: ${equipment.join(', ') || 'bodyweight'}

Return a JSON array with ${days} workout days. Each day should have:
- id: unique string
- title: descriptive name (e.g., "Day 1: Upper Body Strength")
- summary: brief description of the workout
- minutes: estimated duration
- focus: array of focus areas
- tags: array of relevant tags
- blocks: array of workout blocks, each with:
  - kind: one of warmup, strength, metcon, skill, finisher, cooldown, circuit, workout
  - text: description of the exercise
  - minutes: duration for this block
  - loadRx: optional load prescription
  - equipment: array of equipment needed
  - scale: optional scaling options
  - coach: optional coaching cue

Make the workouts practical, safe, and appropriate for ${experience} level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness coach. Return only valid JSON, no markdown or explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let week;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      week = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { week },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request timeout - please try again',
        }),
        {
          status: 504,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate plan',
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});