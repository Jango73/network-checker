import fs from 'fs/promises';
import path from 'path';
import { Config } from '../../types/config';
import { DEFAULT_CONFIG } from '../../shared/defaultConfig';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export class ConfigService {
  /**
   * Load configuration from config.json or initialize with defaults.
   * @returns Configuration object.
   */
  async loadConfig(): Promise<Config> {
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      const config = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
      throw new Error(
        `Failed to load configuration: ${(error as Error).message}`
      );
    }
  }

  /**
   * Save configuration to config.json.
   * @param config Configuration object to save.
   */
  async saveConfig(config: Config): Promise<void> {
    try {
      await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(
        `Failed to save configuration: ${(error as Error).message}`
      );
    }
  }

  /**
   * Reset configuration to default values.
   * @returns Default configuration object.
   */
  async resetConfig(): Promise<Config> {
    await this.saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}
