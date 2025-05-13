// app/api/modal/upload/route.js
import { NextResponse } from 'next/server';
import { tmpdir } from 'os';
import {dirname, join } from 'path';

import {
  access, mkdir, writeFile, readdir, readFile, appendFile, unlink, rm, stat
} from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB
const ALLOWED_EXTENSIONS = ['.tar.gz', '.gz', '.tar', '.bin', '.pt', '.safetensors', '.txt','.json','.model','.pth'];
const VOLUME_NAME = 'llm-models';
const USER_NAME='junma0614';
const MODAL_APP_ENTRY = 'modal_app.py'; // customize if needed
const MODAL_DEPLOY_NAME = 'my-model-service'; // customize if needed

function cleanOutput(buffer) {
  return buffer.toString('utf8').replace(/[^\x00-\x7F]/g, '');
}

async function runModalCommand(command) {
  const env = {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
  };

  const { stdout, stderr } = await execAsync(`modal ${command}`, {
    env,
    encoding: 'buffer',
    timeout: 300000 // 5 minutes
  });

  if (stderr?.length) console.error('Modal stderr:', cleanOutput(stderr));
  return cleanOutput(stdout);
}


async function checkFolderExists(volumeName, folderName) {
  try {
    const output = await runModalCommand(`volume ls ${volumeName} --json`);
    const items = JSON.parse(output);
  
   
    console.log("checking folder:", folderName);
    console.log("checking items:", items);
 //console.log("checking items files:", items[0].Filename);

if (!items || items.length === 0) {
      return false;
    }
       
 
    return items.some(file => {
      const fileName = file?.Filename || file?.name || '';
      const normalizedFileName = fileName.replace(/\/$/, '');
      const normalizedFolderName = folderName.replace(/\/$/, '');
      console.log("normalizedfilename: ", normalizedFileName);
      return normalizedFileName === normalizedFolderName;
    });
  } catch (err) {
    console.error('Folder check failed:', err);
    return false;
  }
}



export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (token !== process.env.NEXT_PUBLIC_MODAL_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json();
 console.log("pass body: ", body);
    return handleJsonUploadActions(body);
  }

 if (contentType.includes('multipart/form-data')) {
  const formData = await req.formData();
 // if (formData.has('files[]')) {
 if (formData.has('files')) {
    return handleFolderUpload(formData);
  }
  return handleMultipartUpload(formData);
}

  return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
}

