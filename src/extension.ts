import * as vscode from 'vscode';
import { loadConfig } from './config/settings';
import { PatternMatcher } from './core/patternMatcher';
import { CacheManager } from './core/cacheManager';
import { DecorationTypeManager } from './ui/decorationTypes';
import { StatusBarManager } from './ui/statusBar';
import { FoldEngine } from './core/foldEngine';
import { ClassFoldHoverProvider } from './core/hoverProvider';
import { registerCommands } from './commands/commandManager';

let engine: FoldEngine | undefined;

/**
 * Activates the Class Fold extension
 */
export function activate(context: vscode.ExtensionContext): void {
  const config = loadConfig();

  // Instantiate core subsystems
  const patternMatcher = new PatternMatcher(config);
  const cacheManager = new CacheManager();
  const decorationManager = new DecorationTypeManager(config);
  const statusBarManager = new StatusBarManager(config);

  // Initialize master folding engine
  engine = new FoldEngine(
    config,
    patternMatcher,
    cacheManager,
    decorationManager,
    statusBarManager
  );
  context.subscriptions.push(engine);

  // Register commands & keybindings
  registerCommands(context, engine);

  // Register rich hover provider for supported languages
  const hoverProvider = new ClassFoldHoverProvider(config, cacheManager);
  const documentSelectors: vscode.DocumentSelector = config.activeLanguages.map((lang) => ({
    language: lang,
    scheme: 'file',
  }));

  // Also match untitled documents
  for (const lang of config.activeLanguages) {
    (documentSelectors as any).push({ language: lang, scheme: 'untitled' });
  }

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(documentSelectors, hoverProvider)
  );

  // React to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('classFold')) {
        const updatedConfig = loadConfig();
        patternMatcher.updateConfig(updatedConfig);
        decorationManager.updateConfig(updatedConfig);
        statusBarManager.updateConfig(updatedConfig);
        hoverProvider.updateConfig(updatedConfig);
        engine?.updateConfig(updatedConfig);
      }
    })
  );

  // Run initial fold check on the currently active text editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    engine.processDocument(activeEditor, true);
  }

  console.log('⚡ [Class Fold] Activated successfully with zero runtime overhead.');
}

/**
 * Deactivates the Class Fold extension
 */
export function deactivate(): void {
  if (engine) {
    engine.dispose();
    engine = undefined;
  }
}
