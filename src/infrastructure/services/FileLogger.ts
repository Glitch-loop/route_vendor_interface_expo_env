// src/infrastructure/logging/FileLogger.ts
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
// import * as Sharing from 'expo-sharing';


const LOG_FILE_NAME = 'daily_error_logs.txt';
const LOG_MIME_TYPE = 'text/plain';

let downloadsDirectoryUri: string | null = null;
let logFileUri: string | null = null;

function isAndroidDownloadsUri(uri: string): boolean {
  return uri.includes('Downloads') || uri.includes('Download');
}

export class FileLogger {
  /**
   * Appends an error entry to the local log file on the device
   */
  static async logError(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
    try {
      const logFilePath = await FileLogger.getLogFilePath();
      const timestamp = new Date().toISOString();
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';

      const logEntry = `
========================================
TIMESTAMP: ${timestamp}
MESSAGE: ${errorMessage}
CONTEXT: ${JSON.stringify(context, null, 2)}
STACK:
${errorStack}
========================================\n`;

      if (logFilePath) {
        const existingLogs = await FileSystem.readAsStringAsync(logFilePath);
        await FileSystem.writeAsStringAsync(logFilePath, existingLogs + logEntry);
      } else {
        console.log('Creating new file');
        const createdLogFilePath = await FileLogger.getLogFilePath(true);

        if (!createdLogFilePath) {
          throw new Error('Unable to create log file in Downloads.');
        }

        await FileSystem.writeAsStringAsync(createdLogFilePath, logEntry);
      }

      console.log('🔴 [FileLogger] Error written to local file log.');
    } catch (loggingErr) {
      console.error('Failed to write log to file system:', loggingErr);
    }
  }

  /**
   * Share/Export the log file (WhatsApp, Email, Drive, etc.)
   */
  // static async exportLogFile(): Promise<void> {
  //   const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);

  //   if (!fileInfo.exists) {
  //     alert('No log file found for today.');
  //     return;
  //   }

  //   const isAvailable = await Sharing.isAvailableAsync();
  //   if (isAvailable) {
  //     await Sharing.shareAsync(LOG_FILE_PATH, {
  //       mimeType: 'text/plain',
  //       dialogTitle: 'Export Today Error Logs',
  //       UTI: 'public.plain-text',
  //     });
  //   } else {
  //     alert('Sharing is not supported on this device.');
  //   }
  // }

  /**
   * Clear logs at the end of the day or after exporting
   */
  static async clearLogs(): Promise<void> {
    const path = await FileLogger.getLogFilePath();
    if (path) {
      await FileSystem.deleteAsync(path);
      alert('Logs cleared successfully.');
    }
  }

  private static async getLogFilePath(forceCreate = false): Promise<string | null> {
    if (Platform.OS !== 'android') {
      return `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ''}${LOG_FILE_NAME}`;
    }

    if (logFileUri && !forceCreate) {
      return logFileUri;
    }

    const initialDownloadsUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Downloads');
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialDownloadsUri);

    if (!permission.granted) {
      return null;
    }

    downloadsDirectoryUri = permission.directoryUri;

    if (!forceCreate) {
      const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(permission.directoryUri);
      const existingFile = files.find((uri) => uri.endsWith(LOG_FILE_NAME));

      if (existingFile) {
        logFileUri = existingFile;
        return existingFile;
      }
    }

    const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      downloadsDirectoryUri,
      LOG_FILE_NAME,
      LOG_MIME_TYPE,
    );

    logFileUri = createdFileUri;
    return createdFileUri;
  }
}