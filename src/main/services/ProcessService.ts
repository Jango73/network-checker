import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface ProcessInfo {
  name: string;
  path: string;
  isSigned: boolean;
}

export class ProcessService {
  /**
   * Get process name for a given PID.
   * @param pid Process ID.
   * @returns Process name or empty string if not found.
   */
  async getProcessName(pid: number): Promise<string> {
    try {
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
      const lines = stdout.split('\n').filter((line) => line.includes(`"${pid}"`));
      if (lines.length === 0) return '';
      const [name] = lines[0].split('","');
      return name ? name.replace(/^"/, '') : '';
    } catch (error) {
      throw new Error(`Failed to get process name for PID ${pid}: ${(error as Error).message}`);
    }
  }

  /**
   * Get process executable path for a given PID.
   * @param pid Process ID.
   * @returns Process path or empty string if not found.
   */
  async getProcessPath(pid: number): Promise<string> {
    try {
      const { stdout } = await execAsync(`wmic process where ProcessId=${pid} get ExecutablePath /VALUE`);
      const match = stdout.match(/ExecutablePath=(.*)/);
      return match ? path.normalize(match[1].trim()) : '';
    } catch (error) {
      throw new Error(`Failed to get process path for PID ${pid}: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a process is digitally signed.
   * @param pid Process ID.
   * @returns True if signed, false otherwise.
   */
  async isProcessSigned(pid: number): Promise<boolean> {
    try {
      const processPath = await this.getProcessPath(pid);
      if (!processPath) return false;

      const { stdout } = await execAsync(`powershell -Command "Get-AuthenticodeSignature -FilePath '${processPath}' | Select-Object -ExpandProperty Status"`);
      return stdout.trim() === 'Valid';
    } catch (error) {
      throw new Error(`Failed to verify signature for PID ${pid}: ${(error as Error).message}`);
    }
  }

  /**
   * Get all process information for a given PID.
   * @param pid Process ID.
   * @returns Process information (name, path, signature status).
   */
  async getProcessInfo(pid: number): Promise<ProcessInfo> {
    const [name, path, isSigned] = await Promise.all([
      this.getProcessName(pid),
      this.getProcessPath(pid),
      this.isProcessSigned(pid),
    ]);

    return { name, path, isSigned };
  }
}