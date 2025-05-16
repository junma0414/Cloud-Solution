// OperationsTab.js
'use client';
import { useState, useEffect,useRef } from 'react';
import styles from './Operations.module.css';
import { supabase } from '../lib/supabase/client';
import { HiCog, HiServer, HiLightBulb, HiCube } from 'react-icons/hi2';
import { HiOutlineUpload } from 'react-icons/hi';

export default function OperationsTab() {
  const [activeSubTab, setActiveSubTab] = useState('model');
  const [models, setModels] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [isDataSourceLoading, setIsDataSourceLoading] = useState(false);
  const [inferenceJobs, setInferenceJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false); // New state for delete operation

  const [isTableLoading, setIsTableLoading] = useState(false); // New state for table loading



const fetchData = async (type) => {
  if (type === 'data') {
    setIsDataSourceLoading(true);
  } else {
    setIsTableLoading(true);
  }

  try {
    const table = type === 'model' ? 'models' : type === 'data' ? 'data_sources' : 'inference_jobs';

 // Create base query
    let query = supabase.from(table).select('*');
    
    // Apply different ordering based on table type
    if (type === 'inference') {
      query = query.order('job_start_ts', { ascending: false });
    } else {
      query = query.order('uploaded_at', { ascending: false });
    }

//    const { data, error } = await supabase.from(table).select('*').order('uploaded_at', { ascending: false });

  const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (type === 'model') setModels(data);
    else if (type === 'data') setDataSources(data);
    else setInferenceJobs(data);
  } catch (error) {
    console.error('Fetch error:', {
      error: error,
      type: type,
      table: table,
      stack: error.stack
    });
    // Optionally set error state to display to user
    setUploadError(`Failed to load ${type} data: ${error.message}`);
  } finally {
    if (type === 'data') {
      setIsDataSourceLoading(false);
    } else {
      setIsTableLoading(false);
    }
  }
};  



 const handleSubTabChange = (tab) => {
    if (activeSubTab !== tab) {  // Only fetch if tab actually changed
      setActiveSubTab(tab);
      fetchData(tab);  // Fetch data for the new tab
    }
  };

useEffect(() => {
    fetchData('model');
    fetchData('data');
  }, []);

//////////////////////////////////////////////////////////////Model related//////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const uploadDirectoryToModal = async (files, apiKey, folderName) => {
  const uploadId = `upload-${Date.now()}`;
  
  try {
    // 1. Check if directory exists

   console.log("checking folder existence......")
    const checkResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkdir',
        path: folderName
      })
    });
  
  if (!checkResponse.ok) {
  throw new Error(`Check failed: ${checkResponse.status}`);
}
   
    const checkData = await checkResponse.json();
  console.log("response is: ", checkData);
    if (!checkData.success) {
  throw new Error(checkData.error || "Directory check failed");
}

if (checkData.exists) {
  throw new Error(`Directory "${folderName}" already exists`);
}

    // 2. Start upload session

   console.log("starting upload session ...");
    const sessionResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start_upload',
        target_path: folderName
      })
    });

    const { session_id } = await sessionResponse.json();

     console.log("finishing upload session  with session_id: ", session_id);

    // 3. Upload files in chunks
   // const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
   const CHUNK_SIZE = 4 * 1024 * 1024; //4MB to meet the free plan of vercel 
    for (const file of files) {
      const fileSize = file.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
      const relativePath = file.webkitRelativePath || `${folderName}/${file.name}`;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {

  console.log("loading file: ", file, " at chunk: ", chunkIndex);
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk, relativePath);
        formData.append('session_id', session_id);
        formData.append('chunk_index', chunkIndex);
        formData.append('action', 'upload_chunk');
formData.append('original_filename', file.name);
formData.append('relativePath', relativePath);

        const uploadResponse = await fetch('/api/modal/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks} of ${file.name}`);
        }

        // Update progress
        const progress = ((chunkIndex + 1) / totalChunks) * 100;
        setUploadProgress(Math.round(progress));
      }
    }
       
    // 4. Complete upload

      console.log("completing uploading");
    const completeResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'complete_upload',
        session_id,
        total_chunks: 0, // Not used in your backend but required by API
        original_filename: folderName
      })
    });

    const completeData = await completeResponse.json();
    if (!completeData.status === 'complete') {
      throw new Error('Failed to complete upload');
    }

    return { 
      success: true, 
      directoryPath: `modal://llm-models/${folderName}`,
      extractedFiles: completeData.extracted_files
    };
  } catch (error) {
    console.error('Directory upload failed:', error);
    
    // Cleanup on failure
{/*
    await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cleanup',
        session_id: uploadId,
        path: folderName
      })
    }).catch(console.error);  */}

    throw error;
  }
};

const deleteModel = async (id, modalPath) => {
  if (!confirm('Are you sure you want to delete this model folder? This action cannot be undone.')) return;
  
  setIsDeleting(true);
  try {
    // 1. Get the model record
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('id, name, modal_path, display_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!model) throw new Error('Model not found');

    // Extract folder name from modal_path (format: modal://llm-models/folderName)
    const folderName = model.modal_path.split('/').pop();

    // 2. Delete from Modal storage
    const deleteResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'deletedir',
        path: folderName,
        modelName: model.display_name
      })
    });

   console.log("deletion response: ", deleteResponse);

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(errorData.error || 'Failed to delete directory');
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 4. Refresh the model list
    await fetchData('model');
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    alert(`Delete failed: ${error.message}`);
    return false;
  } finally {
    setIsDeleting(false);
  }
};

const checkModelExists = async (folderName) => {
  try {
    const response = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'checkdir',
        path: folderName
      })
    });

    const data = await response.json();
    return data.exists || false;
  } catch (error) {
    console.error('Check failed:', error);
    return false;
  }
}; 

const handleModelUpload = async ({ folder, metadata = {} }) => {
  // Get folder name from the first file's path or generate a unique one
  const folderName = folder[0]?.webkitRelativePath?.split('/')[0] || `model-${Date.now()}`;
  
  if (!folder || folder.length === 0) {
    setUploadError('No files found in the selected folder');
    return;
  }

  setUploadedFileName(folderName);
  setUploadStatus('checking');
  setUploadError(null);

  // Validate file types
  const validExtensions = ['.tar.gz', '.gz', '.tar', '.bin', '.pt', '.safetensors', '.json', '.txt','.pth','.model'];
  const invalidFiles = folder.filter(file => {
    if (!file || !file.name) return true;
    const fileName = file.name.toLowerCase();
    return !validExtensions.some(ext => fileName.endsWith(ext));
  });

  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map(f => f?.name || 'unnamed file').join(', ');
    setUploadError(`Invalid file types found: ${invalidNames}. Allowed extensions: ${validExtensions.join(', ')}`);
    return;
  }

  // Check total size (100GB max)
  const MAX_SIZE = 100 * 1024 * 1024 * 1024;
  const totalSize = folder.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_SIZE) {
    setUploadError(`Total size too large. Max size is ${MAX_SIZE / 1024 / 1024 / 1024} GB`);
    return;
  }

  // Check for duplicate model name in database
  if (metadata.name) {
    const { data: existingModels, error } = await supabase
      .from('models')
      .select('display_name')
      .eq('display_name', metadata.name)
      .limit(1);
    
    if (error) throw error;
    if (existingModels?.length > 0) {
      setUploadStatus('error');
      setUploadError(`Model name "${metadata.name}" is already in use. Please choose a different name.`);
      return;
    }
  }

  // Check for duplicate folder name in storage
  const apiKey = process.env.NEXT_PUBLIC_MODAL_KEY;
  const exists = await checkModelExists(folderName);
  if (exists) {
    setUploadStatus('error');
    setUploadError(`Folder "${folderName}" exists in system. Please rename your folder before uploading.`);
    return;
  }

  try {
    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    // 1. Upload directory to Modal storage
    const uploadResult = await uploadDirectoryToModal(folder, apiKey, folderName);
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload model files');
    }

    // 2. Create database record
    const { data: { user } } = await supabase.auth.getUser();
    const { data: insertedModel, error: insertError } = await supabase
      .from('models')
      .insert({
        name: folderName,
        type: 'llm',
        display_name: metadata.name,
        size: totalSize,
        modal_path: uploadResult.directoryPath,
        model_class: metadata.model_class,
        tokenizer_class: metadata.tokenizer_class,
        task_type: metadata.task_type,
        format: 'folder',
        created_by: user.id,
        created_user: user.email,
        uploaded_at: new Date().toISOString(),
        status: 'Uploaded'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Deploy model endpoint
    setUploadStatus('deploying');
    const deployResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deploy',
        modelName: metadata.name,
        modelClass: metadata.model_class,
        tokenizerClass: metadata.tokenizer_class,
        taskType: metadata.task_type,
        folderName: folderName,
        modelId: insertedModel.id
      })
    });

    if (!deployResponse.ok) {
      throw new Error('Deployment request failed');
    }

    const deploymentResult = await deployResponse.json();
    
    // 4. Update model with endpoint info
    const { error: updateError } = await supabase
      .from('models')
      .update({
        status: 'Deployed',
        endpoint: deploymentResult.endpoint,
        model_type: metadata.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', insertedModel.id);

    if (updateError) throw updateError;

    setUploadStatus('complete');
    await fetchData('model');

  } catch (error) {
    console.error('Upload failed:', error);
    setUploadStatus('error');
    setUploadError(error.message);
    
    // Cleanup on failure
{/*
    try {
      await fetch('/api/modal/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'cleanup',
          folderName: folderName
        })
      });
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }*/}
    
    await fetchData('model');
  } finally {
    setIsLoading(false);
  }
};



////////////////////////////////////////////////////////The end of Modal related part/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



