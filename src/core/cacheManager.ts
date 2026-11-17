import * as vscode from 'vscode';
import { FoldRange } from '../types';

interface DocumentCacheEntry {
  version: number;
  folds: FoldRange[];
}

/**
 * Cache Manager
 * Maintains in-memory indexes of scanned fold regions and active per-line toggle overrides.
 * Guarantees zero re-parsing on pure cursor navigation and prevents memory leaks upon document closure.
 */
export class CacheManager {
  private documentFolds = new Map<string, DocumentCacheEntry>();
  private lineOverrides = new Map<string, Set<number>>();

  /**
   * Retrieves cached folds for a document if the version matches
   */
  public getFolds(document: vscode.TextDocument): FoldRange[] | undefined {
    const key = document.uri.toString();
    const entry = this.documentFolds.get(key);
    if (entry && entry.version === document.version) {
      return entry.folds;
    }
    return undefined;
  }

  /**
   * Stores freshly scanned folds for a document version
   */
  public setFolds(document: vscode.TextDocument, folds: FoldRange[]): void {
    const key = document.uri.toString();
    this.documentFolds.set(key, {
      version: document.version,
      folds,
    });
  }

  /**
   * Toggles the fold state of a specific line in a document.
   * Returns true if the line is now explicitly unfolded, false if folded back.
   */
  public toggleLineOverride(uri: vscode.Uri, line: number): boolean {
    const key = uri.toString();
    let set = this.lineOverrides.get(key);
    if (!set) {
      set = new Set<number>();
      this.lineOverrides.set(key, set);
    }

    if (set.has(line)) {
      set.delete(line);
      return false; // Reverted back to normal fold state
    } else {
      set.add(line);
      return true; // Overridden to unfolded
    }
  }

  /**
   * Checks whether a given line is currently toggled open by the user
   */
  public isLineOverridden(uri: vscode.Uri, line: number): boolean {
    const key = uri.toString();
    const set = this.lineOverrides.get(key);
    return set ? set.has(line) : false;
  }

  /**
   * Clears all per-line overrides for a given document
   */
  public clearLineOverrides(uri: vscode.Uri): void {
    this.lineOverrides.delete(uri.toString());
  }

  /**
   * Invalidates cached fold entries for a document
   */
  public invalidate(uri: vscode.Uri): void {
    const key = uri.toString();
    this.documentFolds.delete(key);
  }

  /**
   * Completely purges all data associated with a document (called when a document is closed)
   */
  public purgeDocument(uri: vscode.Uri): void {
    const key = uri.toString();
    this.documentFolds.delete(key);
    this.lineOverrides.delete(key);
  }

  /**
   * Clears all caches across all documents (e.g. on configuration reload)
   */
  public clearAll(): void {
    this.documentFolds.clear();
    this.lineOverrides.clear();
  }
}
