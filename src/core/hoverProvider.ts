import * as vscode from 'vscode';
import { CacheManager } from './cacheManager';
import { ClassFoldConfig, FoldRange } from '../types';
import { parseClassTokens, truncate } from '../utils/helpers';

/**
 * Rich Hover Provider
 * Generates interactive markdown hover cards when inspecting folded items,
 * complete with rendered image previews, class token breakdowns, and copy actions.
 */
export class ClassFoldHoverProvider implements vscode.HoverProvider {
  constructor(
    private config: ClassFoldConfig,
    private cacheManager: CacheManager
  ) {}

  public updateConfig(newConfig: ClassFoldConfig): void {
    this.config = newConfig;
  }

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Hover> {
    if (!this.config.showHoverPreview || !this.config.enabled) {
      return undefined;
    }

    const folds = this.cacheManager.getFolds(document);
    if (!folds || folds.length === 0) {
      return undefined;
    }

    // Find the fold region that contains the hovered position
    const targetFold = folds.find((f) => f.range.contains(position));
    if (!targetFold) {
      return undefined;
    }

    const md = this.buildHoverMarkdown(targetFold);
    return new vscode.Hover(md, targetFold.range);
  }

  private buildHoverMarkdown(fold: FoldRange): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    switch (fold.type) {
      case 'image':
        this.buildImageHover(md, fold);
        break;
      case 'svg':
        this.buildSvgHover(md, fold);
        break;
      case 'class':
        this.buildClassHover(md, fold);
        break;
      default:
        this.buildCustomHover(md, fold);
        break;
    }

    return md;
  }

  private buildClassHover(md: vscode.MarkdownString, fold: FoldRange): void {
    const tokens = parseClassTokens(fold.rawText);
    const charCount = fold.rawText.length;
    const classCount = tokens.length;

    md.appendMarkdown(`### ⚡ Class Fold \`(${classCount} classes • ${charCount} chars)\`\n\n`);

    // Render classes in a readable code block
    if (tokens.length <= 15) {
      md.appendCodeblock(tokens.join(' '), 'css');
    } else {
      // Chunk classes for pleasant reading
      const previewList = tokens.slice(0, 20).join(' ');
      md.appendCodeblock(`${previewList} … (+${tokens.length - 20} more)`, 'css');
    }

    md.appendMarkdown('\n---\n');
    md.appendMarkdown(
      `[📋 Copy Classes](command:classFold.copyContent) &nbsp;|&nbsp; [⚙️ Toggle Fold](command:classFold.toggleLine)`
    );
  }

  private buildImageHover(md: vscode.MarkdownString, fold: FoldRange): void {
    const raw = fold.rawText.trim();
    const isBase64 = /^data:image\/([a-zA-Z0-9+.-]+);base64,/i.exec(raw);

    if (isBase64) {
      const mime = isBase64[1].toUpperCase();
      const approxBytes = Math.round((raw.length * 3) / 4);
      const kbStr = (approxBytes / 1024).toFixed(1);

      md.appendMarkdown(`### 🖼️ Base64 Image Preview \`(${mime} • ~${kbStr} KB)\`\n\n`);

      if (this.config.hoverImagePreview) {
        // VS Code renders markdown images for data URIs seamlessly
        md.appendMarkdown(`![Embedded Image Preview](${raw})\n\n`);
      }

      md.appendMarkdown(`**Source**: Base64 Data URL (${raw.length.toLocaleString()} characters)\n\n`);
    } else {
      md.appendMarkdown(`### 🖼️ Image Source Preview\n\n`);

      if (this.config.hoverImagePreview && (raw.startsWith('http') || raw.startsWith('data:'))) {
        md.appendMarkdown(`![External Image Preview](${raw})\n\n`);
      }

      md.appendMarkdown(`**URL**: \`${truncate(raw, 70)}\`\n\n`);
    }

    md.appendMarkdown('---\n');
    md.appendMarkdown(
      `[📋 Copy Image Source](command:classFold.copyContent) &nbsp;|&nbsp; [⚙️ Toggle Fold](command:classFold.toggleLine)`
    );
  }

  private buildSvgHover(md: vscode.MarkdownString, fold: FoldRange): void {
    const charCount = fold.rawText.length;

    md.appendMarkdown(`### 📐 SVG Path Data \`(${charCount} characters)\`\n\n`);
    md.appendCodeblock(truncate(fold.rawText, 180), 'xml');

    md.appendMarkdown('\n---\n');
    md.appendMarkdown(
      `[📋 Copy Path Data](command:classFold.copyContent) &nbsp;|&nbsp; [⚙️ Toggle Fold](command:classFold.toggleLine)`
    );
  }

  private buildCustomHover(md: vscode.MarkdownString, fold: FoldRange): void {
    md.appendMarkdown(`### 🔍 Folded Content \`(${fold.rawText.length} characters)\`\n\n`);
    md.appendCodeblock(truncate(fold.rawText, 180), 'text');

    md.appendMarkdown('\n---\n');
    md.appendMarkdown(
      `[📋 Copy Content](command:classFold.copyContent) &nbsp;|&nbsp; [⚙️ Toggle Fold](command:classFold.toggleLine)`
    );
  }
}
