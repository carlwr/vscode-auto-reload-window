Available on the [VS Code Marketplace][marketplace].

[marketplace]: https://marketplace.visualstudio.com/items?itemName=carlwr.auto-reload-window

Minimal VSCode extension to automatically reload the VSCode window when a file changes.

The intended use case is with extension development E.g. with extensions contributing a language grammar, the only way to make VS Code re-tokenize an open file from a language grammar that changed on disk is to reload the window. With this extension, such a reload can be configured to happen automatically every time the grammar changes.

## Example configuration

Using project files as follows will automatically reload a _development host window_ (only) when the grammar file changes:
```jsonc

// $PROJ/.vscode/settings.json:
{
  "auto-reload-window.enabled": "fromEnvVar",
}

// $PROJ/.vscode/launch.json:
{
  "configurations": [
    {
      "name": "Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "env": {
        "VSC_ARW_ENABLED": "on",
        "VSC_ARW_GLOBS": "${workspaceFolder}/syntaxes/*.json"
      }
    }
  ]
}
```

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
