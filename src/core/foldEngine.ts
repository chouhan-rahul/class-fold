import * as vscode from 'vscode';
import { CacheManager } from './cacheManager';
import { DecorationTypeManager } from '../ui/decorationTypes';
import { PatternMatcher } from './patternMatcher';
import { StatusBarManager } from '../ui/statusBar';
import { ClassFoldConfig, FoldRange } from '../types';
import { debounce } from '../utils/helpers';

/**
 * Core Folding Engine
 * Coordinates document scanning, reactive cursor tracking, cache management,
 * and high-performance decoration rendering.
 */
export class FoldEngine implements vscode.Disposable {
  private isGloballyEnabled = true;
  private disposables: vscode.Disposable[] = [];

  private debouncedUpdateDocument: { (editor: vscode.TextEditor): void; cancel: () => void };
  private debouncedUpdateCursor: { (editor: vscode.TextEditor): void; cancel: () => void };

  constructor(
    private config: ClassFoldConfig,
    private patternMatcher: PatternMatcher,
    private cacheManager: CacheManager,
    private decorationManager: DecorationTypeManager,
    private statusBarManager: StatusBarManager
  ) {
    this.isGloballyEnabled = config.enabled;

    // Set up debounced handlers for optimal editing and cursor navigation performance
    this.debouncedUpdateDocument = debounce((editor: vscode.TextEditor) => {
      this.processDocument(editor, true);
    }, this.config.debounceDelay);

    this.debouncedUpdateCursor = debounce((editor: vscode.TextEditor) => {
      this.processDocument(editor, false);
    }, this.config.cursorDebounceDelay);

    this.registerEventListeners();
  }

