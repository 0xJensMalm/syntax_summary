import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.showSyntaxErrors', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }

        const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
        const syntaxErrors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);

        if (syntaxErrors.length === 0) {
            vscode.window.showInformationMessage('No syntax errors found');
            return;
        }

        const errorSummary = syntaxErrors.map(error => 
            `Line ${error.range.start.line + 1}: ${error.message}`
        ).join('\n');

        const panel = vscode.window.createWebviewPanel(
            'syntaxErrors',
            'Syntax Errors Summary',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent(errorSummary);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'copyToClipboard':
                        vscode.env.clipboard.writeText(errorSummary);
                        vscode.window.showInformationMessage('Copied to clipboard');
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(errorSummary: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Syntax Errors Summary</title>
    </head>
    <body>
        <h1>Syntax Errors Summary</h1>
        <pre>${errorSummary}</pre>
        <button id="copyButton">Copy to Clipboard</button>
        <script>
            const vscode = acquireVsCodeApi();
            document.getElementById('copyButton').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'copyToClipboard'
                });
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}