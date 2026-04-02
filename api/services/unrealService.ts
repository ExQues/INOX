import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Service responsible for connecting the Node.js API with Unreal Engine 5.
 */
export const invokeUnrealBridge = async (config: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const configStr = JSON.stringify(config).replace(/"/g, '\\"');
      const scriptPath = path.resolve(process.cwd(), 'ue_scripts', 'ai_bridge.py');
      
      if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python bridge script not found at ${scriptPath}`));
      }

      // In a real environment, you would call Unreal Engine CLI here.
      // e.g., UnrealEditor-Cmd.exe "C:/Path/To/Project.uproject" -ExecutePythonScript="..."
      // For this bridge, we assume Epic's python comes with the project or we run local python interpreter
      
      const command = `python "${scriptPath}" "${configStr}"`;
      
      console.log(`[UnrealService] Executing: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[UnrealService] Execution Error: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`[UnrealService] Stderr: ${stderr}`);
        }
        
        console.log(`[UnrealService] Stdout: ${stdout}`);
        
        // This confirms the action was sent. In a full implementation, 
        // the python script could return JSON stats.
        resolve({
          status: 'success',
          output: stdout
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};
