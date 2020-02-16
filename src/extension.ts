// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "writers-wordcount" is now active!');


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
            let wordCount = this._getWordCount(doc);
            let commentCount = this._getCommentWordCount(doc);

            // Update the status bar
            statusBarItemVisible.text = wordCount !== 1 ? `$(preview) ${wordCount - commentCount} Visible Words` : '$(preview) 1 Word';
            statusBarItemTotal.text = wordCount !== 1 ? `$(pencil) ${wordCount} Total Words` : '$(pencil) 1 Word';

            statusBarItemVisible.show();
            statusBarItemTotal.show();
        } else {
            statusBarItemVisible.hide();
            statusBarItemTotal.hide();
        }
    }

    public _getCommentWordCount(doc: vscode.TextDocument): number {
        // Get the count of just the comments
        let docContent = doc.getText();

        let matches = docContent.match(/<!--[^>]*-->/g);
        let wordcount = 0;

        if (matches) {
            matches.forEach(function (comment) {
                wordcount = wordcount + comment.split(" ").length;
            });
        }
        return wordcount;
    }

    public _getWordCount(doc: vscode.TextDocument): number {
        let docContent = doc.getText();

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        let wordCount = 0;
        if (docContent !== "") {
            wordCount = docContent.split(" ").length;
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
