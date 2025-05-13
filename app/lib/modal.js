import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function modalCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(
      `MODAL_TOKEN_ID=${process.env.MODAL_TOKEN_ID} \
       MODAL_TOKEN_SECRET=${process.env.MODAL_TOKEN_SECRET} \
       modal ${command}`
    );

    if (stderr) throw new Error(stderr);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Modal command failed:', error);
    throw error;
  }
}