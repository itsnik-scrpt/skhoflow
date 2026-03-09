import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  saveDocument: (content: string) => ipcRenderer.invoke('save-document', content),
  loadDocuments: () => ipcRenderer.invoke('load-documents'),
  executeCode: (code: string, language: string) => ipcRenderer.invoke('execute-code', { code, language }),
});
