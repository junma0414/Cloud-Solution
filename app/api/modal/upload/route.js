import { NextResponse } from 'next/server';

const USER_NAME = 'junma0614';

const githubToken = process.env.GH_TOKEN;
const repo = "junma0414/modalApp"; //process.env.GITHUB_REPO; // e.g., "junma0614/modal-deploy-service"
const branch = process.env.GITHUB_BRANCH || 'main';
const workflowFile = process.env.GITHUB_WORKFLOW_FILE || 'deploy.yml';

export async function POST(req) {
  const contentType = req.headers.get('content-type');
  const MODAL_API_URL = process.env.MODAL_API_URL;
  const MODAL_API_KEY = process.env.MODAL_API_KEY;

  // Handle FormData (file uploads)
  if (contentType && contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData();
      const action = formData.get('action');


      
      // Handle file chunk upload
      if (action === 'upload_chunk') {
        const file = formData.get('file');
        const session_id = formData.get('session_id');
        const chunk_index = formData.get('chunk_index');
        const relativePath = formData.get('relativePath');
      const original_filename=formData.get('original_filename');

console.log("formData received :", formData);


        // Validate required fields
        if (!file || !session_id || !chunk_index) {
          return NextResponse.json({
            success: false,
            error: "Missing required fields (file, session_id, chunk_index)"
          }, { status: 400 });
        }

        // Create new FormData with proper field names
        const modalFormData = new FormData();
        modalFormData.append('file', file, relativePath || file.name);
        modalFormData.append('session_id', session_id);
        modalFormData.append('chunk_index', chunk_index.toString());
modalFormData.append('relative_path', relativePath || file.name);
modalFormData.append('original_filename', original_filename)


console.log("formData sending to modal :", modalFormData);
        
       try {
          const response = await fetch(`${MODAL_API_URL}/api/upload/chunk`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${MODAL_API_KEY}`
            },
            body: modalFormData
          }); 

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }

          const responseData = await response.json();
          return NextResponse.json({ 
            ...responseData, 
            success: true 
          });
        } catch (error) {
          console.error('Chunk upload error:', error);
          return NextResponse.json({ 
            success: false,
            error: error.message 
          }, { status: 500 });
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }
  }

  // Handle JSON requests
  try {
    const body = await req.json();
    const { action } = body;
    
    console.log("Action:", action);
    
    let response;
    let responseData;
    
    // Check directory existence
    if (action === 'checkdir') {
      response = await fetch(`${MODAL_API_URL}/api/checkdir?path=${encodeURIComponent(body.path)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MODAL_API_KEY}`,
         'Content-Type': 'application/json',
        }
      });

      responseData = await response.json();
      return NextResponse.json({ 
        ...responseData, 
        success: true 
      });
    } 
    // Start upload session
    else if (action === 'start_upload') {

    //  console.log("starting upload with target path: ", target_path);
      response = await fetch(`${MODAL_API_URL}/api/upload/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MODAL_API_KEY}`
        },
        body: JSON.stringify({
          target_path: body.target_path
        })
      });
      responseData = await response.json();
      return NextResponse.json({ 
        ...responseData, 
        success: true 
      });
    }
    // Complete upload session
    else if (action === 'complete_upload') {
     
  console.log("completing upload with original filename: ", body.original_filename);
      
      response = await fetch(`${MODAL_API_URL}/api/upload/complete?session_id=${body.session_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MODAL_API_KEY}`
        }
      });

      responseData = await response.json();
      return NextResponse.json({ 
        ...responseData, 
        success: true 
      });
    }
    // Delete directory
    else if (action === 'deletedir') {
      response = await fetch(`${MODAL_API_URL}/api/deletedir?path=${encodeURIComponent(body.path)}&modelName=${encodeURIComponent(body.modelName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MODAL_API_KEY}`
        }
      });


  const triggerRes=await fetch(`https://api.github.com/repos/${repo}/actions/workflows/stop-app.yml/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: branch,
      inputs: {
        app_name: body.modelName
      }
    })
  });

  responseData = await response.json();
      return NextResponse.json({ 
        ...responseData, 
        success: true 
      });

  
    }
    // Deploy model
    else if (action === 'deploy') {
      const { modelName, modelClass, tokenizerClass, taskType, folderName } = body;

      const scriptContent = generateDeploymentScript(modelName, modelClass, tokenizerClass, taskType, folderName);
      const scriptPath = `scripts/${modelName}.py`;

      
       let sha = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${scriptPath}?ref=${branch}`, {
      headers: { Authorization: `Bearer ${githubToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
    }
  } catch (err) {
    console.log('Script does not exist yet (no SHA needed)');
  }

  // Step 2: Push file to GitHub
  const uploadRes = await fetch(`https://api.github.com/repos/${repo}/contents/${scriptPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Auto-deploy ${modelName}`,
      content: Buffer.from(scriptContent).toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`GitHub upload failed: ${JSON.stringify(err)}`);
  }

  console.log(`✅ Script pushed to GitHub at ${scriptPath}`);

  // Step 3: Trigger workflow
  const dispatchRes = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: branch,
      inputs: {
        script_name: scriptPath,
        app_name: modelName
      }
    })
  });

  if (!dispatchRes.ok) {
    const err = await dispatchRes.json();
    throw new Error(`deployment Workflow trigger failed: ${JSON.stringify(err)}`);
  }
  

  console.log(`🚀 GitHub Action triggered to stop & deploy app: ${modelName}`);

  const modelNameStandardized = modelName.replace(/_/g, "-");

  return NextResponse.json({ 
        success: true,
        endpoint: `https://${USER_NAME}--${modelNameStandardized}-fastapi-app.modal.run/inference`,
        message: "Deployment Done"
      });

    }
    // Unsupported action
    else {
      return NextResponse.json(
        { 
          success: false,
          error: `Unsupported action: ${action}` 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

function generateDeploymentScript(modelName, modelClass, tokenizerClass, TaskType, folderName) {
  console.log("Generating deployment script with:", modelName, modelClass, tokenizerClass, TaskType, folderName);

  const generationExtras = ['causal_lm', 'seq2seq_lm'].includes(TaskType)
    ? `   
"temperature": req.temperature or 0.7,
    "top_k": req.top_k or 50,
    "top_p": req.top_p or 0.9,
    "do_sample": req.do_sample if req.do_sample is not None else True,`
    : '';

  const classificationExtras = TaskType === 'sequence_classification'
    ? `
        if req.return_probs:
            probs = torch.softmax(outputs.logits, dim=-1)
            return {"predictions": probs.tolist()}
    `
    : '';

  const tokenClassificationExtras = TaskType === 'token_classification'
    ? `
        if req.return_probs:
            probs = torch.softmax(outputs.logits, dim=-1)
            return {"token_predictions": probs.tolist()}
    `
    : '';

  const maskedLMExtras = TaskType === 'masked_lm'
    ? `
            if req.top_k:
                top_probs, top_indices = torch.topk(torch.softmax(logits, dim=-1), k=req.top_k)
                predictions.append([
                    {"token": tokenizer.decode([idx.item()]), "score": prob.item()}
                    for prob, idx in zip(top_probs, top_indices)
                ])
            else:
                predicted_token_id = logits.argmax().item()
                predictions.append({"predicted_token": tokenizer.decode([predicted_token_id])})
    `
    : '';

  const taskLogic = {
    sequence_classification: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to("cuda")
        outputs = model(**inputs)
        ${classificationExtras}
        predictions = outputs.logits.argmax(dim=-1).tolist()
        return {"predictions": predictions}
    `,

    causal_lm: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        generation_config = {
            "max_new_tokens": req.max_tokens or 100,
            ${generationExtras}
        }
        responses = []
        for text in texts:
            inputs = tokenizer(text, return_tensors="pt").to("cuda")
            output = model.generate(**inputs, **generation_config)
            decoded = tokenizer.decode(output[0], skip_special_tokens=True)
            responses.append(decoded)
        return {"responses": responses}
    `,

    seq2seq_lm: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        generation_config = {
            "max_new_tokens": req.max_tokens or 100,
            ${generationExtras}
        }
        results = []
        for text in texts:
            inputs = tokenizer(text, return_tensors="pt").to("cuda")
            output = model.generate(**inputs, **generation_config)
            decoded = tokenizer.decode(output[0], skip_special_tokens=True)
            results.append(decoded)
        return {"responses": results}
    `,

    masked_lm: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        predictions = []
        for text in texts:
            masked_input = text.replace("[MASK]", tokenizer.mask_token or "[MASK]")
            inputs = tokenizer(masked_input, return_tensors="pt").to("cuda")
            with torch.no_grad():
                output = model(**inputs)
            mask_token_index = (inputs.input_ids == tokenizer.mask_token_id).nonzero(as_tuple=True)[1].item()
            logits = output.logits[0, mask_token_index]
            ${maskedLMExtras}
        return {"predictions": predictions}
    `,

    token_classification: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to("cuda")
        outputs = model(**inputs)
        ${tokenClassificationExtras}
        predictions = outputs.logits.argmax(dim=-1).tolist()
        return {"token_predictions": predictions}
    `,

question_answering: `
        # Normalize input to list
        qa_inputs = req.input_text if isinstance(req.input_text, list) else [req.input_text]


        
        results = []
        for qa in qa_inputs:
            if not isinstance(qa, dict) or 'question' not in qa or 'context' not in qa:
                results.append({
                    "error": "Each input must be a dict with 'question' and 'context'",
                    "input": qa
                })
                continue
                
            try:
                inputs = tokenizer(
                    qa['question'], 
                    qa['context'],
                    return_tensors="pt",
                    truncation=True,
                    max_length=req.max_tokens or 512
                ).to("cuda")
                
                outputs = model(**inputs)
                
                #if req.top_k and req.top_k > 1:
                if req.top_k and req.top_k > 1:
                    # Get top k start/end positions
                    start_scores = outputs.start_logits
                    end_scores = outputs.end_logits

                    valid_top_k=min(req.top_k, len(start_scores[0]))
                    
                    # Get top k combinations
                    start_indices = torch.topk(start_scores, k=valid_top_k).indices[0]
                    end_indices = torch.topk(end_scores, k=valid_top_k).indices[0]
                    
                    answers = []
                    for start in start_indices:
                        for end in end_indices:
                            if end >= start:  # Only consider valid spans
                                answer_ids = inputs['input_ids'][0][start:end+1]
                                answers.append({
                                    "text": tokenizer.decode(answer_ids, skip_special_tokens=True),
                                    "score": (start_scores[0][start] + end_scores[0][end]).item(),
                                    "start": start.item(),
                                    "end": end.item()
                                })
                    
                    # Sort by combined score and return top k
                    answers = sorted(answers, key=lambda x: x["score"], reverse=True)[:valid_top_k]
                    results.append({
                        "question": qa['question'],
                        "answers": answers
                    })
                else:
                    # Default single answer return
                    start = outputs.start_logits.argmax()
                    end = outputs.end_logits.argmax()
                    answer_ids = inputs['input_ids'][0][start:end+1]
                    answer = tokenizer.decode(answer_ids, skip_special_tokens=True)
                    results.append({
                        "question": qa['question'],
                        "answer": answer,
                        "start": start.item(),
                        "end": end.item()
                    })
                    
            except Exception as e:
                results.append({
                    "question": qa.get('question', 'Unknown'),
                    "error": str(e)
                })
        
        return {"results": results}
    `,

    embedding: `
        texts = req.input_text if isinstance(req.input_text, list) else [req.input_text]
        inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=512).to("cuda")
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1).tolist()
        return {"embeddings": embeddings}
    `
  };

  if (!taskLogic[TaskType]) {
    throw new Error("Unsupported task type: " + TaskType);
  }

  const script = `
import modal

    
app = modal.App("${modelName}")

volume = modal.Volume.from_name("llm-models")
image = modal.Image.debian_slim().pip_install(
    "torch>=2.0.0",
    "transformers[torch]",
    "accelerate>=0.21.0",
    "fastapi",
    "pydantic"
)


@app.function(image=image, volumes={"/model": volume}, gpu="A10G", timeout=600)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    from pydantic import BaseModel
    from typing import Union, List, Optional
    import torch
    from transformers import ${tokenizerClass}, ${modelClass}
    model_path = "/model/${folderName}"
    tokenizer = ${tokenizerClass}.from_pretrained(model_path)
    model = ${modelClass}.from_pretrained(model_path).to("cuda")


    web_app = FastAPI()

    class InputRequest(BaseModel):
        input_text: Union[str, List[str], dict, List[dict]]
        max_tokens: Optional[int] = None
        temperature: Optional[float] = None
        top_k: Optional[int] = None
        top_p: Optional[float] = None
        do_sample: Optional[bool] = None
        return_probs: Optional[bool] = None

    @web_app.post("/inference")
    def predict(req: InputRequest):
        ${taskLogic[TaskType]}

    return web_app
`;

  console.log("Generated script:\n", script);
  return script;
}