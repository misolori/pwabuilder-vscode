// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { setUpLocalPwaStarterRepository } from "./services/new-pwa-starter";
import {
  handleServiceWorkerCommand,
  generateServiceWorker,
  chooseServiceWorker,
  handleAdvServiceWorkerCommand,
  updateAdvServiceWorker,
} from "./services/service-worker";
import {
  handleManifestCommand,
  chooseManifest,
  handleIcons,
} from "./services/manifest/manifest-service";
import { packageApp } from "./services/package/package-app";
import {
  MANI_CODE,
  handleManiDocsCommand,
  handleValidation,
  subscribeToDocumentChanges,
} from "./services/validation/validation";
import { PWAValidationProvider } from "./services/validation/validation-view";
import { ServiceWorkerProvider } from "./services/validation/sw-view";
import { PackageViewProvider } from "./services/package/package-view";
import { LocalStorageService } from "./library/local-storage";
import { askForUrl } from "./services/web-publish";

const serviceWorkerCommandId = "pwa-studio.serviceWorker";
const generateWorkerCommandId = "pwa-studio.generateWorker";
const newPWAStarterCommandId = "pwa-studio.newPwaStarter";
const validateCommandId = "pwa-studio.validatePWA";
const packageCommandId = "pwa-studio.packageApp";
const manifestCommandID = "pwa-studio.manifest";
const maniDocsCommandID = "pwa-studio.maniItemDocs";
const chooseManiCommandID = "pwa-studio.chooseManifest";
const refreshViewCommandID = "pwa-studio.refreshEntry";
const refreshSWCommandID = "pwa-studio.refreshSWView";
const refreshPackageCommandID = "pwa-studio.refreshPackageView";
const chooseServiceWorkerCommandID = "pwa-studio.chooseServiceWorker";
const generateADVWorkerCommandID = "pwa-studio.generateAdvWorker";
const updateADVWorkerCommandID = "pwa-studio.updateAdvWorker";
const setAppURLCommandID = "pwa-studio.setWebURL";
const handleIconsCommmandID = "pwa-studio.generateIcons";

