import * as fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import * as cfg from './cfg';

const envVarEnabled = 'VSC_ARW_ENABLED';
const envVarGlobs   = 'VSC_ARW_GLOBS';

function getCfg() {
  return vscode.workspace.getConfiguration(cfg.EXTENSION_NAME);
}

function cfgEnabled() { return getCfg().get<string  >('enabled','fromEnvVar');}
function cfgGlobs()   { return getCfg().get<string[]>('globs'  , [])         ;}

function cfgChanged(event: vscode.ConfigurationChangeEvent): boolean {
  return (
    event.affectsConfiguration(`${cfg.EXTENSION_NAME}.enabled`) ||
    event.affectsConfiguration(`${cfg.EXTENSION_NAME}.globs`)
  );
}

function getEnvVarEnabled(): boolean {
  // returns true if the env var is set to 'on', false in all other cases
  return process.env[envVarEnabled] === 'on';
}

function getEnvVarGlobs(): string[] {
  // if the globs env. var is set, returns an array from splitting the value on ":", otherwise returns an empty array
  return process.env[envVarGlobs]?.split(':') || [];
}

function getGlobs(): string[] {
  // returns an array of all globs (from env var and from cfg)
  return [...cfgGlobs(), ...getEnvVarGlobs()];
}

function createUriWatcher(
  glob: string,
  log: vscode.LogOutputChannel
): vscode.FileSystemWatcher {

  const dir = path.dirname (glob);
  const pat = path.basename(glob);

  log.info(`glob:        "${glob}"`);
  log.info(`  dir part:  "${dir}" (exists?: ${fs.existsSync(dir)})`);
  log.info(`  file part: "${pat}"`);

  const relPath = new vscode.RelativePattern(vscode.Uri.file(dir), pat)
  return vscode.workspace.createFileSystemWatcher(relPath);
}

function shouldEnable(log: vscode.LogOutputChannel): boolean {

  const enabledSetting = cfgEnabled();
  log.info(`setting "enabled" is "${enabledSetting}"`);

  if (enabledSetting === 'on') {
    return true;
  }

  if (enabledSetting === 'fromEnvVar') {

    const envVarIsEnabled = getEnvVarEnabled();
    log.info(`env var "${envVarEnabled}" is ${envVarIsEnabled ? 'set to "on"' : 'not set to "on"'}`);
    return envVarIsEnabled;
  }

  return false;
}

export function activate(ctx: vscode.ExtensionContext): void {

  const log = vscode.window.createOutputChannel(
    cfg.EXTENSION_NAME,
    { log: true }
  );
  ctx.subscriptions.push(log);

  log.info('');
  log.info('ACTIVATED');
  log.info(`extension path: ${ctx.extensionUri.fsPath}`);

  // Store watchers in a mutable array to manage them
  let watchers: vscode.FileSystemWatcher[] = [];

  function disposeWatchers() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    watchers.forEach(watcher => watcher.dispose());
    watchers = [];
  }

  function updateWatchers() {
    disposeWatchers();
    log.info('disposed all file watchers.');

    const doEnable = shouldEnable(log)
    log.info(`enable watchers?: ${doEnable}`);


    if (doEnable) {
      const globs = getGlobs();
      log.info('');
      log.info(`configured globs: ${JSON.stringify(globs)}`);

      for (const glob of globs) {

        const doReload = (uri: vscode.Uri) => {
          log.info(`**event**: ${uri.fsPath}. Reloading window.`);
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        };

        const watcher = createUriWatcher(glob, log);

        watcher.onDidChange(doReload);
        watcher.onDidCreate(doReload);
        watcher.onDidDelete(doReload);

        ctx.subscriptions.push(watcher); // for disposal on deactivation
        watchers.push(watcher);          // keep track for dynamic updates

        }
      log.info(`updated watchers (active: ${watchers.length})`);
      log.info('');
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
