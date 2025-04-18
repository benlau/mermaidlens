import * as vscode from "vscode";

export interface MermaidBlockInfo {
  sequence: number;
  content: string;
  startLine: number;
  endLine: number;
  startCharacter: number;
  endCharacter: number;
  documentUri: vscode.Uri;
}

export class MermaidBlockInfoAccessor {
  data: MermaidBlockInfo;

  constructor(data: MermaidBlockInfo) {
    this.data = data;
  }

  isSameBlock(other: MermaidBlockInfo | null) {
    if (!other) {
      return false;
    }

    return (
      this.data.documentUri.path === other.documentUri.path && this.data.sequence === other.sequence
    );
  }

  isContentChanged(other: MermaidBlockInfo | null) {
    if (!other) {
      return true;
    }

    return this.data.content !== other.content;
  }
}

export function accessMermaidBlockInfo(blockInfo: MermaidBlockInfo) {
  return new MermaidBlockInfoAccessor(blockInfo);
}

export interface UpdateMermaidGraphMessage {
  type: "updateMermaidGraph";
  blockInfo: MermaidBlockInfo;
}

export interface ShowNotificationMessage {
  type: "showNotification";
  message: string;
  notificationType: "info" | "error" | "warning";
}

export type WebviewMessage = UpdateMermaidGraphMessage | ShowNotificationMessage;

export interface WebviewWindow extends Window {
  vscode: {
    postMessage(message: WebviewMessage): void;
  };
  blockInfo: MermaidBlockInfo;
  documentUri: string;
}
