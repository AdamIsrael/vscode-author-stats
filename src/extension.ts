// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "author-stats1" is now active!');

    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello Adam!');
	// });

	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

let statusBarItemVisible: vscode.StatusBarItem;
let statusBarItemTotal: vscode.StatusBarItem;

export class WordCounter {

    public updateWordCount() {

        // Create as needed
        if (!statusBarItemVisible) {
            statusBarItemVisible = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        if (!statusBarItemTotal) {
            statusBarItemTotal = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        // Get the current text editor
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBarItemVisible.hide();
            statusBarItemTotal.hide();
            return;
        }

        let doc = editor.document;

        // Only update status if an MD file
        if (doc.languageId === "markdown") {

            let totalCount = this._getWordCount(doc.getText());
            let preview = this._renderMarkdown(doc.getText());
            let wordCount = this._getWordCount(preview);

            // Update the status bar
            statusBarItemVisible.text = wordCount !== 1 ? `$(preview) ${wordCount} Visible Words` : '$(preview) 1 Word';
            statusBarItemTotal.text = wordCount !== 1 ? `$(pencil) ${totalCount} Total Words` : '$(pencil) 1 Word';

            statusBarItemVisible.show();
            statusBarItemTotal.show();
        } else {
            statusBarItemVisible.hide();
            statusBarItemTotal.hide();
        }
    }

    public _renderMarkdown(doc: string): string {
        // Remove the non-visible text from the document
        // TODO: Can we use the Markdown Preview to render the visible text?

        // YAML Front Matter
        doc = doc.replace(/---[^>]*---/g, '');

        // TOML Front Matter
        doc = doc.replace(/\+\+\+[^>]*\+\+\+/g, '');

        // JSON Front Matter
        doc = doc.replace(/\{[^>]*\}/g, '');

        // Pandoc
        doc = doc.replace(/%\s+[\w\s();]+/g, '');

        // Markdown comment blocks
        doc = doc.replace(/<!--[^>]*-->/g, '');

        return doc;
    }

    public _getWordCount(doc: string): number {
        // Parse out unwanted whitespace so the split is accurate
        doc = doc.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        doc = doc.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        let wordCount = 0;
        if (doc !== "") {
            wordCount = doc.split(" ").length;
        }

        return wordCount;
    }

    public dispose() {
        statusBarItemTotal.dispose();
        statusBarItemVisible.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: vscode.Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
