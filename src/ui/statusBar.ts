import * as vscode from 'vscode';
import { ClassFoldConfig } from '../types';

/**
 * Status Bar Item Controller
 * Shows real-time fold count and global extension toggle state in the VS Code status bar.
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private config: ClassFoldConfig) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'classFold.toggle';
    this.update(0, true);
  }

  /**
   * Updates configuration and visibility
   */
  public updateConfig(newConfig: ClassFoldConfig): void {
    this.config = newConfig;
    if (!this.config.showStatusBar) {
      this.statusBarItem.hide();
    } else {
      this.statusBarItem.show();
    }
  }

  /**
   * Updates the status bar text and icon
   * @param foldCount Total number of folds currently active in the visible editor
   * @param isGloballyEnabled Whether Class Fold is enabled
   */
  public update(foldCount: number, isGloballyEnabled: boolean): void {
    if (!this.config.showStatusBar) {
      this.statusBarItem.hide();
      return;
    }

    if (!isGloballyEnabled) {
      this.statusBarItem.text = '$(unfold) Class Fold: Off';
      this.statusBarItem.tooltip = 'Class Fold is disabled. Click to enable (Alt+Z)';
    } else {
      this.statusBarItem.text = `$(fold) Class Fold: ${foldCount}`;
      this.statusBarItem.tooltip = `Class Fold active (${foldCount} folded). Click to toggle (Alt+Z)`;
    }

    this.statusBarItem.show();
  }

  /**
   * Disposes status bar item
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
