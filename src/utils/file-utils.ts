import * as fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Safely deletes a file from disk.
 * @param path The file path to delete
 */
export const safeDeleteFile = async (path: string,check:string): Promise<void> => {
  if (existsSync(path)) {
    try {
      await fs.unlink(path);
      console.log(`File deleted: ${path}`,check);
    } catch (err) {
      console.error(`Error deleting file: ${path}`, err,check);
    }
  } else {
    console.warn(`File not found (not deleted): ${path}`,check);
  }
};
