export interface DiagnosticFile {
  name: string;
  dataBase64: string;
  metadata: Record<string, unknown>;
}

export interface DiagnosticBridge {
  readCurrentJg(): Promise<DiagnosticFile>;
  captureScreenshot(): Promise<string>;
  getAppInfo(): Promise<Record<string, unknown>>;
  saveZip(name: string, dataBase64: string): Promise<string>;
  copyFilename(name: string): Promise<void>;
  openIssue(url: string): Promise<void>;
}

declare global {
  interface Window {
    runbunDiagnostics?: DiagnosticBridge;
  }
}