const uploadFileToModal = async (file, apiKey, uploadId, CHUNK_SIZE, onProgress) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  try {
    const fileBuffer = await file.arrayBuffer(); // Now safe to call
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
     formData.append('fileName', file.name); // Add fileName
     formData.append('uploadId', uploadId);  // Add uploadId
      formData.append('file', chunk, file.name);
      formData.append('chunkIndex', chunkIndex);
      formData.append('totalChunks', totalChunks);
      formData.append('uploadId', uploadId);

      const response = await fetch('/api/modal/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) throw new Error(`Chunk ${chunkIndex + 1}/${totalChunks} failed`);
      
      if (onProgress) {
        onProgress(chunk.size);
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

{/*
const handleModelUpload = async ({ folder, metadata = {}, ...props }) => {
  // Get folderName either from props or extract from files
  const folderName = props.folderName || 
                    (folder[0]?.webkitRelativePath?.split('/')[0]) || 
                    `model-${Date.now()}`;
  
  if (!folder || folder.length === 0) {
    setUploadError('No files found in the selected folder');
    return;
  }


  setUploadedFileName(folderName);

  setUploadStatus('checking');
  setUploadError(null);

  // Validate file types in folder - SAFER VERSION
  const validExtensions = ['.tar.gz', '.gz', '.tar', '.bin', '.pt', '.safetensors', '.json', '.txt','.pth','.model'];
  const invalidFiles = folder.filter(file => {
    // Skip if file or file.name is undefined
    if (!file || !file.name) return true; 
    
    const fileName = file.name.toLowerCase();
    return !validExtensions.some(ext => fileName.endsWith(ext));
  });

  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map(f => f?.name || 'unnamed file').join(', ');
    setUploadError(
      `Invalid file types found: ${invalidNames}. ` +
      `Allowed extensions: ${validExtensions.join(', ')}`
    );
    return;
  }

  // Check total size
  const MAX_SIZE = 100 * 1024 * 1024 * 1024; // 100GB
  const totalSize = folder.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_SIZE) {
    setUploadError(`Total size too large. Max size is ${MAX_SIZE / 1024 / 1024 / 1024} GB`);
    return;
  }

  // Check for duplicate model name
  if (metadata.name) {
    const { data: existingModels, error } = await supabase
      .from('models')
      .select('display_name')
      .eq('display_name', metadata.name)
      .limit(1);
    
    if (error) throw error;
    if (existingModels?.length > 0) {
      setUploadStatus('error');
      setUploadError(`Model(endpoint) name "${metadata.name}" is already in use. Please choose a different name.`);
      return;
    }
  }

  // Check for duplicate folder name in storage
  const apiKey = process.env.NEXT_PUBLIC_MODAL_KEY;
  const checkResponse = await fetch('/api/modal/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      action: 'check_exists',
      fileName: folderName,
      checkType: 'volume'
    })
  });
  
  const { exists } = await checkResponse.json();

   console.log(`folder  check in modal:`, folderName, exists);
  if (exists) {
    setUploadStatus('error');
    setUploadError(`Folder "${folderName}" exists in system. Please rename your file before uploading.`);
    return;
  }

  // Proceed with upload if all checks pass
  const CHUNK_SIZE = 50 * 1024 * 1024;
  const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    setIsLoading(true);
    setUploadProgress(0);

  

    // Upload file
    setUploadStatus('uploading');
    //await uploadFileToModal(folder, apiKey, uploadId, CHUNK_SIZE);
const uploadResult = await uploadFolderToModal(folder, apiKey, folderName, CHUNK_SIZE);


  // Insert into Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const { data: insertedModel, error: insertError } = await supabase
      .from('models')
      .insert({
       name: folderName,
       type: 'llm',
        display_name: metadata.name,
        size: totalSize,
         modal_path: `modal://llm-models/${folderName}`,
        model_class: metadata.model_class,
        tokenizer_class: metadata.tokenizer_class,
       task_type: metadata.task_type,
         format: 'folder',
created_by: user.id,
        created_user: user.email,
        uploaded_at: new Date().toISOString(),
        status: 'Uploading'
      })
      .select()
      .single();

    if (insertError) throw insertError;


    // Deploy model
    setUploadStatus('deploying');
    const deployResponse = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deploy',
        modelName: metadata.name,
        modelClass: metadata.model_class,
       tokenizerClass: metadata.tokenizer_class,
       taskType: metadata.task_type,
       folderName: folderName,
      })
    });

   
    if (!deployResponse.ok) {
      throw new Error('Deployment request failed');
    }

    const deploymentResult = await deployResponse.json();
 console.log("response for deployment is:" deploymentResult);
    
    // Update model with endpoint info
    const { error: updateError } = await supabase
      .from('models')
      .update({
        status: 'Deployed',
        endpoint: deploymentResult.endpoint,
        model_type: metadata.type,
        updated_at: new Date().toISOString()
      })
      .eq('id', insertedModel.id);

    if (updateError) throw updateError;

    setUploadStatus('complete');
    await fetchData('model');

  } catch (error) {
    console.error('Upload failed:', error);
    setUploadStatus('error');
    setUploadError(error.message);
await fetchData('model');
    
    // Cleanup if needed
    await fetch('/api/modal/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'cleanup', uploadId })
    }).catch(console.error);  
  } finally {
    setIsLoading(false);
  }
};

*/}
const uploadFolderToModal = async (files, apiKey, folderName) => {
  const uploadId = `folder-upload-${Date.now()}`;
  const formData = new FormData();

  // Add files with their full original paths
  Array.from(files).forEach(file => {
    formData.append('files', file, file.webkitRelativePath || `${folderName}/${file.name}`);
  });

  formData.append('uploadId', uploadId);
  formData.append('action', 'upload_folder');
formData.append('folderName', folderName);


  try {
    const response = await fetch('/api/modal/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle cleanup in a separate async function
    const cleanup = async () => {
      try {
        await fetch('/api/modal/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'cleanup',
            uploadId
          })
        });
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    };
    
    await cleanup();
    throw error;
  }
};

  const uploadWithRetry = async ({ url, formData, apiKey, onProgress }) => {
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData
        });
        if (!res.ok) throw new Error(await res.text());
        if (onProgress) onProgress();
        return await res.json();
      } catch (err) {
        if (i === 2) throw err;
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  };
{/* const deleteModel = async (id, modalPath) => {
  if (!confirm('Are you sure you want to delete this model folder? This action cannot be undone.')) return;
  
  setIsDeleting(true);
  try {
    // 1. First get the model record to confirm it exists and get the path
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('id, name, modal_path, display_name')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!model) throw new Error('Model not found');

    // 2. Delete from Modal storage
    const deleteResponse = await fetch('/api/modal/delete-model', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        modelPath: modalPath || model.modal_path,
        fileName: model.name,
        displayName: model.display_name
      })
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      throw new Error(errorData.error || 'Failed to delete from storage');
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 4. Refresh the model list
    await fetchData('model');
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    alert(`Delete failed: ${error.message}`);
    return false;
  } finally {
    setIsDeleting(false);
  }
};

*/}

 ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
