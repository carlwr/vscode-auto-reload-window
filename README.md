Minimal VSCode extension to automatically reload the VSCode window when a file changes.

The intended use case is with extension development E.g. with extensions contributing a language grammar, the only way to make VS Code re-tokenize an open file from a language grammar that changed on disk is to reload the window. With this extension, such a reload can be configured to happen automatically every time the grammar changes.

## Development

### Set-up

```bash
git clone carlwr/vscode-auto-reload-window
cd vscode-auto-reload-window
pnpm install
pnpm build

pnpm build && pnpm eslint  # lint
pnpm build --package       # create .vsix
```
