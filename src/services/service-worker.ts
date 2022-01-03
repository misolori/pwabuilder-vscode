import * as vscode from "vscode";
import { isNpmInstalled, noNpmInstalledWarning } from "./new-pwa-starter";

const vsTerminal = vscode.window.createTerminal();

let existingWorker: any | undefined = undefined;

export async function handleServiceWorkerCommand(): Promise<void> {
  try {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
      },
      async (progress) => {
        progress.report({ message: "Building service worker..." });
        await runWorkboxTool();
        progress.report({ message: "Service worker added!" });

        findWorker();
      }
    );

    await handleAddingToIndex();

    vscode.window.showInformationMessage(
      "When you are ready to generate your Service Worker, tap the 'Generate Service Worker' button in the status bar below."
    );

    await vscode.window.showInformationMessage(
      "Check the Workbox documentation to add workbox to your existing build command.",
      {},
      {
        title: "Open Workbox Documentation",
        action: async () => {
          await vscode.env.openExternal(
            vscode.Uri.parse(
              "https://developers.google.com/web/tools/workbox/modules/workbox-cli#setup_and_configuration"
            )
          );
        },
      }
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      err && (err as Error).message
        ? (err as Error).message
        : "There was an issue adding your service worker"
    );
  }
}

export function generateServiceWorker() {
  vsTerminal.show();
  vsTerminal.sendText("workbox generateSW");
}

export function chooseServiceWorker() {
  const serviceWorker = vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    title: "Select your Service Worker",
    filters: {
      JavaScript: ["js", "ts"],
    },
  });

  if (serviceWorker) {
    existingWorker = serviceWorker;
  }
}

export function getWorker() {
  return existingWorker;
}

export async function findWorker() {
  const worker = await vscode.workspace.findFiles(
    "**/service-worker.js",
    "**​/node_modules/**"
  );

  if (worker.length > 0) {
    existingWorker = worker[0];
  } else {
    const workerTryTwo = await vscode.workspace.findFiles(
      "**/pwabuider-sw.ts",
      "**​/node_modules/**"
    );

    if (workerTryTwo.length > 0) {
      existingWorker = workerTryTwo[0];
    }
  }

  if (existingWorker) {
    // do refreshPackageView command
    await vscode.commands.executeCommand("pwa-studio.refreshPackageView");
  }

  return existingWorker;
}

async function runWorkboxTool(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const npmCheck = isNpmInstalled();
      if (npmCheck) {
        vsTerminal.show();
        vsTerminal.sendText("npm install workbox-cli --global");

        vsTerminal.sendText("workbox wizard");
        resolve();
      } else {
        noNpmInstalledWarning();
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function handleAddingToIndex(): Promise<void> {
  const indexFile = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    title: "Select your index.html",
    filters: {
      HTML: ["html"],
    },
  });

  if (indexFile) {
    await vscode.workspace.openTextDocument(indexFile[0]);

    await vscode.window.showInformationMessage(
      "Finish adding your service worker by adding the following code to your index.html: `navigator.serviceWorker.register('/service-worker.js');`",
      {},
      {
        title: "Copy to clipboard",
        action: async () => {
          try {
            await vscode.env.clipboard.writeText(
              `<script>navigator.serviceWorker.register('/service-worker.js');</script>`
            );
          } catch (err) {
            vscode.window.showErrorMessage(
              err && (err as Error).message
                ? (err as Error).message
                : "There was an issue adding your service worker"
            );
          }
        },
      }
    );
  }
}