///////////////Data Source///////////////////////////////////

 // Update the handleDataSourceUpload function in OperationsTab.js
  const handleDataSourceUpload = async ({ file, name, description, type, input, storagePath = null }) => {
    if (!name) throw new Error('Name is required');
    
    try {
      setIsDataSourceLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      // Only upload to storage if it's a batch type and file exists
      if (type === 'batch' && file) {
        if (!storagePath) {
          const fileExt = file.name.split('.').pop();
          storagePath = `${name}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        }
        
        const { error: uploadError } = await supabase.storage
          .from('llm-datasources')
          .upload(storagePath, file, {
            upsert: false,
            contentType: 'text/csv'
          });

        if (uploadError) throw uploadError;
      }

      // Insert record into data_sources table
      const { data, error } = await supabase
        .from('data_sources')
        .insert({
          name,
          type,
          size: type === 'batch' ? file.size : input.length,
          storage_path: type === 'batch' ? storagePath : null,
          input: type === 'single' ? input : null,
          description,
          status: 'ready',
          created_by: user.id || null, 
          uploaded_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Refresh data sources
      await fetchData('data');
      return data[0];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setIsDataSourceLoading(false);
    }
  };

  

const handleDataSourceDelete = async (id) => {

const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

if (!session || sessionError) {
  throw new Error('User is not authenticated. Please log in again.');
}

  try {
    setIsDataSourceLoading(true);
    
    // First get the full record including storage_path and type
    const { data: source, error: fetchError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', id)
      .single();

 console.log('the record: ', source);

    if (fetchError) throw fetchError;

    // Delete from storage if it's a batch source and has storage_path
    if (source.type === 'batch' && source.storage_path) {
try {
        console.log('Attempting to delete from storage:', source.storage_path);
     

       const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw new Error(`Authentication error: ${authError.message}`);
    if (!session) throw new Error('No active session');

// console.log("access token: ", session.access_token);



   {/* permission policy on supabase
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow file selection" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'llm-datasources' -- Replace with your actual bucket name
);

CREATE POLICY "Allow file deletion"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'llm-datasources' -- Same bucket name as above
  -- Add additional conditions if needed, for example:
  -- AND auth.role() = 'authenticated' -- Only allow authenticated users
);

   */}        
        // First verify the file exists
        const { data: fileList, error: listError } = await supabase.storage
          .from('llm-datasources')
        .list('', {
           limit: 1,
           search: source.storage_path
          });

        if (listError) throw listError;

        if (fileList && fileList.length > 0) {
          // File exists - proceed with deletion
          const { error: deleteError } = await supabase.storage
            .from('llm-datasources')
            .remove([source.storage_path]);

          if (deleteError) {
            console.error('Storage deletion error:', deleteError);
            if (!deleteError.message.includes('not found')) {
              throw new Error(`Storage deletion failed: ${deleteError.message}`);
            }
          } else {
            console.log('Storage file deleted successfully');
          }
        } else {
          console.warn('File not found in storage, proceeding with DB deletion');
        }
      } catch (storageError) {
        console.error('Storage deletion process failed:', storageError);
        // Continue with DB deletion even if storage fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Refresh data
    await fetchData('data');
    return { 
      success: true, 
      name: source.name,
      message: `"${source.name}" has been deleted successfully`
    };
  } catch (error) {
    console.error('Delete error:', error);
    return { 
      success: false, 
      error: error.message,
      message: `Failed to delete: ${error.message}`
    };
  } finally {
    setIsDataSourceLoading(false);
  }
};

////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
/////////////////////////////////////run inference

const handleRunInference = async (payload) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/modal/run-inference', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Inference failed");
    }
    console.log("check result from handleRunInference ", response);
    const result = await response.json();
    await fetchData('inference');
    return result;

  } catch (error) {
    console.error('Inference error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};



 return (
    <div className={styles.operationsContainer}>
      <div className={styles.subTabs}>
        {['model', 'data', 'inference'].map(tab => (
          <button key={tab}
            className={`${styles.subTab} ${activeSubTab === tab ? styles.active : ''}`}
            onClick={() => handleSubTabChange(tab)}
          >
            {tab === 'model' && <HiCube className={styles.subTabIcon} />}
            {tab === 'data' && <HiServer className={styles.subTabIcon} />}
            {tab === 'inference' && <HiLightBulb className={styles.subTabIcon} />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className={styles.subTabContent}>
        {/* Show loading message only during initial load or tab change */}
        {isLoading && !isDeleting && activeSubTab !== 'model' ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {activeSubTab === 'model' &&
              <ModelSubTab
                models={models}
                  onUpload={({ folder, metadata }) => handleModelUpload({ folder, metadata })}
                uploadProgress={uploadProgress}
                uploadStatus={uploadStatus}
                uploadError={uploadError}
                uploadedFileName={uploadedFileName}
                setUploadStatus={setUploadStatus}
                setUploadError={setUploadError}
                deleteModel={deleteModel}
                isDeleting={isDeleting} // Pass deleting state to ModelSubTab
                isTableLoading={isTableLoading} // Pass table loading state

              />}

 {activeSubTab === 'data' && (
        <>
          {isDataSourceLoading ? (
            <div className={styles.loading}>Loading data sources...</div>
          ) : (
            <DataSourceSubTab
              sources={dataSources}
              onUpload={handleDataSourceUpload}
              onDelete={handleDataSourceDelete}
              isLoading={isDataSourceLoading}
	setActiveSubTab={setActiveSubTab}
            />
          )}
        </>
      )}

           {activeSubTab === 'inference' && (
  <InferenceSubTab
    jobs={inferenceJobs}
    models={models}
    sources={dataSources}
    onRunInference={handleRunInference}
  />
)}
          </>
        )}
      </div>
    </div>
  );
}

 
function ModelSubTab({
  models,
  onUpload,
  uploadProgress,
  uploadStatus,
  uploadError,
  uploadedFileName,
  setUploadStatus,
  setUploadError,
  deleteModel,
  isDeleting,
  isTableLoading
}) {
 // const [file, setFile] = useState(null);
const [folder, setFolder] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

const [folderFiles, setFolderFiles] = useState([]); // For storing the files
  const [folderName, setFolderName] = useState('');   // For storing the folder name

const [folderContents, setFolderContents] = useState({
  files: [],
  name: '',
  path: ''
});
const [hasFolderSelected, setHasFolderSelected] = useState(false);
  
  const [modelMetadata, setModelMetadata] = useState({
    name: '',
    model_class: 'AutoModelForCausalLM',
    tokenizer_class:'AutoTokenizer',
    task_type: 'causal_lm'
  });

  const modelTypes =[
  { value: 'AutoModel', label: 'AutoModel' },
  { value: 'AutoModelForCausalLM', label: 'AutoModelForCausalLM' },
  { value: 'AutoModelForSeq2SeqLM', label: 'AutoModelForSeq2SeqLM' },
  { value: 'AutoModelForMaskedLM', label: 'AutoModelForMaskedLM' },
  { value: 'AutoModelForSequenceClassification', label: 'AutoModelForSequenceClassification' },
  { value: 'AutoModelForTokenClassification', label: 'AutoModelForTokenClassification' },
  { value: 'AutoModelForQuestionAnswering', label: 'AutoModelForQuestionAnswering' },

  { value: 'GPT2LMHeadModel', label: 'GPT2LMHeadModel' },
  { value: 'GPTJForCausalLM', label: 'GPTJForCausalLM' },
  { value: 'GPTNeoForCausalLM', label: 'GPTNeoForCausalLM' },
  { value: 'GPTNeoXForCausalLM', label: 'GPTNeoXForCausalLM' },
  { value: 'LlamaForCausalLM', label: 'LlamaForCausalLM' },
  { value: 'MistralForCausalLM', label: 'MistralForCausalLM' },
  { value: 'MixtralForCausalLM', label: 'MixtralForCausalLM' },
  { value: 'BloomForCausalLM', label: 'BloomForCausalLM' },
  { value: 'FalconForCausalLM', label: 'FalconForCausalLM' },
  { value: 'MptForCausalLM', label: 'MptForCausalLM' },
  { value: 'PhiForCausalLM', label: 'PhiForCausalLM' },

  { value: 'BertForMaskedLM', label: 'BertForMaskedLM' },
  { value: 'RobertaForMaskedLM', label: 'RobertaForMaskedLM' },
  { value: 'DistilBertForMaskedLM', label: 'DistilBertForMaskedLM' },
  { value: 'ElectraForMaskedLM', label: 'ElectraForMaskedLM' },

  { value: 'T5ForConditionalGeneration', label: 'T5ForConditionalGeneration' },
  { value: 'MT5ForConditionalGeneration', label: 'MT5ForConditionalGeneration' },
  { value: 'BartForConditionalGeneration', label: 'BartForConditionalGeneration' },
  { value: 'PegasusForConditionalGeneration', label: 'PegasusForConditionalGeneration' },

  { value: 'BertForSequenceClassification', label: 'BertForSequenceClassification' },
  { value: 'RobertaForSequenceClassification', label: 'RobertaForSequenceClassification' },
  { value: 'XLNetForSequenceClassification', label: 'XLNetForSequenceClassification' },

  { value: 'BertForTokenClassification', label: 'BertForTokenClassification' },
  { value: 'RobertaForTokenClassification', label: 'RobertaForTokenClassification' },
  { value: 'XLNetForTokenClassification', label: 'XLNetForTokenClassification' },

  { value: 'BertForQuestionAnswering', label: 'BertForQuestionAnswering' },
  { value: 'RobertaForQuestionAnswering', label: 'RobertaForQuestionAnswering' },
  { value: 'XLNetForQuestionAnswering', label: 'XLNetForQuestionAnswering' }
];

  const tokenizerTypes = [
   { value: 'AutoTokenizer', label: 'AutoTokenizer' },
  { value: 'GPT2Tokenizer', label: 'GPT2Tokenizer' },
  { value: 'LlamaTokenizer', label: 'LlamaTokenizer' },
  { value: 'T5Tokenizer', label: 'T5Tokenizer' },
  { value: 'BertTokenizer', label: 'BertTokenizer' },
  { value: 'RobertaTokenizer', label: 'RobertaTokenizer' },
  { value: 'DistilBertTokenizer', label: 'DistilBertTokenizer' },
  { value: 'WhisperTokenizer', label: 'WhisperTokenizer' },
  { value: 'CLIPTokenizer', label: 'CLIPTokenizer' }
  ];


  const taskTypes = [
    { value: 'causal_lm', label: 'causal_lm' },
 { value: 'sequence_classification', label: 'sequence_classification' },
  { value: 'masked_lm', label: 'masked_lm' },
   { value: 'seq2seq_lm', label: 'seq2seq_lm' },
    { value: 'token_classification', label: 'token_classification' },
{ value: 'question_answering', label: 'question_answering' },
{ value: 'embedding', label: 'embedding' }
  ];



 const getDisplayName = () => {
       return folder ? folder[0].webkitRelativePath.split('/')[0] : '';

};

  const handleUploadAndDeploy = async () => {
  if (!folderFiles.length) {
    setUploadError('Please select model folder first');
    return;
  }

  // Get or generate folder name
  const folderName = folderFiles[0]?.webkitRelativePath?.split('/')[0] || 
                   `model-${Date.now()}`;


  console.log("folder name: ", folderName)

    if (isUploading) {
      setUploadError('Upload already in progress');
      return;
    }

 console.log("isUploading?:", isUploading)

    if (!modelMetadata.name) {
      setUploadError('Please enter a model(endpoint) name');
      return;
    }
      
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadError(null);
    
      
    try {
console.log("invoking ", onUpload);     
 await onUpload({
        folder:folderFiles,
        folderName: folderName,
        metadata: modelMetadata
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };


const handleFolderChange = (e) => {
  const files = e.target.files;
  console.log('Selected files:', files);

  if (!files || files.length === 0) {
    console.error('No files selected or folder is empty');
    setUploadError('Please select a non-empty folder');
    return;
  }

  // Extract folder name (with fallback)
  let folderName = 'model-folder';
  if (files[0].webkitRelativePath) {
    folderName = files[0].webkitRelativePath.split('/')[0];
  } else if(files[0].name) {
    // Fallback for browsers without webkitRelativePath
     folderName = files[0].name.split('.')[0] + '_folder';
  }

  // Update state

 folderName = folderName
    .replace(/[^a-zA-Z0-9- _]/g, '-')
    .toLowerCase();


  setFolderFiles(Array.from(files));  // Store the file list
  setFolderName(folderName);          // Store the folder name
  setUploadStatus('idle');
  setUploadError(null);

  // Auto-generate model name if empty
{/*  
    if (!modelMetadata.name) {
    const baseName = folderName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    setModelMetadata(prev => ({
      ...prev,
      name: baseName
    }));
  }
*/}
};

const sanitizeName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove all special chars except hyphen, underscore, space
  //  .replace(/[_ ]/g, '-') // Convert underscores and spaces to hyphens
    .toLowerCase();
};


  // Update metadata handler
  const handleMetadataChange = (e) => {
   const { name, value } = e.target;
  setModelMetadata(prev => ({
    ...prev,
    [name]: name === 'name' ? sanitizeName(value) : value
  }));
  };

  // Auto-generate model name from filename
 useEffect(() => {
  if (folderFiles.length > 0 && !modelMetadata.name) {
    // Get folder name from the first file's webkitRelativePath
    let folderName = 'model';
    if (folderFiles[0].webkitRelativePath) {
      folderName = folderFiles[0].webkitRelativePath.split('/')[0];
    } else {
      // Fallback if webkitRelativePath isn't available
      folderName = folderFiles[0].name.split('.')[0];
    }

    // Clean up the name
    const baseName = folderName
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    setModelMetadata(prev => ({
      ...prev,
      name: baseName
    }));
  }
}, [folderFiles]);

  return (
    <div className={styles.modelTab}>
      <h3>Manage Models</h3>

      <div className={styles.uploadSection}>
        <input
          type="file"
          id="model-upload"
          ref={fileInputRef}
 accept=".bin,.pt,.safetensors,.json,.txt,.model,.pth"
          onChange={handleFolderChange}
          className={styles.fileInput}
          disabled={isUploading} 
webkitdirectory="true"  // Add this for folder selection
  directory="true"        // Add this for folder selection
   multiple
    //   key={folder ? 'folder-selected' : 'no-folder'}


        />
        <label
          htmlFor="model-upload"
          className={`${styles.fileInputLabel} ${
            isUploading ? styles.disabled : ''
          }`}
        >
          Select Model Folder
        </label>
{folderFiles.length > 0 && (
  <div className={styles.folderInfo}>
    <p>Selected folder: <strong>{folderName}</strong></p>
    <p>Contains {folderFiles.length} model files</p>
    <div className={styles.filePreview}>
      {folderFiles.slice(0, 3).map((file, index) => (
        <div key={index}>{file.name}</div>
      ))}
      {folderFiles.length > 3 && (
        <div>+ {folderFiles.length - 3} more files</div>
      )}
    </div>
  </div>
)}
        {folderFiles.length > 0 && (
           <div className={styles.uploadForm}>
            <div className={styles.formGroup}>
              <label>Model Name (API endpoint)</label>
              <input
                type="text"
                name="name"
                value={modelMetadata.name}
                onChange={handleMetadataChange}
                placeholder="my-model-name"
                className={styles.nameInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Model Class</label>
              <select
                name="model_class"
                value={modelMetadata.model_class}
                onChange={handleMetadataChange}
                className={styles.selectInput}
              >
                {modelTypes.map(model_class => (
                  <option key={model_class.value} value={model_class.value}>
                    {model_class.label}
                  </option>
                ))}
              </select>
            </div>

               <div className={styles.formGroup}>
              <label>Tokenizer Class</label>
              <select
                name="tokenizer_class"
                value={modelMetadata.tokenizer_class}
                onChange={handleMetadataChange}
                className={styles.selectInput}
              >
                {tokenizerTypes.map(tokenizer_class => (
                  <option key={tokenizer_class.value} value={tokenizer_class.value}>
                    {tokenizer_class.label}
                  </option>
                ))}
              </select>
            </div>

              <div className={styles.formGroup}>
              <label>Task Type</label>
              <select
                name="task_type"
                value={modelMetadata.task_type}
                onChange={handleMetadataChange}
                className={styles.selectInput}
              >
                {taskTypes.map(task_type => (
                  <option key={task_type.value} value={task_type.value}>
                    {task_type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.uploadActions}>
              <button
                onClick={handleUploadAndDeploy}
                disabled={isUploading || !modelMetadata.name|| !folderFiles.length}
                 className={`${styles.uploadButton} ${
    (isUploading || !modelMetadata.name || !folderFiles.length) 
      ? styles.disabledButton 
      : ''
  }`}
              >
                {isUploading ? (
    <>
      Uploading... {uploadProgress}%
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
</>
                ) : (
                  'Upload & Deploy'
                )}
                {isUploading && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </button>
{/* After the upload button 
{uploadError && (
  <div className={styles.errorMessage} style={{ color: 'red', marginTop: '10px' }}>
    {uploadError}
  </div>
)} */}
            </div>
          </div>
        )}

        {uploadStatus === 'complete' && (
          <div className={styles.successMessage}>
            ✓ Success! Model folder deployed as: {modelMetadata.name}
          </div>
        )}
      {uploadError && (
    <span className={styles.singleErrorMessage}>
      {uploadError.includes('already exists') 
        ? "Filename or model name already exists. Please rename."
        : uploadError}
    </span>
  )}
{/*
    {uploadError && (
  <div className={styles.errorMessage}>
    {uploadError.includes('already exists') ? (
      <>
        <p>{uploadError}</p>
        <p>Please either:</p>
        <ul>
          <li>Rename your model in the "Model Name" field, or</li>
          <li>Upload a file with a different name</li>
        </ul>
      </>
    ) : (
      uploadError
    )}
  </div>
)} */}

      </div>
<br/>
      <div className={styles.modelList}>
        <h3>Your uploaded models</h3>
        <div className={styles.tableContainer}>
          {isDeleting && (
            <div className={styles.deletingOverlay}>
              <div className={styles.deletingMessage}>Deleting...</div>
            </div>
          )}
          {models.length === 0 ? (
            <p>No models uploaded yet.</p>
          ) : (
            <table className={styles.modelTable}>
              <thead>
                <tr>
                  <th>Name</th>
	  <th>Display Name</th>
                  <th>Model Class</th>
 <th>Tokenizer Class </th>
 <th>Task Type </th>
                  <th>Created By</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Endpoint</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(model => (
                  <tr key={model.id}>
                    <td>{model.name}</td>
               <td>{model.display_name}</td>
<td>{model.model_class}</td>
<td>{model.tokenizer_class}</td>
<td>{model.task_type}</td>
                    <td>{model.created_user}</td>
                    <td>{(model.size / (1024 * 1024)).toFixed(2)} MB</td>
                    <td>{new Date(model.uploaded_at).toLocaleString()}</td>
                    <td>
  <span className={`${styles.statusBadge} ${
    model.status === 'Deployed' ? styles.deployed :
    model.status === 'Uploaded' ? styles.uploaded :
    styles.error
  }`}>
    {model.status || 'Uploading'}
  </span>
</td>
<td>
  {model.endpoint && (
    <a href={model.endpoint} target="_blank" rel="noopener noreferrer">
      View Endpoint
    </a>
  )}
</td>
                    <td>
                      <button 
                        onClick={() => deleteModel(model.id, model.modal_path)} 
                        className={styles.deleteButton}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function DataSourceSubTab({ sources, onUpload, onDelete, isLoading,setActiveSubTab   }) {
  const [file, setFile] = useState(null);
  const [manualData, setManualData] = useState('');
  const [inputType, setInputType] = useState('files');
  const [customName, setCustomName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const fileInputRef = useRef(null);

const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');

const [searchQuery, setSearchQuery] = useState('');

const [selectedRows, setSelectedRows] = useState([]);

  const [isDataSourceLoading, setIsDataSourceLoading] = useState(false);


//view button
const [viewerContent, setViewerContent] = useState(null);
const [isViewerOpen, setIsViewerOpen] = useState(false);

const handleDownloadSample = async (fileType) => {
  const sampleFiles = {
    MASKED: '/samples/sample_masked.txt',
    OTHERS: '/samples/sample_regular.csv',
    'Q&A': '/samples/sample_qa.csv'
  };

  try {
    const response = await fetch(sampleFiles[fileType]);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample_${fileType.toLowerCase().replace('&', 'and')}.${sampleFiles[fileType].split('.').pop()}`;
    link.style.display = 'none';
    
    // This prevents the additional dialog
    link.target = '_self';
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up after a delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Download failed. Please try again.');
  }
};



const viewSourceContents = async (source) => {
  try {
    setIsDataSourceLoading(true);
    
    if (source.type === 'single') {
      // For manual input, just show the text directly
      setViewerContent({
        type: 'text',
        content: source.input,
        name: source.name
      });
    } else {
      // For batch files, fetch from storage
      const { data, error } = await supabase.storage
        .from('llm-datasources')
        .download(source.storage_path);
      
      if (error) throw error;
      
      // Read file content based on type
      const fileExt = source.storage_path.split('.').pop().toLowerCase();
      let content = '';
      
      if (fileExt === 'csv' || fileExt === 'tsv') {
        content = await data.text();
      } else if (fileExt === 'json') {
        const json = await data.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await data.text();
      }
      
      setViewerContent({
        type: fileExt,
        content,
        name: source.name
      });
    }
    
    setIsViewerOpen(true);
  } catch (error) {
    console.error('Error viewing source:', error);
    setUploadStatus('error');
    setUploadMessage(`Failed to view source: ${error.message}`);
  } finally {
    setIsDataSourceLoading(false);
  }
};


//inference navigate
const navigateToInference = (source) => {
  // This assumes you have access to the setActiveSubTab function
 
    setActiveSubTab('inference');
  // You might want to store the selected source in context/state
  // to pre-select it in the inference tab
};


const filteredSources = sources.filter(source => 
  source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (source.description && source.description.toLowerCase().includes(searchQuery.toLowerCase()))
);

// Add selection handlers
const toggleRowSelection = (id) => {
  setSelectedRows(prev => 
    prev.includes(id) 
      ? prev.filter(rowId => rowId !== id)
      : [...prev, id]
  );
};

const selectAllRows = (e) => {
  setSelectedRows(e.target.checked ? filteredSources.map(source => source.id) : []);
};




  // Only reset form when upload is complete and status is cleared
  useEffect(() => {
    if (uploadStatus === 'success') {
      const timer = setTimeout(() => {
        setUploadStatus(null);
        resetForm();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const resetForm = () => {
    setFile(null);
    setManualData('');
    setDescription('');
    setOverwrite(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate name only when new file is selected or manual input changes
  useEffect(() => {
    if (inputType === 'files' && file) {
      setCustomName(`${file.name.split('.')[0]}_${Date.now()}`);
    } else if (inputType === 'text' && manualData) {
      setCustomName(`manual_input_${Date.now()}`);
    }
  }, [file, manualData, inputType]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUploadStatus(null);
    }
  };

   const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
    }
  };

  const handleManualInputChange = (e) => {
    setManualData(e.target.value);
    setUploadStatus(null);
  };

  const handleNameChange = (e) => {
    setCustomName(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  // Updated upload handler with overwrite logic
const handleUpload = async () => {
  if ((inputType === 'files' && !file) || (inputType === 'text' && !manualData.trim())) return;

  setIsUploading(true);
  setUploadStatus(null);
  setUploadMessage(''); // Clear previous messages

  try {
    // Check if name is provided
    if (!customName.trim()) {
      throw new Error('Dataset name is required');
    }

    // Generate storage path for files
    let storagePath = null;
    if (inputType === 'files' && file) {
      const fileExt = file.name.split('.').pop();
      storagePath = `${customName}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    }

    // Check for existing data source
    const { data: existingSources, error: fetchError } = await supabase
      .from('data_sources')
      .select('id, storage_path, type')
      .eq('name', customName);

    if (fetchError) throw fetchError;

    // Handle existing source
    if (existingSources && existingSources.length > 0) {
      if (!overwrite) {
        // Ask user if they want to rename
        const shouldRename = confirm(
          `A data source named "${customName}" already exists. Would you like to rename this one?`
        );
        
        if (shouldRename) {
          setCustomName(`${customName}_${Date.now()}`);
          setUploadStatus('error');
          setUploadMessage('Please use the new name and try again');
          return;
        } else {
          setUploadStatus('error');
          setUploadMessage('Upload canceled - duplicate name');
          return;
        }
      } else {
        // Overwrite existing source
        const existingSource = existingSources[0];
        
        // Delete from storage if it's a batch source
        if (existingSource.type === 'batch' && existingSource.storage_path) {
          const { error: deleteStorageError } = await supabase.storage
            .from('llm-datasources')
            .remove([existingSource.storage_path]);
          
          if (deleteStorageError) throw deleteStorageError;
        }

        // Delete from database
        const { error: deleteDbError } = await supabase
          .from('data_sources')
          .delete()
          .eq('id', existingSource.id);
          
        if (deleteDbError) throw deleteDbError;
      }
    }

    // Proceed with upload
    await onUpload({
      file: inputType === 'files' ? file : null,
      name: customName,
      description,
      type: inputType === 'files' ? 'batch' : 'single',
      input: inputType === 'text' ? manualData : null,
      storagePath
    });

    setUploadStatus('success');
    setUploadMessage(
      inputType === 'files'
        ? `"${file.name}" uploaded successfully as "${customName}"`
        : `Text data uploaded successfully as "${customName}"`
    );
    resetForm();
    
  } catch (error) {
    console.error('Upload failed:', error);
    setUploadStatus('error');
    setUploadMessage(error.message || 'Upload failed');
  } finally {
    setIsUploading(false);
  }
};


  const handleFileUpload = async () => {
    if (!file) return;
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const name = customName || `${file.name.split('.')[0]}_${Date.now()}`;
      let storagePath = null;
      
      // Check for existing data source
      const { data: existingSources } = await supabase
        .from('data_sources')
        .select('id, storage_path')
        .eq('name', name);
        
      // If exists and overwrite is false - warn user
      if (existingSources && existingSources.length > 0 ) {
  	if(!overwrite) {
        const shouldRename = confirm(
          `A data source named "${name}" already exists. Would you like to rename this one?`
        );
        if (shouldRename) {
          setCustomName(`${name}_${Date.now()}`);
          throw new Error('Please enter a new name and try again');
        } else {
          throw new Error('Upload canceled - duplicate name');
        }
      }
   }
      
      // If exists and overwrite is true - delete old one first
      if (existingSources && existingSources.length > 0 && overwrite) {
        const existingSource = existingSources[0];
        
        // Delete from storage if it exists
        if (existingSource.storage_path) {
          await supabase.storage
            .from('llm-datasources')
            .remove([existingSource.storage_path]);
        }
        
        // Delete from database
        await supabase
          .from('data_sources')
          .delete()
          .eq('id', existingSource.id);
      }
      
      // Upload new file
      const fileExt = file.name.split('.').pop();
      storagePath = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('llm-datasources')
        .upload(storagePath, file, {
          upsert: false,
          contentType: 'text/csv'
        });

      if (uploadError) throw uploadError;

      // Insert new record
      const { data, error } = await supabase
        .from('data_sources')
        .insert({
          name,
          type: 'batch',
          size: file.size,
          storage_path: storagePath,
          input: null,
          description,
          status: 'ready',
          created_by: user.id,
          uploaded_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleManualUpload = async () => {
    if (!manualData.trim()) return;
    
    try {
      const { data: {user}, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const name = customName || `manual_input_${Date.now()}`;
      
      // Check for existing data source
      const { data: existingSources } = await supabase
        .from('data_sources')
        .select('id')
        .eq('name', name);
      
      // If exists and overwrite is false - warn user
      if (existingSources && existingSources.length > 0 && !overwrite) {
        const shouldRename = confirm(
          `A data source named "${name}" already exists. Would you like to rename this one?`
        );
        if (shouldRename) {
          setCustomName(`${name}_${Date.now()}`);
          throw new Error('Please enter a new name and try again');
        } else {
          throw new Error('Upload canceled - duplicate name');
        }
      }
      
      // If exists and overwrite is true - delete old one first
      if (existingSources && existingSources.length > 0 && overwrite) {
        await supabase
          .from('data_sources')
          .delete()
          .eq('id', existingSources[0].id);
      }
      
      // Create new record
      const { data, error } = await supabase
        .from('data_sources')
        .insert({
          name,
          type: 'single',
          size: manualData.length,
          storage_path: null,
          input: manualData,
          description,
          status: 'ready',
          created_by: user.id,
          uploaded_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      return data[0];
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

 // Handle delete with confirmation and status messages
 const handleDelete = async (id) => {
  const source = sources.find(s => s.id === id);
 if (!source) return;

  if (!confirm(`Are you sure you want to permanently delete "${source.name}"?`)) return;

  setDeleteStatus('deleting');
  setDeleteMessage(`Deleting "${source.name}"...`);

  try {
    // 1. First verify the bucket exists
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket('llm-datasources');
    
    if (bucketError) throw new Error(`Bucket error: ${bucketError.message}`);

    // 2. Handle storage deletion (if applicable)
    if (source.type === 'batch' && source.storage_path) {
   console.log('Storage path format:', source.storage_path);

      // Verify file exists first
      const { data: fileList } = await supabase.storage
        .from('llm-datasources')
        .list('', { search: source.storage_path });
      
      if (fileList && fileList.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('llm-datasources')
          .remove([source.storage_path]);
        
        if (storageError) {
          console.error('Storage deletion failed:', {
            path: source.storage_path,
            error: storageError
          });
          throw new Error(`File deletion failed: ${storageError.message}`);
        }
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('data_sources')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    // Refresh data and show success
    await fetchData('data');
    setDeleteStatus('success');
    setDeleteMessage(`"${source.name}" deleted successfully`);
  } catch (err) {
    setDeleteStatus('error');
    setDeleteMessage(`Failed to delete "${source.name}": ${err.message}`);
  } finally {
    setTimeout(() => {
      setDeleteStatus(null);
      setDeleteMessage('');
    }, 5000);
  }
};

const handleBatchDelete = async () => {
  const count = selectedRows.length;
  if (!count) return;

 if (!confirm(`Delete ${count} selected data source${count > 1 ? 's' : ''}?`)) return;

  setDeleteStatus('deleting');
  setDeleteMessage(`Deleting ${count} data source${count > 1 ? 's' : ''}...`);

  try {
    const results = await Promise.allSettled(
      selectedRows.map(id => onDelete(id))
    );

    const successfulDeletes = results.filter(r => r.value?.success);
    setSelectedRows([]);

    if (successfulDeletes.length === count) {
      setDeleteStatus('success');
      setDeleteMessage(`Deleted ${count} data source${count > 1 ? 's' : ''}`);
    } else {
      setDeleteStatus('warning');
      setDeleteMessage(
        `Deleted ${successfulDeletes.length} of ${count} sources. ` +
        `Failed: ${count - successfulDeletes.length}`
      );
    }
  } catch (error) {
    setDeleteStatus('error');
    setDeleteMessage(`Batch deletion failed: ${error.message}`);
  }
};

  return (
    <div className={styles.dataTab}>
    {deleteStatus && (
      <div className={`${styles.statusMessage} ${styles[deleteStatus]}`}>
        {deleteMessage}
      </div>
    )}
      <div className={styles.dataContainer}>
        <div className={styles.uploadPanel}>
          <div className={styles.uploadHeader}>
  <h3>Upload Inputs</h3>
  <label>Configure dataset metadata →</label>
</div>

          <div className={styles.inputTypeTabs}>
            <button
              className={`${styles.typeTab} ${inputType === 'files' ? styles.active : ''}`}
              onClick={() => setInputType('files')}
            >
              Files
            </button>
            <button
              className={`${styles.typeTab} ${inputType === 'text' ? styles.active : ''}`}
              onClick={() => setInputType('text')}
            >
              Text
            </button>
          </div>

         {inputType === 'files' ? (
        <div className={styles.fileUploadSection}>
          <p className={styles.formatGuide}>Please put all texts under column "input_texts" to avoid processing failure</p>
          <div 
            className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className={styles.fileInput}
              disabled={isUploading}
              accept=".txt,.csv,"
            />
            <div className={styles.dropzoneContent}>
              <HiOutlineUpload className={styles.uploadIcon} />
              <p className={styles.dropzoneLabel}>
                Click to upload or drag & drop
              </p>
              <p className={styles.fileTypes}>please upload txt or csv files. And see the sample files for formatting</p>

{/*    begin of download */}
<div className={styles.sampleButtons}>
  <p>Download sample files:</p>
  <div className={styles.sampleButtonGroup}>
    <button 
      onClick={() => handleDownloadSample('MASKED')}
      className={styles.sampleButton}
    >
      MASKED
    </button>
    <button 
      onClick={() => handleDownloadSample('Q&A')}
      className={styles.sampleButton}
    >
      Q&A
    </button>
    <button 
      onClick={() => handleDownloadSample('OTHERS')}
      className={styles.sampleButton}
    >
      OTHERS
    </button>
  </div>
</div>  

{/*    end of download */}

              {file && (
                <p className={styles.selectedFile}>
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.textUploadSection}>
          <textarea
            value={manualData}
            onChange={handleManualInputChange}
            placeholder={
    `Paste or input your prompt here.

For mask, please put one and only [MASK] :
The capital of France is [MASK].

For question and answering model, input per the format below :
 {"question":"What is AI?","context":"AI stands for..."}

Use file upload if you want to input multiple prompts`
  }
            rows={10}
            className={styles.manualTextarea}
          />
        </div>
      )}

          <div className={styles.uploadActions}>
            <button
              onClick={handleUpload}
              disabled={isUploading || (inputType === 'files' ? !file : !manualData.trim())}
              className={styles.dsuploadButton}
            >
              {isUploading ? 'Uploading...' : 'Upload inputs'}
            </button>
            
            {uploadStatus === 'success' && (
              <span className={styles.uploadStatusSuccess}>
                {uploadMessage}
              </span>
            )}
            {uploadStatus === 'error' && (
              <span className={styles.uploadStatusError}>
                {uploadMessage}
              </span>
            )}
          </div>
        </div>

        <div className={styles.configPanel}>
          <h3>Datasets</h3>
          <div className={styles.datasetConfig}>
            <div className={styles.inputGroup}>
              <label>Dataset Name</label>
              <input
                type="text"
                value={customName}
                onChange={handleNameChange}
                placeholder={
                  inputType === 'files' && file 
                    ? `${file.name.split('.')[0]}_${Date.now()}`
                    : `manual_input_${Date.now()}`
                }
                className={styles.nameInput}
              />
            <div className={styles.checkboxRow}>
  <input
    type="checkbox"
    id="overwriteCheckbox"
    checked={overwrite}
    onChange={(e) => setOverwrite(e.target.checked)}
    className={styles.checkboxInput}
  />
  <label htmlFor="overwriteCheckbox" className={styles.checkboxLabel}>
    Overwrite existing
  </label>
</div>
            </div>
            <div className={styles.inputGroup}>
              <label>Description</label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter a description for this dataset..."
                rows={3}
                className={styles.descTextarea}
              />
            </div>
          </div>

          <h3>Concepts</h3>
          <div className={styles.conceptsSection}>
            <p>Select or add concepts</p>
          </div>

          <h3>Metadata</h3>
          <div className={styles.metadataSection}>
            <pre className={styles.metadataPreview}>
              {JSON.stringify({
                type: inputType === 'files' ? 'batch' : 'single',
                size: inputType === 'files' && file ? `${(file.size / 1024).toFixed(2)} KB` : `${manualData.length} characters`,
                format: inputType === 'files' && file ? file.name.split('.').pop() : 'text',
                created: new Date().toISOString(),
                overwrite: overwrite
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

   <div className={styles.sourceList}>
 <div className={styles.listHeader}>
  <h3>Available Data Sources</h3>
  
  <div className={styles.controlsRow}>
    <div className={styles.searchWrapper}>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
      />
      <span className={styles.searchIcon}>🔍</span>
    </div>

    {selectedRows.length > 0 && (
      <button 
        onClick={handleBatchDelete} 
        className={styles.deleteSelectedBtn}
      >
        Delete {selectedRows.length} selected
      </button>
    )}
  </div>
</div>

{isDataSourceLoading && (
  <div className={styles.loadingOverlay}>
    <div className={styles.loadingSpinner}></div>
    Loading file contents...
  </div>
)}

{isViewerOpen && (
  <div className={styles.viewerModal}>
    <div className={styles.viewerContent}>
      <div className={styles.viewerHeader}>
        <h3>Viewing: {viewerContent.name}</h3>
        <button 
          onClick={() => setIsViewerOpen(false)}
          className={styles.closeButton}
        >
          &times;
        </button>
      </div>
      <div className={styles.viewerBody}>
        <pre className={styles.simpleTextPreview}>
          {viewerContent.content}
        </pre>
      </div>
    </div>
  </div>
)}

  {isLoading ? (
    <div className={styles.loading}>Loading data sources...</div>
  ) : filteredSources.length === 0 ? (
    <p>No data sources found</p>
  ) : (
    <table className={styles.dataTable}>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedRows.length === filteredSources.length && filteredSources.length > 0}
              onChange={selectAllRows}
              disabled={filteredSources.length === 0}
            />
          </th>
          <th>Name</th>
          <th>Type</th>
          <th>Size</th>
          <th>Description</th>
          <th>Uploaded</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredSources.map(source => (
          <tr key={source.id}>
            <td>
              <input
                type="checkbox"
 className={styles.checkboxInput}  // Add this
                checked={selectedRows.includes(source.id)}
                onChange={() => toggleRowSelection(source.id)}
              />
            </td>
            <td>{source.name}</td>
            <td>{source.type === 'batch' ? 'File' : 'Manual'}</td>
            <td>{source.size ? `${(source.size / 1024).toFixed(2)} KB` : 'N/A'}</td>
            <td>{source.description || '-'}</td>
            <td>{new Date(source.uploaded_at).toLocaleString()}</td>
            <td>
  <div className={styles.actionButtons}>
    <button
      onClick={() => viewSourceContents(source)}
      className={styles.viewButton}
    >
      View
    </button>
    <button
      onClick={() => navigateToInference(source)}
      className={styles.inferenceButton}
    >
      Inference
    </button>
    <button
      onClick={() => onDelete(source.id)}
      className={styles.deleteButton}
      disabled={isUploading}
    >
      Delete
    </button>
  </div>
</td>
          </tr>
  ))}
      </tbody>
    </table>
    )}
    </div>
</div>
);


}



const navigateToInference = (source) => {
  // This assumes you have access to the setActiveSubTab function
  setActiveSubTab('inference');
  // You might want to store the selected source in context/state
  // to pre-select it in the inference tab
};

function InferenceSubTab({ jobs, models, sources, onRunInference }) {
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [params, setParams] = useState({
    max_tokens: 200,
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
    do_sample: true,
    return_probs: false
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [error, setError] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [inputPreview, setInputPreview] = useState([]);

  const selectedModelData = models.find(m => m.id === selectedModel);
  const selectedSourceData = sources.find(s => s.id === selectedSource);

 const allParameters = [
    { 
      key: 'max_tokens', 
      type: 'number', 
      min: 1, 
      max: 1000, 
      step: 1,
      description: "Maximum number of tokens to generate",
      implication: "Limits response length, affects performance"
    },
    { 
      key: 'temperature', 
      type: 'number', 
      min: 0, 
      max: 2, 
      step: 0.1,
      description: "Controls randomness (lower = more deterministic)",
      implication: "0.7-1.0 for creative tasks, 0.1-0.3 for factual"
    },
    { 
      key: 'top_k', 
      type: 'number', 
      min: 1, 
      max: 100, 
      step: 1,
      description: "Number of highest probability tokens to consider",
      implication: "Lower values reduce diversity but increase quality"
    },
    { 
      key: 'top_p', 
      type: 'number', 
      min: 0, 
      max: 1, 
      step: 0.05,
      description: "Cumulative probability cutoff for sampling",
      implication: "0.9 balances diversity and coherence"
    },
    { 
      key: 'do_sample', 
      type: 'boolean',
      description: "Whether to sample from predictions",
      implication: "Required for temperature/top_k to take effect"
    },
    { 
      key: 'return_probs', 
      type: 'boolean',
      description: "Return class probabilities",
      implication: "Increases response size slightly"
    }
  ];


  // Get relevant parameters based on task type
  const getRelevantParams = (taskType) => {
    const paramsMap = {
      'causal_lm': ['max_tokens', 'temperature', 'top_k', 'top_p', 'do_sample'],
      'seq2seq_lm': ['max_tokens', 'temperature', 'top_k', 'top_p', 'do_sample'],
      'sequence_classification': ['return_probs'],
      'token_classification': ['return_probs'],
      'masked_lm': ['top_k'],
      'question_answering': ['max_tokens', 'top_k'],
      'embedding': []
    };
    return paramsMap[taskType] || [];
  };


  const relevantParams = selectedModelData ? 
    getRelevantParams(selectedModelData.task_type) : 
    [];

console.log("relevent Params are: ", relevantParams);

 const handleParamChange = (key, value) => {
  // Convert string values to proper types
  const convertedValue = 
    key === 'do_sample' || key === 'return_probs' 
      ? value === 'true' 
      : Number(value);
  
  setParams(prev => ({
    ...prev,
    [key]: convertedValue
  }));
};


  // Parameter definitions and implications
  const paramDescriptions = {
    max_tokens: {
      description: "Maximum number of tokens to generate",
      implication: "Limits response length, affects performance"
    },
    temperature: {
      description: "Controls randomness (lower = more deterministic)",
      implication: "0.7-1.0 for creative tasks, 0.1-0.3 for factual"
    },
    top_k: {
      description: "Number of highest probability tokens to consider",
      implication: "Lower values reduce diversity but increase quality"
    },
    top_p: {
      description: "Cumulative probability cutoff for sampling",
      implication: "0.9 balances diversity and coherence"
    },
    do_sample: {
      description: "Whether to sample from predictions",
      implication: "Required for temperature/top_k to take effect"
    },
    return_probs: {
      description: "Return class probabilities",
      implication: "Increases response size slightly"
    }
  };


  // Render parameter controls with descriptions
 //  const { description, implication } = paramDescriptions[param] || {};
  const renderParamControl = (param) => {
    const isRelevant = relevantParams.includes(param);
    const value = params[param];
   const { description, implication } = paramDescriptions[param] || {};

    return (
      <div key={param} className={styles.paramGroup}>
        <div className={styles.paramHeader}>
          <label className={!isRelevant ? styles.disabledLabel : ''}>
            {param.replace('_', ' ')}
          </label>
          {!isRelevant && (
            <span className={styles.paramHint}>(not applicable)</span>
          )}
        </div>
        
        {description && (
          <div className={styles.paramDescription}>
            {description}
            <div className={styles.paramImplication}>{implication}</div>
          </div>
        )}

        {param === 'do_sample' || param === 'return_probs' ? (
          <select
            value={value.toString()}
            onChange={(e) => handleParamChange(param, e.target.value)}
            disabled={!isRelevant}
            className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <input
            type="number"
            value={value}
            onChange={(e) => handleParamChange(param, e.target.value)}
            disabled={!isRelevant}
            className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
            min={param === 'temperature' || param === 'top_p' ? 0 : 1}
            max={param === 'temperature' ? 2 : param === 'top_p' ? 1 : 1000}
            step={param === 'temperature' || param === 'top_p' ? 0.1 : 1}
          />
        )}
      </div>
    );
  }; 

  {/* const renderAllParameters = () => {
    const allParams = [
      { key: 'max_tokens', type: 'number', min: 1, max: 1000, step: 1 },
      { key: 'temperature', type: 'number', min: 0, max: 2, step: 0.1 },
      { key: 'top_k', type: 'number', min: 1, max: 100, step: 1 },
      { key: 'top_p', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'do_sample', type: 'boolean' },
      { key: 'return_probs', type: 'boolean' }
    ];  */}

  const renderAllParameters = () => (
    <div className={styles.paramGrid}>
      {allParameters.map(({ key, type, min, max, step, description, implication }) => {
        const isRelevant = selectedModelData 
          ? relevantParams.includes(key)
          : false;
        
        return (
          <div key={key} className={styles.paramGroup}> {/* Added key here */}
            <label className={!isRelevant ? styles.disabledLabel : ''}>
              {key.replace('_', ' ')}
           
            </label>
            
            {type === 'boolean' ? (
              <select
                key={`select-${key}`}
                value={params[key].toString()}
                onChange={(e) => handleParamChange(key, e.target.value)}
                disabled={!isRelevant}
                className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                key={`input-${key}`} 
                type="number"
                value={params[key]}
                onChange={(e) => handleParamChange(key, e.target.value)}
                disabled={!isRelevant}
                className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
                min={min}
                max={max}
                step={step}
              />
            )}
            
            <div className={`${styles.paramDescription} ${!isRelevant ? styles.disabledText : ''}`}>
              {description}
              <div className={styles.paramImplication}>{implication}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Process input text based on source type
{/* const processInputText = (source) => {
  if (!source) return [];
  
  if (source.type === 'single') {   
    // For QA tasks, parse the input as JSON if it's in dictionary format
    if (selectedModelData?.task_type === 'question_answering') {
      try {
        const parsed = JSON.parse(source.input);
        if (parsed.question && parsed.context) {
          return [parsed]; // Return as array with one dictionary item
        }
      } catch (e) {
        // If not valid JSON, treat as regular text
        console.log('Input is not in QA dictionary format');
      }
    }
    // Default behavior for non-QA or invalid JSON
    return source.input.split('\n').filter(line => line.trim());
  } else if (source.type === 'batch') {
    return [source.name]; // Placeholder for batch files
  }
  return [];
}; */}

// In InferenceSubTab component
const processInputText = async (source) => {
  if (!source) {
    console.log("No source provided");
    return [];
  }

  // Handle single text input
  if (source.type === "single") {
    console.log("Processing single input:", source.input);
    return [source.input];
  }

  // Handle batch files
  if (source.type === "batch" && source.storage_path) {
    try {
      console.log("Processing batch file:", source.storage_path);
      const { data: fileData, error } = await supabase.storage
        .from("llm-datasources")
        .download(source.storage_path);
      
      if (error) throw error;
      const content = await fileData.text();
      console.log("Raw file content:", content.slice(0, 100) + "..."); // Log first 100 chars

      const fileExt = source.storage_path.split(".").pop().toLowerCase();
      console.log("File extension:", fileExt);

      // TSV/CSV Parser
      if (fileExt === "txt" || fileExt === "tsv" || fileExt === "csv") {
        const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
        console.log("Found rows:", rows.length);
        
        if (rows.length < 2) {
          console.warn("File has no data rows");
          return [];
        }

        const separator = content.includes("\t") ? "\t" : ",";
        console.log("Detected separator:", separator === "\t" ? "TAB" : "COMMA");

        const header = rows[0].split(separator).map(h => h.trim().toLowerCase());
        console.log("Header columns:", header);

        // Check for input_texts column
        if (header.includes("input_texts")) {
          const inputTextsIndex = header.indexOf("input_texts");
          console.log("input_texts column index:", inputTextsIndex);

          const results = rows.slice(1).map(row => {
            const columns = row.split(separator);
            let text = columns[inputTextsIndex] || "";
            
            // Clean quoted values
            if (text.startsWith('"') && text.endsWith('"')) {
              text = text.slice(1, -1);
            }
            
            // Handle Q&A format
            if (text.includes("||")) {
              const [question, context] = text.split("||").map(s => s.trim());
              return { question, context };
            }
            return text.trim();
          }).filter(text => text !== "");

          console.log("Processed results:", results);
          return results;
        }
        console.warn("No input_texts column found");
      }

      // JSON Parser
      else if (fileExt === "json") {
        try {
          const json = JSON.parse(content);
          console.log("Parsed JSON:", json);

          if (Array.isArray(json)) {
            const results = json.map(item => {
              // Handle various JSON formats
              if (item?.input_texts) {
                return {
                  question: item.input_texts.question || "",
                  context: item.input_texts.context || ""
                };
              }
              if (item?.question) {
                return {
                  question: item.question,
                  context: item.context || ""
                };
              }
              if (typeof item === "string") {
                if (item.includes("||")) {
                  const [q, a] = item.split("||").map(s => s.trim());
                  return { question: q, context: a };
                }
                return item;
              }
              return null;
            }).filter(Boolean);

            console.log("Processed JSON results:", results);
            return results;
          }
        } catch (e) {
          console.error("JSON parse error:", e);
          throw new Error("Invalid JSON format");
        }
      }
    } catch (error) {
      console.error("File processing failed:", error);
      return [`Error: ${error.message}`];
    }
  }
  
  console.warn("Unhandled source type");
  return [];
};



  // Update input preview when source changes
useEffect(() => {
  const loadInputPreview = async () => {
    if (selectedSourceData) {
      const processed = await processInputText(selectedSourceData);
      setInputPreview(processed);
    } else {
      setInputPreview([]);
    }
  };
  
  loadInputPreview();
}, [selectedSource]);


const getFilteredParams = () => {
  if (!selectedModelData) return {};
  
  const relevant = getRelevantParams(selectedModelData.task_type);
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key]) => relevant.includes(key))
  );
};

{/*
// Update the handleRun function to handle QA inputs differently
const handleRun = async () => {
  if (!selectedModel || !selectedSource) {
    setError('Please select both a model and data source');
    return;
  }

  const model = models.find(m => m.id === selectedModel);
  const source = sources.find(s => s.id === selectedSource);

  if (!model || !source) {
    setError('Invalid model or data source selected');
    return;
  }

  setError(null);
  setIsRunning(true);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  try {
    let inputTexts = Array.isArray(inputPreview) ? inputPreview : [inputPreview];
    
    // Special handling for QA tasks
    if (model.task_type === 'question_answering') {
      // Handle concatenated JSON objects (with commas)
      if (inputTexts.length === 1 && typeof inputTexts[0] === 'string' && 
          inputTexts[0].trim().startsWith('{') && inputTexts[0].includes('},{')) {
        try {
          // Convert to valid JSON array format
          const jsonArrayString = `[${inputTexts[0]}]`;
          const parsedArray = JSON.parse(jsonArrayString);
          
          inputTexts = parsedArray.map(item => {
            if (item.question && item.context) {
              return {
                question: String(item.question).trim(),
                context: String(item.context).trim()
              };
            }
            throw new Error('Missing question or context in one of the objects');
          });
        } catch (e) {
          throw new Error(`Failed to parse concatenated JSON: ${e.message}`);
        }
      }
      // Handle newline-separated JSON objects
      else if (inputTexts.length === 1 && typeof inputTexts[0] === 'string' && 
               inputTexts[0].includes('\n')) {
        inputTexts = inputTexts[0]
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            try {
              const parsed = JSON.parse(line.trim());
              if (!parsed.question || !parsed.context) {
                throw new Error('Missing question or context');
              }
              return {
                question: String(parsed.question).trim(),
                context: String(parsed.context).trim()
              };
            } catch (e) {
              throw new Error(`Invalid JSON line: ${line}\nError: ${e.message}`);
            }
          });
      }
      // Handle single QA pair cases (existing logic)
      else {
        // Normalize to array
        if (!Array.isArray(inputTexts)) {
          inputTexts = [inputTexts];
        }

        inputTexts = inputTexts.map((input, index) => {
          // Handle object case
          if (typeof input === 'object' && input !== null) {
            if (input.question && input.context) {
              return {
                question: String(input.question).trim(),
                context: String(input.context).trim()
              };
            }
            throw new Error(`Item ${index}: Missing question or context`);
          }
          
          // Handle string case
          if (typeof input === 'string') {
            try {
              const parsed = JSON.parse(input.trim());
              if (parsed.question && parsed.context) {
                return {
                  question: String(parsed.question).trim(),
                  context: String(parsed.context).trim()
                };
              }
              throw new Error('Missing question or context in JSON');
            } catch (e) {
              throw new Error(`Invalid JSON format: ${e.message}`);
            }
          }
          
          throw new Error(`Unsupported input type: ${typeof input}`);
        });
      }
    }


   console.log("[debug in handleRun ] input texts are", inputTexts);
    const filteredParams = getFilteredParams();

    const payload = {
      model_id: selectedModel,
      model_name: model.name,
      model_display_name: model.display_name,
      model_class: model.model_class,
      model_task_type: model.task_type,
      endpoint: model.endpoint,
      data_source_id: selectedSource,
      data_source_name: source.name,
      data_source_type: source.type,
      created_by: user.email,
      input_texts: inputTexts,
      params: filteredParams
    };

    const result = await onRunInference(payload);
    setCurrentJob(result);

  } catch (err) {
    console.error('Inference error:', err);
    setError(err.message || 'Failed to run inference');
  } finally {
    setIsRunning(false);
  }
};  */}

const handleRun = async () => {
  if (!selectedModel || !selectedSource) {
    setError('Please select both a model and data source');
    return;
  }

  const model = models.find(m => m.id === selectedModel);
  const source = sources.find(s => s.id === selectedSource);

  if (!model || !source) {
    setError('Invalid model or data source selected');
    return;
  }

  setError(null);
  setIsRunning(true);

const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated"); }

 try {
    let inputTexts = Array.isArray(inputPreview) ? inputPreview : [inputPreview];
    
    // QA Task Handling
    if (model.task_type === 'question_answering') {
      if (inputTexts.length === 1 && typeof inputTexts[0] === 'string') {
        // Remove all newlines for easier parsing
        const cleanInput = inputTexts[0].replace(/\n/g, '').trim();
        
        // Parse comma-separated objects
        try {
          // Convert to valid JSON array format
          const jsonArrayStr = `[${cleanInput}]`;
          const parsedArray = JSON.parse(jsonArrayStr);
          
          // Validate and format each object
          inputTexts = parsedArray.map(obj => {
            if (!obj.question || !obj.context) {
              throw new Error('Each entry must have both "question" and "context"');
            }
            return {
              question: obj.question.trim(),
              context: obj.context.trim()
            };
          });
        } catch (e) {
          throw new Error(
            `Invalid QA format. Use:\n` +
            `{"question":"Q1","context":"C1"}, {"question":"Q2","context":"C2"}`
          );
        }
      }
      console.log("Processed QA pairs:", inputTexts);
    }

    
    const filteredParams = getFilteredParams();
    const payload = {
      model_id: selectedModel,
      model_name: model.name,
      model_display_name: model.display_name,
      model_task_type: model.task_type,
      endpoint: model.endpoint,
      data_source_id: selectedSource,
      data_source_name: source.name,
      data_source_type: source.type,
      created_by: user.email,
      input_texts: inputTexts, // List of {question, context} pairs
      params: filteredParams
    };

    const result = await onRunInference(payload);
    setCurrentJob(result);
//}

  } catch (err) {
    console.error('Inference error:', err);
    setError(
      err.message.includes('Invalid QA format') ?
      err.message :
      `QA input error: ${err.message}\n\n` +
      `Example valid inputs:\n` +
      `Single object:\n{\n  "question": "...",\n  "context": "..."\n}\n\n` +
      `Multiple objects:\n{\n  "question": "Q1",\n  "context": "C1"\n},\n{\n  "question": "Q2",\n  "context": "C2"\n}`
    );
  } finally {
    setIsRunning(false);
  }
};






 {/* const handleViewResults = (job) => {
    setViewingResults({
        inputs: JSON.stringify(job.input_text,null,2),// || [job.input_text], //inputs: job.input_texts || [job.input_text], // Handle both array and single string
      output:JSON.stringify(job.results,null,2),     //output: job.results.predictions,
      params: job.params
    });
  }; */}

{/*
const handleViewResults = (job) => {
  console.log('Raw job.input_text as type of :', job.input_text, typeof job.input_text); // Debug log
  
  let inputDisplay;
  let outputDisplay;

  try {
    // Handle input display
    if (job.model_task_type === 'question_answering') {
      // If input_text is already an object (common case)
      if (typeof job.input_text === 'object' && job.input_text !== null) {
        inputDisplay = `Question: ${job.input_text.question}\nContext: ${job.input_text.context}`;
      } 
      // If input_text is a JSON string
      else if (typeof job.input_text === 'string') {
        const parsed = JSON.parse(job.input_text);
        inputDisplay = `Question: ${parsed.question}\nContext: ${parsed.context}`;
      } else {
        inputDisplay = 'Invalid QA input format';
      }
    } else {
      // For non-QA tasks
      if (typeof job.input_text === 'string') {
        inputDisplay = job.input_text;
      } else {
        inputDisplay = JSON.stringify(job.input_text, null, 2);
      }
    }

    // Handle output display
    if (typeof job.results === 'string') {
      try {
        // Try to parse if it might be JSON
        outputDisplay = JSON.stringify(JSON.parse(job.results), null, 2);
      } catch {
        outputDisplay = job.results;
      }
    } else {
      outputDisplay = JSON.stringify(job.results, null, 2);
    }

    setViewingResults({
      inputs: inputDisplay,
      output: outputDisplay,
      params: job.params ? JSON.stringify(job.params, null, 2) : 'No params'
    });

  } catch (e) {
    console.error('Error displaying results:', e);
    setViewingResults({
      inputs: `Error displaying input: ${e.message}`,
      output: `Error displaying output: ${e.message}`,
      params: 'No params'
    });
  }
};
*/}

const handleViewResults = (job) => {
  console.log('Raw job.input_text:', job.input_text, typeof job.input_text); // Debug log
  
  const parseInputText = (input) => {
    // Case 1: Already parsed object
    if (typeof input === 'object' && input !== null) {
      return input;
    }
    
    // Case 2: String representation of object ("[object Object]")
    if (typeof input === 'string' && input.startsWith('[object ')) {
      try {
        // Try to get the actual object (might need custom logic based on your data structure)
        // This is a fallback - ideally fix the data at the source
        if (job.model_task_type === 'question_answering' && job.input_text_obj) {
          return job.input_text_obj; // If you have access to the original object
        }
        return { error: "Could not parse [object Object] string" };
      } catch (e) {
        return { error: `Failed to parse: ${e.message}` };
      }
    }
    
    // Case 3: JSON string
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch {
        return input; // Return as-is if not JSON
      }
    }
    
    // Case 4: Other types
    return input;
  };

  const formatQAPair = (qa) => {
    if (!qa) return 'No QA data';
    if (typeof qa === 'string') return qa;
    
    return `QUESTION: ${qa.question || 'No question provided'}\nCONTEXT: ${qa.context || 'No context provided'}`;
  };

  let inputDisplay;
  let outputDisplay;

  try {
    // Handle input display
    const parsedInput = parseInputText(job.input_text);
    
    if (job.model_task_type === 'question_answering') {
      if (Array.isArray(parsedInput)) {
        // Handle array of QA pairs
        inputDisplay = parsedInput.map(formatQAPair).join('\n\n---\n\n');
      } else {
        // Single QA pair
        inputDisplay = formatQAPair(parsedInput);
      }
    } else {
      // Non-QA tasks
      if (Array.isArray(parsedInput)) {
        inputDisplay = parsedInput.map(item => 
          typeof item === 'object' ? JSON.stringify(item, null, 2) : item
        ).join('\n\n---\n\n');
      } else {
        inputDisplay = typeof parsedInput === 'object' 
          ? JSON.stringify(parsedInput, null, 2) 
          : parsedInput;
      }
    }

    // Handle output display
    if (typeof job.results === 'string') {
      try {
        outputDisplay = JSON.stringify(JSON.parse(job.results), null, 2);
      } catch {
        outputDisplay = job.results;
      }
    } else {
      outputDisplay = JSON.stringify(job.results, null, 2);
    }

    setViewingResults({
      inputs: inputDisplay,
      output: outputDisplay,
      params: job.params ? JSON.stringify(job.params, null, 2) : 'No params'
    });

  } catch (e) {
    console.error('Error displaying results:', e);
    setViewingResults({
      inputs: `Error displaying input: ${e.message}\nRaw input: ${job.input_text}`,
      output: `Error displaying output: ${e.message}`,
      params: 'No params'
    });
  }
};


console.log(viewingResults);

{/*
   const handleDownloadResults = (job) => {
    const blob = new Blob([JSON.stringify(job.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inference_results_${job.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };  */}

const handleDownloadResults = (job) => {
  // Get the full source data
  const source = sources.find(s => s.id === job.data_source_id);
  const model = models.find(m => m.id === job.model_id);

  // Format results with auto-wrapping for long text
  const formatForDownload = (data) => {
    if (typeof data === 'string') {
      // Auto-wrap long text (80 characters per line)
      return data.replace(/(.{80})/g, '$1\n');
    }
    return data;
  };

  // Prepare the download data with better formatting
  const downloadData = {
    metadata: {
      job_id: job.id,
      timestamp: new Date(job.job_start_ts).toISOString(),
      status: job.status,
      duration_ms: job.job_finish_ts 
        ? new Date(job.job_finish_ts) - new Date(job.job_start_ts)
        : null
    },
    model: {
      id: job.model_id,
      name: model?.name || job.model_name,
      display_name: model?.display_name || job.model_display_name,
      task_type: model?.task_type || job.model_task_type,
      endpoint: model?.endpoint || job.endpoint
    },
    source: {
      id: source?.id || job.data_source_id,
      name: source?.name || job.data_source_name,
      type: source?.type || job.data_source_type,
      description: source?.description,
      size: source?.size,
      created_at: source?.uploaded_at
    },
    parameters: job.params || {},
    input: {
      text: formatForDownload(job.input_text),
      preview: `First 200 chars: ${job.input_text?.substring(0, 200)}...`,
      source_file: source?.storage_path || null
    },
    results: {
      raw: job.results,
      formatted: formatForDownload(
        typeof job.results === 'string' 
          ? job.results 
          : JSON.stringify(job.results, null, 2))
    }
  };

  // Create a nicely formatted JSON string with 2-space indentation
  const jsonString = JSON.stringify(downloadData, (key, value) => {
    if (typeof value === 'string' && value.length > 100) {
      return `${value.substring(0, 100)}... [truncated]`;
    }
    return value;
  }, 2);

  // Create and trigger download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inference_${job.model_display_name}_${new Date(job.job_start_ts).toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};



  // Parameter input component
  const renderParamInput = (param) => {
    const isRelevant = relevantParams.includes(param);
    const value = params[param];
    
    if (param === 'do_sample') {
      return (
        <select
          value={value.toString()}
          onChange={(e) => handleParamChange(param, e.target.value)}
          disabled={!isRelevant}
          className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    return (
      <input
        type="number"
        value={value}
        onChange={(e) => handleParamChange(param, e.target.value)}
        disabled={!isRelevant}
        className={`${styles.paramInput} ${!isRelevant ? styles.disabledParam : ''}`}
        min={param === 'temperature' ? 0 : 1}
        max={param === 'temperature' ? 2 : param === 'top_p' ? 1 : 1000}
        step={param === 'temperature' ? 0.1 : 1}
      />
    );
  };


 const renderJobHistory = () => (
    <div className={styles.jobHistory}>
      <h3>Job History</h3>
      {jobs.length === 0 ? (
        <p>No inference jobs yet</p>
      ) : (
        <div className={styles.jobTableContainer}>
          <table className={styles.jobTable}>
            <thead>
              <tr>
                <th>Model</th>
                <th>Display Name</th>
                <th>Start Time</th>
                <th>Finish Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}> {/* Added key for each job row */}
                  <td>{job.model_name}</td>
                  <td>{job.model_display_name}</td>
                  <td>{new Date(job.job_start_ts).toLocaleString()}</td>
                  <td>{job.job_finish_ts ? new Date(job.job_finish_ts).toLocaleString() : 'N/A'}</td>
                  <td>
                    {job.job_finish_ts && job.job_start_ts 
                      ? `${new Date(job.job_finish_ts) - new Date(job.job_start_ts)}ms`
                      : 'N/A'}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      job.status === 'completed' ? styles.success :
                      job.status === 'failed' ? styles.error :
                      styles.pending
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.jobActions}>
                      <button 
                        onClick={() => handleViewResults(job)}
                        className={styles.viewButton}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDownloadResults(job)}
                        className={styles.downloadButton}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  return (
    <div className={styles.inferenceTab}>
      {error && <div className={styles.errorBanner}>Error: {error}</div>}

      <div className={styles.twoColumnLayout}>
        {/* Left Column - Model and Parameters */}
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h3>Inference Models </h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Select a Model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.display_name} ({model.task_type})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <h4>Generation Parameters</h4>
                       {renderAllParameters()}
          </div>
        </div>

        {/* Right Column - Data Source and Preview */}
        <div className={styles.rightColumn}>
          <div className={styles.section}>
            <h3>Data Source</h3>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Select a Data Source</option>
              {sources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.type})
                </option>
              ))}
            </select>
          </div>

         <div className={styles.section}>
  <h4>Input Preview ({inputPreview.length} items)</h4>
 <div className={styles.previewBox}>
    {inputPreview.length > 0 ? (
      <div className={styles.inputList}>
        {inputPreview.slice(0, 3).map((input, index) => (
          <div key={index} className={styles.inputItem}>
            {selectedModelData?.task_type === 'question_answering' && 
             typeof input === 'object' ? (
              <>
                <div><strong>Question:</strong> {input.question}</div>
                <div><strong>Context:</strong> {input.context}</div>
              </>
            ) : (
              typeof input === 'string' ? 
                (input.length > 50 ? `${input.substring(0, 50)}...` : input) :
                JSON.stringify(input)
            )}
          </div>
        ))}
        {inputPreview.length > 3 && (
          <div className={styles.moreItems}>
            + {inputPreview.length - 3} more items
          </div>
        )}
      </div>
    ) : (
      "No input preview available"
    )}
  </div>
</div>


  </div>
</div>
{/* original, there are four </div> */}


      <div className={styles.runButtonContainer}>
        <button
          onClick={handleRun}
          disabled={!selectedModel || !selectedSource || isRunning || inputPreview.length === 0}
          className={styles.runButton}
        >
          {isRunning ? (
            <>
              <span className={styles.spinner}></span>
              Running Inference...
            </>
          ) : 'Run Inference'}
        </button>
      </div>

      {currentJob && (
        <div className={styles.currentJob}>
          <h3>Latest Inference Result</h3>
          <div className={styles.jobSummary}>
            <div>
              <strong>Model:</strong> {currentJob.model_name}
            </div>
            <div>
              <strong>Source:</strong> {currentJob.data_source_name}
            </div>
            <div>
              <strong>Status:</strong> 
              <span className={`${styles.statusBadge} ${styles.success}`}>
                {currentJob.status}
              </span>
            </div>
            <div>
              <strong>Duration:</strong> 
              {currentJob.job_finish_ts && currentJob.job_start_ts 
                ? `${new Date(currentJob.job_finish_ts) - new Date(currentJob.job_start_ts)}ms`
                : 'N/A'}
            </div>
          </div>
          <div className={styles.resultActions}>
            <button 
              onClick={() => handleViewResults(currentJob)}
              className={styles.viewButton}
            >
              View Full Results
            </button>
            <button 
              onClick={() => handleDownloadResults(currentJob)}
              className={styles.downloadButton}
            >
              Download Results
            </button>
          </div>
        </div>
      )}

      <div className={styles.jobHistory}>
        <h3>Job History</h3>
        {jobs.length === 0 ? (
          <p>No inference jobs yet</p>
        ) : (
          <div className={styles.jobTableContainer}>
            <table className={styles.jobTable}>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Display Name</th>
                  <th>Start Time</th>
                  <th>Finish Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td>{job.model_name}</td>
                    <td>{job.model_display_name}</td>
                    <td>{new Date(job.job_start_ts).toLocaleString()}</td>
                    <td>{job.job_finish_ts ? new Date(job.job_finish_ts).toLocaleString() : 'N/A'}</td>
                    <td>
                      {job.job_finish_ts && job.job_start_ts 
                        ? `${new Date(job.job_finish_ts) - new Date(job.job_start_ts)}ms`
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        job.status === 'completed' ? styles.success :
                        job.status === 'failed' ? styles.error :
                        styles.pending
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.jobActions}>
                        <button 
                          onClick={() => handleViewResults(job)}
                          className={styles.viewButton}
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDownloadResults(job)}
                          className={styles.downloadButton}
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

{viewingResults && (
        <div className={styles.resultsModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Inference Results</h3>
              <button 
                onClick={() => setViewingResults(null)}
                className={styles.closeButton}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.resultSection}>
                <h4>Parameters</h4>
                 <pre>{viewingResults.params}</pre>
               {/* <section>{JSON.stringify(viewingResults.params, null, 2)}</section> */}
              </div>        
 




  <div className={styles.resultSection}>
          <h4>Input</h4>
          <pre className={styles.resultPre}>
            {viewingResults.inputs}
          </pre>
        </div>


              <div className={styles.resultSection}>
                <h4>Output</h4>
                <div className={styles.outputText}>
                  {Array.isArray(viewingResults.output) ? (
                    <div className={styles.outputList}>
                      {viewingResults.output.map((item, index) => (
                        <div key={index} className={styles.outputItem}>
                          {JSON.stringify(item, null, 2)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    viewingResults.output
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}