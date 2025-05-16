import * as vscode from 'vscode';
import * as cfg from './cfg';

const envVarEnabled = 'VSC_ARW_ENABLED';

const getCfg = vscode.workspace.getConfiguration(cfg.EXTENSION_NAME)

function cfgEnabled(): boolean {return getCfg.get<boolean >('enabled',false);}
function cfgGlobs()  : string[]{return getCfg.get<string[]>('globs'  , [])  ;}

function cfgChanged(event: vscode.ConfigurationChangeEvent): boolean {
  return (
    event.affectsConfiguration(`${cfg.EXTENSION_NAME}.enabled`) ||
    event.affectsConfiguration(`${cfg.EXTENSION_NAME}.globs`)
  );
}

function getEnvVarEnabled(ctx: vscode.ExtensionContext): boolean {
  // returns true if VSC_ARW_ENABLED is set to 'on', false in all other cases

  for (const [variable, mutator] of ctx.environmentVariableCollection) {
    if (variable === envVarEnabled) {
      return mutator.value === 'on';
    }
  }
  return false;
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


function shouldEnable(
  ctx: vscode.ExtensionContext,
  log: vscode.LogOutputChannel
): boolean {
  // this function does not work currently: `ctx.environmentVariableCollection` is empty, so apparently cannot be used to check for env. vars which we need. log.info-s were added to help debug, as well as comments on what they output. This is temporary and should be removed when implementing proper checking for the env. var.

  log.info('shouldEnable() called');
    // -> this does print

  // use ctx.environmentVariableCollection.forEach to print all env vars:
  ctx.environmentVariableCollection.forEach(([variable, mutator]) => {
    log.info(`  env.var : ${variable}='${mutator}'`);
  });
    // -> prints nothing
    // so environmentVariableCollection is empty (?)

  for (const [variable, mutator] of ctx.environmentVariableCollection) {
    log.info(`  env.var: ${variable}='${mutator.value}'`);
    if (variable === envVarEnabled) {
      log.info(`${variable} is set to '${mutator.value}'.`);
    }
  }

  if (getEnvVarEnabled(ctx)) {
    log.info(`${envVarEnabled} is set to 'on'.`);
    return true;
  }

  if (cfgEnabled()) {
    log.info(`setting "enabled" is set to 'on'.`);
    return true;
  }

  return false;
}

export function activate(ctx: vscode.ExtensionContext): void {

  const log = vscode.window.createOutputChannel(cfg.EXTENSION_NAME, { log: true });
  ctx.subscriptions.push(log);

  log.info('');
  log.info('activated');
  log.info(`extension path: ${ctx.extensionUri.fsPath}`);

  // Store watchers in a mutable array to manage them
  let watchers: vscode.FileSystemWatcher[] = [];

  function disposeWatchers() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    watchers.forEach(watcher => watcher.dispose());
    watchers = [];
  }

  function updateWatchers() {
    disposeWatchers(); // Clear existing watchers first
    log.info('disposed all file watchers.');

    const doEnable = shouldEnable(ctx, log)
    log.info(`enable watchers?: ${doEnable}`);

    if (doEnable) {
      const globs = cfgGlobs();
      log.info(`configured globs: ${JSON.stringify(globs)}`);

      for (const glob of globs) {
        log.info(`watching glob: ${glob}` );

        const onDidChange = (uri: vscode.Uri) => {
          log.info(`modified: ${uri.fsPath}. Reloading window.`);
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        };

        const onDidCreate = (uri: vscode.Uri) => {
          log.info(`created: ${uri.fsPath}. Reloading window.`);
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        };

        const onDidDelete = (uri: vscode.Uri) => {
          log.info(`deleted: ${uri.fsPath}. Reloading window.`);
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        };

        const watcher = createWatcher(glob, ctx);

        watcher.onDidChange(onDidChange);
        watcher.onDidCreate(onDidCreate);
        watcher.onDidDelete(onDidDelete);

        ctx.subscriptions.push(watcher);
          // Add to context subscriptions for disposal on deactivation

        watchers.push(watcher);
          // Keep track for dynamic updates

        }
      log.info(`updated watchers (active: ${watchers.length})`);
    }
  }

  // Initial setup of watchers
  updateWatchers();

  // Listen for configuration changes
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (cfgChanged(event)) {
        log.info('Configuration changed. Re-evaluating watchers.');
        updateWatchers();
      }
    })
  );

}

export function deactivate() {}
