import * as vscode from "vscode";
import { MermaidBlockInfo } from "./types/message";
import { MermaidLensWebview } from "./MermaidLensWebview";
import { MermaidCodeLensProvider } from "./MermaidLensProvider";

export function activate(context: vscode.ExtensionContext) {
  const codeLensProvider = new MermaidCodeLensProvider(context);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider("markdown", codeLensProvider),
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
