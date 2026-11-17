import * as vscode from 'vscode';
import { FoldEngine } from '../core/foldEngine';

/**
 * Command Manager
 * Handles registration and dispatching of all user-facing commands and keyboard shortcuts.
 */
export function registerCommands(context: vscode.ExtensionContext, engine: FoldEngine): void {
  // 1. Toggle global folding state
  context.subscriptions.push(
    vscode.commands.registerCommand('classFold.toggle', () => {
      engine.toggleGlobal();
    })
  );

  // 2. Toggle fold on current active line
  context.subscriptions.push(
    vscode.commands.registerCommand('classFold.toggleLine', () => {
      engine.toggleLine();
    })
  );

  // 3. Unfold all elements in active file
  context.subscriptions.push(
    vscode.commands.registerCommand('classFold.unfoldAll', () => {
      engine.unfoldAll();
    })
  );

  // 4. Re-fold all elements in active file
  context.subscriptions.push(
    vscode.commands.registerCommand('classFold.foldAll', () => {
      engine.foldAll();
    })
  );

  // 5. Copy folded content under cursor to clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand('classFold.copyContent', async () => {
      await engine.copyUnderCursor();
    })
  );
}
