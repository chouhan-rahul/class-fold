import * as vscode from 'vscode';
import { BadgeStyle, ClassFoldConfig, UnfoldTrigger } from '../types';

/**
 * Default fallback configuration
 */
export const DEFAULT_CONFIG: ClassFoldConfig = {
  enabled: true,
  maskChar: '...',
  useTypeSpecificMasks: true,
  maskCharClass: '...',
  maskCharImage: '[img]',
  maskCharSvg: '[svg]',
  maskCharCustom: '...',
  badgeStyle: 'minimal',
  maskColor: '',
  badgeBackgroundColor: '',
  opacity: 0.65,
  unfoldOn: 'cursor',
  minFoldLength: 20,
  foldClasses: true,
  foldImages: true,
  foldSvgPaths: true,
  foldCustomAttributes: true,
  customPatterns: [],
  showHoverPreview: true,
  hoverImagePreview: true,
  showStatusBar: true,
  debounceDelay: 60,
  cursorDebounceDelay: 25,
  activeLanguages: [
    'html',
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
    'vue',
    'svelte',
    'astro',
    'php',
    'blade',
    'twig',
    'erb',
    'markdown',
    'mdx',
    'xml',
    'svg',
    'razor',
    'handlebars',
  ],
};

/**
 * Loads and validates current user/workspace configuration for Class Fold
 */
export function loadConfig(): ClassFoldConfig {
  const cfg = vscode.workspace.getConfiguration('classFold');

  const unfoldOnRaw = cfg.get<string>('unfoldOn', DEFAULT_CONFIG.unfoldOn);
  const unfoldOn: UnfoldTrigger = ['cursor', 'line', 'selection', 'never'].includes(unfoldOnRaw)
    ? (unfoldOnRaw as UnfoldTrigger)
    : 'cursor';

  const badgeStyleRaw = cfg.get<string>('badgeStyle', DEFAULT_CONFIG.badgeStyle);
  const badgeStyle: BadgeStyle = ['minimal', 'pill', 'bordered'].includes(badgeStyleRaw)
    ? (badgeStyleRaw as BadgeStyle)
    : 'minimal';

  return {
    enabled: cfg.get<boolean>('enabled', DEFAULT_CONFIG.enabled),
    maskChar: cfg.get<string>('maskChar', DEFAULT_CONFIG.maskChar) || '...',
    useTypeSpecificMasks: cfg.get<boolean>('useTypeSpecificMasks', DEFAULT_CONFIG.useTypeSpecificMasks),
    maskCharClass: cfg.get<string>('maskCharClass', DEFAULT_CONFIG.maskCharClass) || '...',
    maskCharImage: cfg.get<string>('maskCharImage', DEFAULT_CONFIG.maskCharImage) || '[img]',
    maskCharSvg: cfg.get<string>('maskCharSvg', DEFAULT_CONFIG.maskCharSvg) || '[svg]',
    maskCharCustom: cfg.get<string>('maskCharCustom', DEFAULT_CONFIG.maskCharCustom) || '...',
    badgeStyle,
    maskColor: cfg.get<string>('maskColor', DEFAULT_CONFIG.maskColor),
    badgeBackgroundColor: cfg.get<string>('badgeBackgroundColor', DEFAULT_CONFIG.badgeBackgroundColor),
    opacity: Math.max(0.1, Math.min(1.0, cfg.get<number>('opacity', DEFAULT_CONFIG.opacity))),
    unfoldOn,
    minFoldLength: Math.max(1, cfg.get<number>('minFoldLength', DEFAULT_CONFIG.minFoldLength)),
    foldClasses: cfg.get<boolean>('foldClasses', DEFAULT_CONFIG.foldClasses),
    foldImages: cfg.get<boolean>('foldImages', DEFAULT_CONFIG.foldImages),
    foldSvgPaths: cfg.get<boolean>('foldSvgPaths', DEFAULT_CONFIG.foldSvgPaths),
    foldCustomAttributes: cfg.get<boolean>('foldCustomAttributes', DEFAULT_CONFIG.foldCustomAttributes),
    customPatterns: cfg.get<string[]>('customPatterns', DEFAULT_CONFIG.customPatterns),
    showHoverPreview: cfg.get<boolean>('showHoverPreview', DEFAULT_CONFIG.showHoverPreview),
    hoverImagePreview: cfg.get<boolean>('hoverImagePreview', DEFAULT_CONFIG.hoverImagePreview),
    showStatusBar: cfg.get<boolean>('showStatusBar', DEFAULT_CONFIG.showStatusBar),
    debounceDelay: Math.max(0, cfg.get<number>('debounceDelay', DEFAULT_CONFIG.debounceDelay)),
    cursorDebounceDelay: Math.max(0, cfg.get<number>('cursorDebounceDelay', DEFAULT_CONFIG.cursorDebounceDelay)),
    activeLanguages: cfg.get<string[]>('activeLanguages', DEFAULT_CONFIG.activeLanguages),
  };
}
