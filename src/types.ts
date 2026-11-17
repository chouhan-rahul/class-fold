import * as vscode from 'vscode';

/**
 * Category of folded content
 */
export type FoldContentType = 'class' | 'image' | 'svg' | 'custom';

/**
 * Represents a single folded region inside a document
 */
export interface FoldRange {
  /**
   * The exact range of the attribute value to conceal/fold
   */
  readonly range: vscode.Range;

  /**
   * The full range including attribute name and quotes (e.g., class="...")
   */
  readonly fullRange: vscode.Range;

  /**
   * The raw string content inside the attribute
   */
  readonly rawText: string;

  /**
   * The category/type of this folded content
   */
  readonly type: FoldContentType;

  /**
   * Zero-based line number where the fold starts
   */
  readonly line: number;

  /**
   * The mask text or badge to display for this fold
   */
  readonly maskText: string;
}

/**
 * Trigger condition for auto-unfolding content
 */
export type UnfoldTrigger = 'cursor' | 'line' | 'selection' | 'never';

/**
 * Badge visual style
 */
export type BadgeStyle = 'minimal' | 'pill' | 'bordered';

/**
 * Strongly typed configuration for Class Fold
 */
export interface ClassFoldConfig {
  enabled: boolean;
  maskChar: string;
  useTypeSpecificMasks: boolean;
  maskCharClass: string;
  maskCharImage: string;
  maskCharSvg: string;
  maskCharCustom: string;
  badgeStyle: BadgeStyle;
  maskColor: string;
  badgeBackgroundColor: string;
  opacity: number;
  unfoldOn: UnfoldTrigger;
  minFoldLength: number;
  foldClasses: boolean;
  foldImages: boolean;
  foldSvgPaths: boolean;
  foldCustomAttributes: boolean;
  customPatterns: string[];
  showHoverPreview: boolean;
  hoverImagePreview: boolean;
  showStatusBar: boolean;
  debounceDelay: number;
  cursorDebounceDelay: number;
  activeLanguages: string[];
}