async function handleFolderUpload(formData) {
  const files = formData.getAll('files');
  const folderName = formData.get('folderName');
  const uploadId = formData.get('uploadId');
  const tempDir = join(tmpdir(), 'modal-uploads', uploadId);

  try {
    await mkdir(tempDir, { recursive: true });

    // Process each file
    for (const file of files) {
      // Get the stored relative path from FormData
      const relativePath = file.name;
     const absolutePath = join(tempDir, relativePath);

      
      // Ensure parent directories exist (using imported dirname)
      await mkdir(dirname(absolutePath), { recursive: true });

console.log('Processing file:', {
  originalName: file.name,
  relativePath: relativePath,
  absolutePath: absolutePath,
  parentDir: dirname(absolutePath)
});
      
      // Write file
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(absolutePath, buffer);
    }

    // Upload to Modal volume
    const folderPath = join(tempDir, folderName);
   console.log("folder path is: ", folderPath);
    const uploadCmd = `volume put ${VOLUME_NAME} ${folderPath}`;
    console.log('Executing:', uploadCmd);
    await runModalCommand(uploadCmd);

    // Cleanup
    await rm(tempDir, { recursive: true });

    return NextResponse.json({
      success: true,
      volumePath: `modal://${VOLUME_NAME}/${folderName}`
    });

  } catch (error) {
    console.error('Upload failed:', error);
    await rm(tempDir, { recursive: true }).catch(() => {});
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

async function handleJsonUploadActions(body) {
  const { action, fileName, uploadId, checkType } = body;
 


   console.log("filename:", fileName)

 if (action === 'complete_folder') {
    try {
      // Verify the folder exists in temp storage
      const tempDir = join(tmpdir(), 'modal-uploads', uploadId);
      const folderPath = join(tempDir, folderName);
      
      const exists = await access(folderPath).then(() => true).catch(() => false);
      if (!exists) throw new Error('Folder not found in temporary storage');

      // Upload to Modal volume
      await runModalCommand(`volume put ${VOLUME_NAME} ${folderPath}`);

      // Cleanup
      await rm(tempDir, { recursive: true });

      return NextResponse.json({
        success: true,
        volumePath: `modal://${VOLUME_NAME}/${folderName}`
      });

    } catch (error) {
      await rm(join(tmpdir(), 'modal-uploads', uploadId), { recursive: true }).catch(() => {});
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

if (action === 'deploy') {
  const {modelName, modelClass, tokenizerClass, taskType, folderName}=body;

 console.log("deploy body is: ", body);

const scriptPath = join(tmpdir(), `${modelName}_deploy.py`);

  
  try {
    // 1. Generate and write deployment script
    const scriptContent = generateDeploymentScript(
      modelName, 
      modelClass, 
      tokenizerClass, 
      taskType, 
      folderName
    );

    console.log("the script for deployment is:", scriptContent);
    await writeFile(scriptPath, scriptContent);


try {
  const stats = await stat(scriptPath);
  console.log(`File exists, size: ${stats.size} bytes`);
} catch (e) {
  console.error('File verification failed:', e);
  throw new Error('Failed to verify script file creation');
}


     
    
    // Run deployment
   console.log('Deploying with modal using script at:', scriptPath);
const output = await runModalCommand(`deploy ${scriptPath}`);
   // const output = await runModalCommand(`deploy ${scriptPath} --name ${modelName}-inference`);

console.log('Modal CLI Output:', output);

if (!/App deployed.*!/.test(output)) {
  throw new Error('Deployment may have failed: ' + output);
}
   const modelNameStandardized = modelName.replace(/_/g, "-"); 
//https://junma0614--predict-inference-fastapi-app.modal.run/inference
    return NextResponse.json({ 
      success: true, 
      endpoint: `https://${USER_NAME}--${modelNameStandardized}-fastapi-app.modal.run/inference`,
      message: output
    });
  } catch (err) {
    return NextResponse.json({ 
      error: 'Deployment failed', 
      detail: err.message 
    }, { status: 500 });
  }
}


  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

if (action === 'check_exists' && checkType === 'volume') {
  const exists = await checkFolderExists(VOLUME_NAME, fileName);
  return NextResponse.json({exists});
}

  if (action === 'complete') {
    return handleCompleteUpload(uploadId, fileName);
  }

  if (action === 'cleanup') {
    return handleCleanup(uploadId);
  }

  if (action === 'deploy') {
    return handleDeploy();
  }

  return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
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
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Union, List, Optional
import torch
from transformers import ${tokenizerClass}, ${modelClass}

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




async function handleMultipartUpload(formData) {

 const file = formData.get('file'); // Changed from 'chunk' to 'file'
  
  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json(
      { error: 'Invalid file upload' },
      { status: 400 }
    );
  }


  let tempDir = null;
  let filePath = null;

  try {
    
    const fileName = formData.get('fileName');
    const uploadId = formData.get('uploadId');
    const isSingleChunk = formData.get('isSingleChunk') === 'true';
    const chunkIndex = formData.get('chunkIndex');
    const totalChunks = formData.get('totalChunks');

    if (!fileName || !uploadId) {
      return NextResponse.json({ error: 'Missing fileName or uploadId' }, { status: 400 });
    }

    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({
        error: `Unsupported file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        invalidExtension: true
      }, { status: 415 });
    }

    tempDir = join(tmpdir(), 'modal-uploads', uploadId);
    await mkdir(tempDir, { recursive: true });

    if (isSingleChunk) {
      filePath = join(tempDir, fileName);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    } else {
      if (!chunkIndex || !totalChunks) {
        return NextResponse.json({ error: 'Missing chunk metadata' }, { status: 400 });
      }

      const chunkPath = join(tempDir, `${chunkIndex}.part`);
      await writeFile(chunkPath, Buffer.from(await file.arrayBuffer()));

      const chunkFiles = (await readdir(tempDir)).filter(f => f.endsWith('.part'));
      if (chunkFiles.length < parseInt(totalChunks)) {
        return NextResponse.json({ success: true, received: chunkFiles.length });
      }

      // Merge chunks
      filePath = join(tempDir, fileName);
      for (const part of chunkFiles.sort((a, b) => parseInt(a) - parseInt(b))) {
        const data = await readFile(join(tempDir, part));
        await appendFile(filePath, data);
        await unlink(join(tempDir, part));
      }
    }

    // Final file checks
    const stats = await stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      await rm(tempDir, { recursive: true });
      return NextResponse.json({ error: 'File exceeds maximum size' }, { status: 413 });
    }

    if (await checkFileExists(fileName)) {
      await rm(tempDir, { recursive: true });
      return NextResponse.json({ error: 'File already exists', fileExists: true }, { status: 409 });
    }

    await runModalCommand(`volume put ${VOLUME_NAME} ${filePath} ${fileName}`);

    await rm(tempDir, { recursive: true });

    return NextResponse.json({
      success: true,
      volumePath: `modal://${VOLUME_NAME}/${fileName}`,
      fileSize: stats.size
    });

  } catch (error) {
    console.error('Upload failed:', error);
    if (filePath) await unlink(filePath).catch(() => {});
    if (tempDir) await rm(tempDir, { recursive: true }).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCompleteUpload(uploadId, fileName) {
  const dir = join(tmpdir(), 'modal-uploads', uploadId);
  const filePath = join(dir, fileName);
  try {
    const stats = await stat(filePath);
    await runModalCommand(`volume put ${VOLUME_NAME} ${filePath} ${fileName}`);
    await rm(dir, { recursive: true });
    return NextResponse.json({
      success: true,
      volumePath: `modal://${VOLUME_NAME}/${fileName}`,
      fileSize: stats.size
    });
  } catch (err) {
    await rm(dir, { recursive: true }).catch(() => {});
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleCleanup(uploadId) {
  const dir = join(tmpdir(), 'modal-uploads', uploadId);
  await rm(dir, { recursive: true }).catch(() => {});
  return NextResponse.json({ success: true });
}

async function handleDeploy() {
  try {
    const output = await runModalCommand(`deploy ${MODAL_APP_ENTRY} --name ${MODAL_DEPLOY_NAME}`);
    return NextResponse.json({ success: true, message: output });
  } catch (err) {
    console.error('Deployment error:', err);
    return NextResponse.json({ error: 'Deployment failed', detail: err.message }, { status: 500 });
  }
}
