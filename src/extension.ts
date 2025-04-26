import * as vscode from "vscode";
import { MermaidBlockInfo } from "./types/message";
import { MermaidLensWebview } from "./MermaidLensWebview";
import { MermaidCodeLensProvider } from "./MermaidLensProvider";

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerCodeLensProvider(
    { scheme: "file", language: "markdown" },
    new MermaidCodeLensProvider(),
  );

  vscode.languages.registerCodeLensProvider(
    { scheme: "file", language: "quarto" },
    new MermaidCodeLensProvider(),
  );

  let openLensCommand = vscode.commands.registerCommand(
    "mermaidlens.openGraphViewer",
    async (blockInfo: MermaidBlockInfo) => {
      const webview = MermaidLensWebview.getInstance();
      webview.show(context, blockInfo);
    },
  );

  context.subscriptions.push(openLensCommand);
}

export function deactivate() {}