export let storageManager: LocalStorageService | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  storageManager = new LocalStorageService(context.workspaceState);

  // used for web manifest validation
  const manifestDiagnostics = vscode.languages.createDiagnosticCollection("webmanifest");
	context.subscriptions.push(manifestDiagnostics);
  
  subscribeToDocumentChanges(context, manifestDiagnostics);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('json', new ManifestInfoProvider(), {
			providedCodeActionKinds: ManifestInfoProvider.providedCodeActionKinds
		})
	);

  const serviceWorkerStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    150
  );
  serviceWorkerStatusBarItem.text = "Generate Service Worker";
  serviceWorkerStatusBarItem.show();

  const updateADVWorkerStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    450
  );
  updateADVWorkerStatusBarItem.text = "Update Precache Manifest";
  updateADVWorkerStatusBarItem.show();

  const packageStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  packageStatusBarItem.text = "Package PWA";
  packageStatusBarItem.show();

  const manifestStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    200
  );
  manifestStatusBarItem.text = "Generate Web Manifest";
  manifestStatusBarItem.show();

  const generateIconsStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    350
  );
  generateIconsStatusBarItem.text = "Generate Icons";
  generateIconsStatusBarItem.show();

  const generateAppStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    250
  );
  generateAppStatusBarItem.text = "Start new PWA";
  generateAppStatusBarItem.show();

  const publishToWebStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    300
  );
  publishToWebStatusBarItem.text = "Publish to Web";
  publishToWebStatusBarItem.show();

  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    const maniValidationProvider = new PWAValidationProvider(
      vscode.workspace.workspaceFolders[0].uri.fsPath
    );

    const serviceWorkerProvider = new ServiceWorkerProvider(
      vscode.workspace.workspaceFolders[0].uri.fsPath
    );

    const packageViewProvider = new PackageViewProvider(
      vscode.workspace.workspaceFolders[0].uri.fsPath
    );

    vscode.window.createTreeView("validationPanel", {
      treeDataProvider: maniValidationProvider,
    });

    vscode.window.createTreeView("serviceWorkerPanel", {
      treeDataProvider: serviceWorkerProvider,
    });

    vscode.window.createTreeView("packagePanel", {
      treeDataProvider: packageViewProvider,
    });

    vscode.commands.registerCommand(refreshViewCommandID, (event) => {
      maniValidationProvider.refresh(event);
    });

    vscode.commands.registerCommand(refreshSWCommandID, (event) => {
      serviceWorkerProvider.refresh(event);
    });

    vscode.commands.registerCommand(refreshPackageCommandID, (event) => {
      packageViewProvider.refresh(event);
    });
  }

  const maniDocs = vscode.commands.registerCommand(
    maniDocsCommandID,
    async (event: any) => {
      await handleManiDocsCommand(event);
    }
  );

  const chooseManifestCommand = vscode.commands.registerCommand(
    chooseManiCommandID,
    async () => {
      await chooseManifest();
    }
  );

  const generateIconsCommand = vscode.commands.registerCommand(
    handleIconsCommmandID,
    async () => {
      await handleIcons(context);
    }
  );
  generateIconsStatusBarItem.command = handleIconsCommmandID;

  const chooseServiceWorkerCommand = vscode.commands.registerCommand(
    chooseServiceWorkerCommandID,
    async () => {
      await chooseServiceWorker();
    }
  );

  const addServiceWorker = vscode.commands.registerCommand(
    serviceWorkerCommandId,
    async () => {
      await handleServiceWorkerCommand();
      serviceWorkerStatusBarItem.show();
    }
  );
  serviceWorkerStatusBarItem.command = serviceWorkerCommandId;

  const generateWorker = vscode.commands.registerCommand(
    generateWorkerCommandId,
    async () => {
      await generateServiceWorker();
    }
  );

  const generateAdvWorkerCommand = vscode.commands.registerCommand(
    generateADVWorkerCommandID,
    async () => {
      handleAdvServiceWorkerCommand();
    }
  );

  const updateAdvWorkerCommand = vscode.commands.registerCommand(
    updateADVWorkerCommandID,
    async () => {
      updateAdvServiceWorker();
    }
  );
  updateADVWorkerStatusBarItem.command = updateADVWorkerCommandID;

  let packageAppCommand = vscode.commands.registerCommand(
    packageCommandId,
    packageApp
  );
  packageStatusBarItem.command = packageCommandId;

  let newPwaStarterCommand = vscode.commands.registerCommand(
    newPWAStarterCommandId,
    setUpLocalPwaStarterRepository
  );
  generateAppStatusBarItem.command = newPWAStarterCommandId;

  let validationCommand = vscode.commands.registerCommand(
    validateCommandId,
    async () => {
      handleValidation(context);
    }
  );

  let manifestCommand = vscode.commands.registerCommand(
    manifestCommandID,
    async () => {
      await handleManifestCommand(context);
    }
  );
  manifestStatusBarItem.command = manifestCommandID;

  let setAppURLCommand = vscode.commands.registerCommand(
    setAppURLCommandID,
    async () => {
      await askForUrl();
    }
  );
  publishToWebStatusBarItem.command = setAppURLCommandID;

  context.subscriptions.push(manifestCommand);
  context.subscriptions.push(newPwaStarterCommand);
  context.subscriptions.push(addServiceWorker);
  context.subscriptions.push(chooseServiceWorkerCommand);
  context.subscriptions.push(serviceWorkerStatusBarItem);
  context.subscriptions.push(packageAppCommand);
  context.subscriptions.push(validationCommand);
  context.subscriptions.push(generateWorker);
  context.subscriptions.push(maniDocs);
  context.subscriptions.push(chooseManifestCommand);
  context.subscriptions.push(setAppURLCommand);
  context.subscriptions.push(generateIconsCommand);
  context.subscriptions.push(generateAdvWorkerCommand);
  context.subscriptions.push(updateAdvWorkerCommand);
}

export function deactivate() {}

export class ManifestInfoProvider implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === MANI_CODE)
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('', vscode.CodeActionKind.Empty);
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
}
