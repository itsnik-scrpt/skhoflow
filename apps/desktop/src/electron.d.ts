export {};

declare global {
  interface Window {
    electron: {
      saveDocument: (content: string) => Promise<boolean>;
      loadDocuments: () => Promise<string[]>;
      executeCode: (code: string, language: string) => Promise<string>;
    };
  }
}
