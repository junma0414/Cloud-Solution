// app/api/modal/delete-model/route.js

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const USER_NAME = 'junma0614'; // Replace with your Modal username



export async function POST(request) {
  try {
    // 1 Verify Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Invalid or missing authorization token' },
        { status: 401 }
      );
    }

    const { modelPath, displayName} = await request.json();
    
    if (!modelPath) {
      return NextResponse.json(
        { error: 'Missing modelPath parameter' },
        { status: 400 }
      );
    }

    // Extract filename from path (modal://volume-name/filename)
    const fileName = modelPath.split('/').pop();
    const volumeName = 'llm-models';

    //2  Delete from Modal volume
    await execAsync(`modal volume rm -r ${volumeName} ${fileName}`);


   //3 Delete from Modal Endpoint(stop it as delete is no longer available)
    let endpointDeleted = false;
    if (displayName) {
      try {
        // Convert display_name to endpoint format (replace underscores with hyphens)
     //   const endpointName = displayName.replace(/_/g, '-');
       // await execAsync(`modal app stop ${USER_NAME}--${endpointName}-fastapi-app`);
 await execAsync(`modal app stop ${displayName}`);
        endpointDeleted = true;
      } catch (endpointError) {
        console.warn('Endpoint deletion failed (might not exist):', endpointError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Model ${fileName} deleted successfully`
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete model',
        details: error.message
      },
      { status: 500 }
    );
  }
}