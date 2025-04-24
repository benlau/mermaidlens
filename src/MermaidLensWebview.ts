import * as vscode from "vscode";
import { accessMermaidBlockInfo, MermaidBlockInfo, WebviewMessage } from "./types/message";
import path from "path";

export class MermaidLensWebview {
  private static instance: MermaidLensWebview | null = null;
  public panel: vscode.WebviewPanel | null = null;
  public activeBlockInfo: MermaidBlockInfo | null = null;
  private context: vscode.ExtensionContext | null = null;
  private constructor() {}

  public static getInstance(): MermaidLensWebview {
    if (!MermaidLensWebview.instance) {
      MermaidLensWebview.instance = new MermaidLensWebview();
    }
    return MermaidLensWebview.instance;
  }

  public isActiveBlock(blockInfo: MermaidBlockInfo): boolean {
    if (!this.activeBlockInfo) {
      return false;
    }

    return accessMermaidBlockInfo(this.activeBlockInfo).isSameBlock(blockInfo);
  }

  private getOppositeViewColumn(): vscode.ViewColumn {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return vscode.ViewColumn.One;
    }

    const currentColumn = activeEditor.viewColumn;
    return currentColumn === vscode.ViewColumn.One ? vscode.ViewColumn.Two : vscode.ViewColumn.One;
  }

  public show(context: vscode.ExtensionContext, blockInfo: MermaidBlockInfo) {
    this.context = context;
    this.activeBlockInfo = blockInfo;

    if (this.panel) {
      this.panel.reveal(this.getOppositeViewColumn());
      this.updateContent(blockInfo);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        "mermaidLens",
        "Mermaid Lens",
        this.getOppositeViewColumn(),
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "assets"),
            vscode.Uri.joinPath(context.extensionUri, "out"),
          ],
        },
      );

      this.panel.webview.html = this.getWebviewContent(context, this.panel.webview, blockInfo);

      this.panel.onDidDispose(
        () => {
          this.panel = null;
          this.activeBlockInfo = null;
        },
        null,
        context.subscriptions,
      );

      this.panel.webview.onDidReceiveMessage(
        (message: WebviewMessage) => {
          switch (message.type) {
            case "showNotification":
              switch (message.notificationType) {
                case "info":
                  vscode.window.showInformationMessage(message.message);
                  break;
                case "error":
                  vscode.window.showErrorMessage(message.message);
                  break;
                case "warning":
                  vscode.window.showWarningMessage(message.message);
                  break;
              }
              break;
          }
        },
        undefined,
        context.subscriptions,
      );

      context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
          console.log("onDidChangeConfiguration", e);
          if (e.affectsConfiguration("mermaidlens")) {
            if (this.panel && this.activeBlockInfo) {
              this.panel.webview.html = this.getWebviewContent(
                context,
                this.panel.webview,
                this.activeBlockInfo,
              );
            }
          }
        }),
      );
    }
  }

  public processBlock(blockInfo: MermaidBlockInfo) {
    if (
      this.panel &&
      this.isActiveBlock(blockInfo) &&
      this.activeBlockInfo?.content !== blockInfo.content
    ) {
      this.updateContent(blockInfo);
    }
  }

  public updateContent(blockInfo: MermaidBlockInfo) {
    if (this.panel) {
      this.activeBlockInfo = blockInfo;
      const message: WebviewMessage = {
        type: "updateMermaidGraph",
        blockInfo: blockInfo,
      };
      this.panel.webview.postMessage(message);
    }
  }

  private getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    blockInfo: MermaidBlockInfo,
  ): string {
    const scriptPath = vscode.Uri.joinPath(context.extensionUri, "out", "webview.js");
    const scriptUri = webview.asWebviewUri(scriptPath);

    const assetPath = vscode.Uri.file(path.join(context.extensionPath, "assets"));

    const assetUrl = webview.asWebviewUri(assetPath);

    const cssPath = vscode.Uri.file(path.join(context.extensionPath, "out", "webview.css"));
    const cssUrl = webview.asWebviewUri(cssPath);

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <style>
                    body {
                        width: 100vh;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                    }
                </style>
                <meta charset="UTF-8">
                <title>Mermaid Lens</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${cssUrl}?v=${Date.now()}">
            </head>
            <body class="--vscode-editor-background">
                <div id="root" class="w-full h-full overflow-hidden"></div>
                <script>
                    window.initialBlockInfo = ${JSON.stringify(blockInfo || "")};
                    window.assetUrl = ${JSON.stringify(assetUrl.toString())};
                    window.vscode = acquireVsCodeApi();
                    window.exportMermaidTheme = ${JSON.stringify(vscode.workspace.getConfiguration("mermaidlens").get("exportMermaidTheme"))};
                    window.exportPngResolution = ${JSON.stringify(vscode.workspace.getConfiguration("mermaidlens").get("exportPngResolution"))};
                </script>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}