  /**
   * Registers VS Code workspace and window event listeners
   */
  private registerEventListeners(): void {
    // When switching active editor
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.processDocument(editor, false);
        }
      })
    );

    // When typing or modifying text in document
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document) {
          // Document content changed: invalidate cache and re-scan
          this.cacheManager.invalidate(event.document.uri);
          this.debouncedUpdateDocument(editor);
        }
      })
    );

    // When moving cursor or altering selection
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor === vscode.window.activeTextEditor) {
          this.debouncedUpdateCursor(event.textEditor);
        }
      })
    );

    // When closing a document: clean up cache to eliminate memory leaks
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((document) => {
        this.cacheManager.purgeDocument(document.uri);
      })
    );
  }

  /**
   * Updates settings across all engine sub-components
   */
  public updateConfig(newConfig: ClassFoldConfig): void {
    this.config = newConfig;
    this.isGloballyEnabled = newConfig.enabled;

    this.patternMatcher.updateConfig(newConfig);
    this.decorationManager.updateConfig(newConfig);
    this.statusBarManager.updateConfig(newConfig);
    this.cacheManager.clearAll();

    // Recreate debouncers with new delays
    this.debouncedUpdateDocument.cancel();
    this.debouncedUpdateCursor.cancel();

    this.debouncedUpdateDocument = debounce((editor: vscode.TextEditor) => {
      this.processDocument(editor, true);
    }, this.config.debounceDelay);

    this.debouncedUpdateCursor = debounce((editor: vscode.TextEditor) => {
      this.processDocument(editor, false);
    }, this.config.cursorDebounceDelay);

    // Re-apply on current editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      this.processDocument(activeEditor, true);
    }
  }

  /**
   * Determines whether the given language ID is registered for folding
   */
  public isLanguageSupported(languageId: string): boolean {
    if (!this.config.activeLanguages || this.config.activeLanguages.length === 0) {
      return true;
    }
    return this.config.activeLanguages.includes(languageId);
  }

  /**
   * Main pipeline: resolves folds, filters by cursor visibility, and paints decorations
   */
  public processDocument(editor: vscode.TextEditor, forceRescan: boolean): void {
    if (!editor || !editor.document) {
      return;
    }

    const doc = editor.document;

    // Check language support
    if (!this.isLanguageSupported(doc.languageId)) {
      this.clearAllDecorations(editor);
      this.statusBarManager.update(0, this.isGloballyEnabled);
      return;
    }

    // If globally disabled, clear decorations and update status bar
    if (!this.isGloballyEnabled) {
      this.clearAllDecorations(editor);
      this.statusBarManager.update(0, false);
      return;
    }

    // Retrieve cached folds or rescan document
    let folds: FoldRange[] | undefined = forceRescan ? undefined : this.cacheManager.getFolds(doc);
    if (!folds) {
      folds = this.patternMatcher.findFolds(doc);
      this.cacheManager.setFolds(doc, folds);
    }

    const selections = editor.selections;
    const uri = doc.uri;

    // Filter which ranges remain folded vs unfolded based on configuration
    const activeFoldRangesByDeco = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
    let foldedCount = 0;

    for (const fold of folds) {
      // 1. Per-line manual toggle override
      if (this.cacheManager.isLineOverridden(uri, fold.line)) {
        continue;
      }

      // 2. Auto-unfolding rule evaluation
      let shouldUnfold = false;

      switch (this.config.unfoldOn) {
        case 'cursor':
          shouldUnfold = selections.some((sel) => {
            // Unfold if cursor is within the fold range (or touching edge)
            return !sel.start.isAfter(fold.range.end) && !sel.end.isBefore(fold.range.start);
          });
          break;

        case 'line':
          shouldUnfold = selections.some((sel) => {
            // Unfold if any cursor is on the fold's line
            return sel.active.line === fold.line;
          });
          break;

        case 'selection':
          shouldUnfold = selections.some((sel) => {
            // Unfold only if text inside the fold is highlighted
            return !sel.isEmpty && !sel.start.isAfter(fold.range.end) && !sel.end.isBefore(fold.range.start);
          });
          break;

        case 'never':
          shouldUnfold = false;
          break;
      }

      if (!shouldUnfold) {
        const decoType = this.decorationManager.getDecorationType(fold.type, fold.maskText);
        let list = activeFoldRangesByDeco.get(decoType);
        if (!list) {
          list = [];
          activeFoldRangesByDeco.set(decoType, list);
        }
        list.push(fold.range);
        foldedCount++;
      }
    }

    // Apply active decorations
    for (const [decoType, ranges] of activeFoldRangesByDeco.entries()) {
      editor.setDecorations(decoType, ranges);
    }

    // Clear any decoration types that have zero ranges in this pass
    for (const decoType of this.decorationManager.getAllDecorations()) {
      if (!activeFoldRangesByDeco.has(decoType)) {
        editor.setDecorations(decoType, []);
      }
    }

    // Update status bar with active fold count
    this.statusBarManager.update(foldedCount, true);
  }

  /**
   * Clears all decorations from the editor
   */
  private clearAllDecorations(editor: vscode.TextEditor): void {
    for (const decoType of this.decorationManager.getAllDecorations()) {
      editor.setDecorations(decoType, []);
    }
  }

  /**
   * Global toggle command (Alt+Z)
   */
  public toggleGlobal(): void {
    this.isGloballyEnabled = !this.isGloballyEnabled;
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this.processDocument(editor, false);
    } else {
      this.statusBarManager.update(0, this.isGloballyEnabled);
    }

    const stateStr = this.isGloballyEnabled ? 'enabled ⚡' : 'disabled 💤';
    vscode.window.setStatusBarMessage(`Class Fold is now ${stateStr}`, 2500);
  }

  /**
   * Line toggle command (Alt+L)
   */
  public toggleLine(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const currentLine = editor.selection.active.line;
    const isUnfoldedNow = this.cacheManager.toggleLineOverride(editor.document.uri, currentLine);
    this.processDocument(editor, false);

    const msg = isUnfoldedNow ? `Line ${currentLine + 1} unfolded` : `Line ${currentLine + 1} folded`;
    vscode.window.setStatusBarMessage(`[Class Fold] ${msg}`, 2000);
  }

  /**
   * Unfolds all items in the active editor
   */
  public unfoldAll(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const folds = this.cacheManager.getFolds(editor.document);
    if (!folds || folds.length === 0) {
      return;
    }

    for (const fold of folds) {
      if (!this.cacheManager.isLineOverridden(editor.document.uri, fold.line)) {
        this.cacheManager.toggleLineOverride(editor.document.uri, fold.line);
      }
    }

    this.processDocument(editor, false);
    vscode.window.setStatusBarMessage('Class Fold: All elements unfolded in active file', 2500);
  }

  /**
   * Re-folds all items in the active editor
   */
  public foldAll(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    this.cacheManager.clearLineOverrides(editor.document.uri);
    this.processDocument(editor, false);
    vscode.window.setStatusBarMessage('Class Fold: All elements folded in active file', 2500);
  }

  /**
   * Copies the folded content under cursor to system clipboard
   */
  public async copyUnderCursor(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const pos = editor.selection.active;
    const folds = this.cacheManager.getFolds(editor.document);
    if (!folds || folds.length === 0) {
      vscode.window.showInformationMessage('No folded attribute found at cursor.');
      return;
    }

    const target = folds.find((f) => f.range.contains(pos) || f.line === pos.line);
    if (!target) {
      vscode.window.showInformationMessage('No folded attribute found at cursor.');
      return;
    }

    await vscode.env.clipboard.writeText(target.rawText);
    vscode.window.showInformationMessage(`📋 Copied ${target.type} content (${target.rawText.length} chars) to clipboard!`);
  }

  /**
   * Disposes all subscriptions and decoration types
   */
  public dispose(): void {
    this.debouncedUpdateDocument.cancel();
    this.debouncedUpdateCursor.cancel();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.decorationManager.dispose();
    this.statusBarManager.dispose();
  }
}
