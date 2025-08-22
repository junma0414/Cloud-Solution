import { NextResponse} from 'next/server';
//import { supabase } from '../../../lib/supabase/client';

//import { cookies } from 'next/headers';

//import { cookies, headers } from 'next/headers';

//import { createServerActionClient } from '@supabase/auth-helpers-nextjs';

//import { createServerClient } from '@supabase/auth-helpers-nextjs';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies ,headers} from 'next/headers'

// Replace your current supabase import with:
//const supabase = createRouteHandlerClient({ cookies })



// Parameter configuration for each task type
const TASK_PARAMETERS = {
  'causal_lm': {
    defaults: {
      max_tokens: 200,
      temperature: 0.7,
      top_k: 50,
      top_p: 1.0,
      do_sample: true
    },
    required: []
  },
  'seq2seq_lm': {
    defaults: {
      max_tokens: 200,
      temperature: 0.7,
      top_k: 50,
      top_p: 1.0,
      do_sample: true
    },
    required: []
  },
  'sequence_classification': {
    defaults: {
      return_probs: false
    },
    required: []
  },
  'token_classification': {
    defaults: {
      return_probs: false
    },
    required: []
  },
  'masked_lm': {
    defaults: {
      top_k: 50
    },
    required: []
  },
  'question_answering': {
    defaults: {
      max_tokens: 200,
      top_k: 50
    },
    required: []
  },
  'embedding': {
    defaults: {},
    required: []
  }
};

{/*
export async function POST(request) {

// Initialize authenticated client
   const cookieStore =await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });


  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("[DEBUG] Supabase user:", user);
  console.log("[DEBUG] Supabase error:", authError);

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', details: authError?.message },
      { status: 401 }
    );
  }



  let job;
  try {



   
    const requestBody = await request.json();
    
 console.log("debug request bodya is: ", requestBody.input_texts);
    
    // Destructure with proper parameter handling
    const {
      model_id,
      model_name,
      model_display_name,
      model_task_type,
      endpoint,
      data_source_id,
      data_source_name,
      data_source_type,
      created_by,
     created_name,
      input_texts,
      params = {}
    } = requestBody;

    // Validate required parameters
    if (!model_id || !data_source_id || input_texts === undefined || !endpoint) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

       // ===== ADD THE VALIDATION CODE HERE =====
    const inputTexts = Array.isArray(input_texts) ? 
      input_texts : 
      [input_texts];

    // Validate Q&A inputs
 if (model_task_type === 'question_answering') {
  try {
    // Create a mutable copy of inputTexts
    let processedInputs = Array.isArray(inputTexts) ? 
      [...inputTexts] : 
      [inputTexts];

    // Parse and validate each input
    const validatedInputs = [];

   console.log("[DEBUG BACK END]inputTexts are: ", processedInputs);
    for (const input of processedInputs) {
      let parsedInput = input;

      // Handle string inputs
      if (typeof parsedInput === 'string') {
        try {
          parsedInput = JSON.parse(parsedInput);
          if (typeof parsedInput === 'string') parsedInput = JSON.parse(parsedInput); // Handle double-encoded strings
        } catch (e) {
          throw new Error(`Invalid JSON format in input: ${input}`);
        }
      }

      // Handle array of strings/objects (nested arrays)
      if (Array.isArray(parsedInput)) {
        for (const item of parsedInput) {
          if (typeof item === 'string') {
            validatedInputs.push(JSON.parse(item));
          } else {
            validatedInputs.push(item);
          }
        }
      } else {
        validatedInputs.push(parsedInput);
      }
    }

    // Final validation
    for (const input of validatedInputs) {
      if (typeof input !== 'object' || !input.question || !input.context) {
        throw new Error(
          "For Q&A tasks, each input must be an object with 'question' and 'context'. " +
          "Received: " + JSON.stringify(input)
        );
      }
    }

    // Use validatedInputs directly in the inference request
    requestBody.input_texts = validatedInputs;
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}


    // Get parameter configuration for this task type
    const taskConfig = TASK_PARAMETERS[model_task_type] || TASK_PARAMETERS['causal_lm'];
    
    // Merge provided params with defaults
    const inferenceParams = {
      ...taskConfig.defaults,
      ...params
    };

    // Validate required parameters are present
    for (const param of taskConfig.required) {
      if (inferenceParams[param] === undefined) {
        return NextResponse.json(
          { error: `Missing required parameter: ${param}` },
          { status: 400 }
        );
      }
    }

     console.log("[debug] responseBody: ", requestBody);



    // Create job record
    const { data: createdJob, error: insertError } = await supabase
      .from('inference_jobs')
      .insert({
        ...requestBody,
        created_by: user.id, // Use authenticated user ID
        created_name: user.email,
        status: 'running',
        job_start_ts: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
         console.log("[insert error]", insertError); 
          throw insertError;
}
    job = createdJob;

    // Prepare inference request dynamically based on task type
    const inferenceRequest = {
      input_text: input_texts,
      ...inferenceParams
    };

    // Call inference endpoint
    const inferenceResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`
      },
      body: JSON.stringify(inferenceRequest)
    });

    if (!inferenceResponse.ok) {
      const errorData = await inferenceResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Inference failed with status ${inferenceResponse.status}`);
    }

    const inferenceResults = await inferenceResponse.json();

    // Update job with results
    const { error: updateError } = await supabase
      .from('inference_jobs')
      .update({
        results: inferenceResults,
        status: 'completed',
        job_finish_ts: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      job_id: job.id,
      ...inferenceResults
    });
    
  } catch (error) {
    console.error('Inference error:', error);
    
    if (job?.id) {
      await supabase
        .from('inference_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          job_finish_ts: new Date().toISOString()
        })
        .eq('id', job.id);
    }

    return NextResponse.json(
      { 
        error: "Inference failed",
        details: error.message 
      },
      { status: 500 }
    );
  }
} */}

export async function POST(request) {
  try {
    const {
      input_texts,
      model_task_type,
      endpoint,
      params = {}
    } = await request.json();

    const TASK_PARAMETERS = {
      causal_lm: { defaults: { max_tokens: 200, temperature: 0.7, top_k: 50, top_p: 1.0, do_sample: true }, required: [] },
      seq2seq_lm: { defaults: { max_tokens: 200, temperature: 0.7, top_k: 50, top_p: 1.0, do_sample: true }, required: [] },
      sequence_classification: { defaults: { return_probs: false }, required: [] },
      token_classification: { defaults: { return_probs: false }, required: [] },
      masked_lm: { defaults: { top_k: 50 }, required: [] },
      question_answering: { defaults: { max_tokens: 200, top_k: 50 }, required: [] },
      embedding: { defaults: {}, required: [] }
    };

    const config = TASK_PARAMETERS[model_task_type] || TASK_PARAMETERS['causal_lm'];
    const inferenceParams = { ...config.defaults, ...params };

    const inferenceRequest = {
      input_text: input_texts,
      ...inferenceParams
    };

    const inferenceResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`
      },
      body: JSON.stringify(inferenceRequest)
    });

    if (!inferenceResponse.ok) {
      const errorData = await inferenceResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Inference failed with status ${inferenceResponse.status}`);
    }

    const results = await inferenceResponse.json();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Unknown error during inference' },
      { status: 500 }
    );
  }
}
