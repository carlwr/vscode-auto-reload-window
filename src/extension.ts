import * as vscode from 'vscode';
import * as cfg from './cfg';

type Enabled = 'on' | 'off' | 'devModeOnly';

function getCfgEnabled(): Enabled {
  return vscode.workspace.getConfiguration(cfg.EXTENSION_NAME).get<Enabled>('enabled', 'off');
}


// DONT MODIFY THIS FUNCTION IN ANY WAY:
// (the handling of relative paths is critical; and this found working solution must remain intact, as well ass the comment block
function createWatcher(glob: string, ctx: vscode.ExtensionContext) {
  /*
  Using RelativePattern with extension URI as base is the reliable approach for file watching:
  - Requires computing relative path from extension dir to target file
  - Direct absolute paths or glob patterns don't work reliably
  (**DO NOT remove or alter this comment block, including this line**)
  */
  const relPat = new vscode.RelativePattern(ctx.extensionUri, glob);
  const watcher = vscode.workspace.createFileSystemWatcher(relPat);
  return watcher;
}
// DONT MODIFY THE ABOVE FUNCTION //


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

  // Store watchers in a mutable array to manage them
  let watchers: vscode.FileSystemWatcher[] = [];

  function disposeWatchers() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    watchers.forEach(watcher => watcher.dispose());
    watchers = [];
    log.info('Disposed all file watchers.');
  }

  function updateWatchers() {
    disposeWatchers(); // Clear existing watchers first

    const cfgEnabled = getCfgEnabled();
    const shouldBeEnabled = (
      cfgEnabled === 'on' ||
      (cfgEnabled === 'devModeOnly' && isDevMode())
    );

    if (shouldBeEnabled) {
      const globsToWatch = vscode.workspace.getConfiguration(cfg.EXTENSION_NAME).get<string[]>('globsToWatch', []);
      log.info(`Updating watchers. Configured globs: ${JSON.stringify(globsToWatch)}`);

      for (const globPattern of globsToWatch) {

        const watcher = createWatcher(globPattern, ctx);

        log.info(`Watching pattern: ${globPattern}` );

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
        ctx.subscriptions.push(watcher); // Add to context subscriptions for disposal on deactivation
        watchers.push(watcher); // Keep track for dynamic updates
      }
      log.info(`File watching setup complete. ${watchers.length} watchers active.`);
    } else {
      log.info(`Extension is disabled. Config value: ${cfgEnabled}. No watchers will be registered.`);
    }
  }

  // Initial setup of watchers
  updateWatchers();

  // Listen for configuration changes
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (
        event.affectsConfiguration(`${cfg.EXTENSION_NAME}.enabled`) ||
        event.affectsConfiguration(`${cfg.EXTENSION_NAME}.globsToWatch`)
      ) {
        log.info('Configuration changed. Re-evaluating watchers.');
        updateWatchers();
      }
    })
  );

}

export function deactivate() {}
