import { MermaidBlockInfo } from "./message";

declare global {
  interface Window {
    vscode: {
      postMessage(message: any): void;
    };
    initialBlockInfo: MermaidBlockInfo;
    assetUrl: string;
    exportPngResolution: number;
  }
}

export {};
