import * as vscode from 'vscode';
import { ClassFoldConfig, FoldContentType } from '../types';

/**
 * Decoration Type Manager
 * Constructs and manages VS Code text editor decoration styles for folded badges.
 * Efficiently reuses decoration types and handles theme-adaptive styling.
 */
export class DecorationTypeManager {
  private decorationMap = new Map<string, vscode.TextEditorDecorationType>();

  constructor(private config: ClassFoldConfig) {}

  /**
   * Updates configuration and rebuilds decoration types
   */
  public updateConfig(newConfig: ClassFoldConfig): void {
    this.dispose();
    this.config = newConfig;
  }

  /**
   * Retrieves or creates the appropriate decoration type for a fold type and mask string
   */
  public getDecorationType(type: FoldContentType, maskText: string): vscode.TextEditorDecorationType {
    const key = `${type}:${maskText}:${this.config.badgeStyle}:${this.config.opacity}:${this.config.maskColor}:${this.config.badgeBackgroundColor}`;

    let decoration = this.decorationMap.get(key);
    if (!decoration) {
      decoration = this.createDecorationType(maskText);
      this.decorationMap.set(key, decoration);
    }

    return decoration;
  }

  /**
   * Builds a new TextEditorDecorationType with CSS styling based on configuration
   */
  private createDecorationType(maskText: string): vscode.TextEditorDecorationType {
    const { badgeStyle, maskColor, badgeBackgroundColor, opacity } = this.config;

    // Theme adaptive fallback color: theme-aware muted text
    const textColor = maskColor || new vscode.ThemeColor('descriptionForeground');

    // Badge styling rules
    let beforeBg: string | vscode.ThemeColor | undefined;
    let beforeBorder: string | undefined;

    if (badgeStyle === 'pill') {
      beforeBg = badgeBackgroundColor || new vscode.ThemeColor('badge.background');
    } else if (badgeStyle === 'bordered') {
      beforeBorder = `1px solid ${maskColor || 'rgba(150, 150, 150, 0.4)'}`;
    }

    return vscode.window.createTextEditorDecorationType({
      before: {
        contentText: maskText,
        color: textColor,
        backgroundColor: beforeBg,
        border: beforeBorder,
        margin: '0 2px',
        fontWeight: 'normal',
      },
      textDecoration: 'none; display: none;',
      opacity: `${opacity}`,
    });
  }

  /**
   * Returns all active decoration types currently maintained
   */
  public getAllDecorations(): vscode.TextEditorDecorationType[] {
    return Array.from(this.decorationMap.values());
  }

  /**
   * Disposes of all allocated decoration types to prevent memory leaks
   */
  public dispose(): void {
    for (const decoration of this.decorationMap.values()) {
      decoration.dispose();
    }
    this.decorationMap.clear();
  }
}
