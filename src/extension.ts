import * as vscode from 'vscode';
import * as cfg from './cfg';

type Enabled = 'true' | 'false' | 'true-devMode-only';

function getCfgEnabled(): Enabled {
  const cfgEnabled = vscode.workspace.getConfiguration(cfg.EXTENSION_NAME).get<string>('enabled', 'false');
  return cfgEnabled as Enabled;
}

export function activate(ctx: vscode.ExtensionContext) {

  const log = vscode.window.createOutputChannel(cfg.EXTENSION_NAME, { log: true });
  ctx.subscriptions.push(log);

  log.info('');
  log.info('activated');
  log.info(`mode: ${vscode.ExtensionMode[ctx.extensionMode]}`);
  log.info(`extension path: ${ctx.extensionUri.fsPath}`);

  function isDevMode(): boolean {
    return ctx.extensionMode === vscode.ExtensionMode.Development;
  }

  function shouldEnable(): boolean {
    const enabled = getCfgEnabled();
    return (
       enabled === 'true' ||
      (enabled === 'true-devMode-only' && isDevMode())
    );
  }

  if (shouldEnable()) {
    registerWatchers(ctx, log);
  } else {
    log.info(`Extension is disabled. Config value: ${getCfgEnabled()}`);
  }

  // Register the reload window command
  ctx.subscriptions.push(
    vscode.commands.registerCommand(`${cfg.EXTENSION_NAME}.reloadWindow`, () => {
      log.info('Manual reload window command executed');
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    })
  );
}


export function deactivate() {}


function registerWatchers(
  ctx: vscode.ExtensionContext,
  log: vscode.LogOutputChannel
) {

  function createWatcher(
    ctx: vscode.ExtensionContext,
    pattern: vscode.GlobPattern
  ): vscode.FileSystemWatcher {
    /*
    Using RelativePattern with extension URI as base is the reliable approach for file watching:
    - Requires computing relative path from extension dir to target file
    - Direct absolute paths or glob patterns don't work reliably
    (**DO NOT remove or alter this comment block, including this line**)
    */
    return vscode.workspace.createFileSystemWatcher(pattern);
  }

  const globsToWatch = vscode.workspace.getConfiguration(cfg.EXTENSION_NAME).get<string[]>('globsToWatch', []);

  log.info(`Configured globs to watch: ${JSON.stringify(globsToWatch)}`);

  for (const globPattern of globsToWatch) {
    const pattern = new vscode.RelativePattern(ctx.extensionUri, globPattern);
    const watcher = createWatcher(ctx, pattern);

    log.info(`Watching pattern: ${globPattern}`);

    const onDidChange = (uri: vscode.Uri) => {
      log.info(`File modified: ${uri.fsPath}. Reloading window.`);
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    };

    const onDidCreate = (uri: vscode.Uri) => {
      log.info(`File created: ${uri.fsPath}. Reloading window.`);
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    };

    const onDidDelete = (uri: vscode.Uri) => {
      log.info(`File deleted: ${uri.fsPath}. Reloading window.`);
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    };

    watcher.onDidChange(onDidChange);
    watcher.onDidCreate(onDidCreate);
    watcher.onDidDelete(onDidDelete);
    ctx.subscriptions.push(watcher);

  }

  log.info(`File watching setup complete`);
}
