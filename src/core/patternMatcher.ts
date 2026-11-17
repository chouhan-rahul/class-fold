import * as vscode from 'vscode';
import { ClassFoldConfig, FoldContentType, FoldRange } from '../types';
import { isImageSource, safeRegex } from '../utils/helpers';

interface InternalPatternDef {
  regex: RegExp;
  type: FoldContentType;
}

/**
 * Pattern Matcher Engine
 * Scans document text using optimized regular expressions to discover
 * class attributes, image sources, SVG path data, and custom patterns.
 */
export class PatternMatcher {
  private classPatterns: RegExp[] = [];
  private imagePatterns: RegExp[] = [];
  private svgPatterns: RegExp[] = [];
  private customPatterns: RegExp[] = [];

  constructor(private config: ClassFoldConfig) {
    this.recompilePatterns();
  }

  /**
   * Recompiles regex patterns when settings change
   */
  public updateConfig(newConfig: ClassFoldConfig): void {
    this.config = newConfig;
    this.recompilePatterns();
  }

  private recompilePatterns(): void {
    // 1. Class and className patterns (HTML, JSX, TSX, Vue, Svelte, Blade, Twig, etc.)
    this.classPatterns = [
      // Standard HTML / JSX attributes with double quotes (negative lookbehind avoids colliding with :class)
      /(?<![:@])\b(?:class|className)\s*=\s*"([^"]*)"/dg,
      // Standard HTML / JSX attributes with single quotes
      /(?<![:@])\b(?:class|className)\s*=\s*'([^']*)'/dg,
      // JSX template literals: className={`...`} or class={`...`}
      /(?<![:@])\b(?:class|className)\s*=\s*\{\s*`([^`]*)`\s*\}/dg,
      // Vue bound class: :class="..." or v-bind:class="..."
      /(?<=[\s<])(?::class|v-bind:class)\s*=\s*"([^"]*)"/dg,
      /(?<=[\s<])(?::class|v-bind:class)\s*=\s*'([^']*)'/dg,
      // Tailwind tw="..." attribute
      /\btw\s*=\s*"([^"]*)"/dg,
      /\btw\s*=\s*'([^']*)'/dg,
      // Utility helper functions: clsx(`...`), cn(`...`), twMerge(`...`), cva(`...`)
      /\b(?:clsx|cn|twMerge|cva)\(\s*`([^`]*)`\s*\)/dg,
      /\b(?:clsx|cn|twMerge|cva)\(\s*"([^"]*)"\s*\)/dg,
      /\b(?:clsx|cn|twMerge|cva)\(\s*'([^']*)'\s*\)/dg,
    ];

    // 2. Image sources & base64 URLs
    this.imagePatterns = [
      // Standard src="..." or src='...'
      /\bsrc\s*=\s*"([^"]*)"/dg,
      /\bsrc\s*=\s*'([^']*)'/dg,
      // srcset="..."
      /\bsrcset\s*=\s*"([^"]*)"/dg,
      /\bsrcset\s*=\s*'([^']*)'/dg,
      // Markdown image links: ![alt](url)
      /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/dg,
    ];

    // 3. SVG path & coordinate data
    this.svgPatterns = [
      /\bd\s*=\s*"([^"]*)"/dg,
      /\bd\s*=\s*'([^']*)'/dg,
      /\bpoints\s*=\s*"([^"]*)"/dg,
      /\bpoints\s*=\s*'([^']*)'/dg,
    ];

    // 4. Custom user-defined patterns
    this.customPatterns = [];
    if (this.config.foldCustomAttributes && Array.isArray(this.config.customPatterns)) {
      for (const rawPat of this.config.customPatterns) {
        if (!rawPat || typeof rawPat !== 'string') {
          continue;
        }
        // Ensure global and indices flags
        const compiled = safeRegex(rawPat, 'dg');
        if (compiled) {
          this.customPatterns.push(compiled);
        }
      }
    }
  }

  /**
   * Scans a VS Code TextDocument and returns all discoverable fold regions.
   */
  public findFolds(document: vscode.TextDocument): FoldRange[] {
    const text = document.getText();
    if (!text) {
      return [];
    }

    const folds: FoldRange[] = [];
    const activePatternList: InternalPatternDef[] = [];

    if (this.config.foldClasses) {
      for (const re of this.classPatterns) {
        activePatternList.push({ regex: re, type: 'class' });
      }
    }

    if (this.config.foldImages) {
      for (const re of this.imagePatterns) {
        activePatternList.push({ regex: re, type: 'image' });
      }
    }

    if (this.config.foldSvgPaths) {
      for (const re of this.svgPatterns) {
        activePatternList.push({ regex: re, type: 'svg' });
      }
    }

    if (this.config.foldCustomAttributes) {
      for (const re of this.customPatterns) {
        activePatternList.push({ regex: re, type: 'custom' });
      }
    }

    for (const { regex, type } of activePatternList) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        if (match.length < 2 || match[1] === undefined) {
          continue;
        }

        const rawContent = match[1];

        // Specific filtering for image types:
        if (type === 'image') {
          // If it's not base64 and not an image URL or long enough, check relevance
          const isBase64 = /^data:image\//i.test(rawContent);
          const isImg = isImageSource(rawContent);
          if (!isBase64 && !isImg && rawContent.length < this.config.minFoldLength) {
            continue;
          }
        } else {
          // Enforce minimum fold length for classes, SVGs, and custom patterns
          if (rawContent.length < this.config.minFoldLength) {
            continue;
          }
        }

        // Calculate exact start and end offsets
        let startOffset: number;
        let endOffset: number;

        // Use match.indices if available (ES2022 /d flag)
        const indices = (match as any).indices;
        if (indices && indices[1]) {
          startOffset = indices[1][0];
          endOffset = indices[1][1];
        } else {
          // Fallback: locate content inside the matched full string
          const fullMatchStr = match[0];
          const innerOffset = fullMatchStr.indexOf(rawContent);
          if (innerOffset === -1) {
            continue;
          }
          startOffset = match.index + innerOffset;
          endOffset = startOffset + rawContent.length;
        }

        const foldRange = new vscode.Range(
          document.positionAt(startOffset),
          document.positionAt(endOffset)
        );

        const fullRange = new vscode.Range(
          document.positionAt(match.index),
          document.positionAt(match.index + match[0].length)
        );

        const maskText = this.getMaskTextForType(type);

        folds.push({
          range: foldRange,
          fullRange,
          rawText: rawContent,
          type,
          line: foldRange.start.line,
          maskText,
        });
      }
    }

    // Sort ranges in document order
    folds.sort((a, b) => a.range.start.compareTo(b.range.start));

    // Deduplicate any overlapping fold ranges (e.g. nested regex hits)
    return this.deduplicateFolds(folds);
  }

  /**
   * Resolves the appropriate mask string based on user settings and content category
   */
  private getMaskTextForType(type: FoldContentType): string {
    if (!this.config.useTypeSpecificMasks) {
      return this.config.maskChar || '...';
    }

    switch (type) {
      case 'class':
        return this.config.maskCharClass || '...';
      case 'image':
        return this.config.maskCharImage || '[img]';
      case 'svg':
        return this.config.maskCharSvg || '[svg]';
      case 'custom':
        return this.config.maskCharCustom || '...';
      default:
        return this.config.maskChar || '...';
    }
  }

  /**
   * Eliminates overlapping ranges to prevent multiple conflicting decorations on the same character span
   */
  private deduplicateFolds(folds: FoldRange[]): FoldRange[] {
    if (folds.length <= 1) {
      return folds;
    }

    const result: FoldRange[] = [folds[0]];
    for (let i = 1; i < folds.length; i++) {
      const current = folds[i];
      const previous = result[result.length - 1];

      // Check if current overlaps with previous
      if (current.range.start.isBefore(previous.range.end)) {
        // Keep the one with the larger range
        const prevLen = previous.rawText.length;
        const currLen = current.rawText.length;
        if (currLen > prevLen) {
          result[result.length - 1] = current;
        }
      } else {
        result.push(current);
      }
    }

    return result;
  }
}
