import * as vscode from "vscode";
import { MermaidBlockInfo } from "./types/message";
import { MermaidLensWebview } from "./MermaidLensWebview";

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
  private regex: RegExp = /```mermaid\s*([\s\S]*?)```/g;

  provideCodeLenses(document: vscode.TextDocument): vscode.ProviderResult<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    let match;
    let sequence = 0;
    const webview = MermaidLensWebview.getInstance();

    while ((match = this.regex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      const blockInfo: MermaidBlockInfo = {
        sequence: sequence++,
        content: match[1],
        startLine: startPos.line,
        endLine: endPos.line,
        startCharacter: startPos.character,
        endCharacter: endPos.character,
        documentUri: document.uri,
      };

      webview.processBlock(blockInfo);

      const codeLens = new vscode.CodeLens(range, {
        title: "View Graph",
        command: "mermaidlens.openGraphViewer",
        arguments: [blockInfo],
      });

      codeLenses.push(codeLens);
    }

    return codeLenses;
  }
}
