const languages = {
  createDiagnosticCollection: jest.fn(),
};

const StatusBarAlignment = {};

const window = {
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(),
  })),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  createTextEditorDecorationType: jest.fn(),
};

class Configuration {
  constructor() {
    this.config = {
      'COVID-19.displayGlobal': false,
      'COVID-19.countries': ['US'],
    };

    this.get = this.get.bind(this);
  }

  get(property) {
    return this.config[property];
  }
}

const workspace = {
  // getConfiguration: jest.fn(),
  getConfiguration: () => new Configuration(),
  workspaceFolders: [],
  onDidSaveTextDocument: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
};

const OverviewRulerLane = {
  Left: null,
};

const Uri = {
  file: (f) => f,
  parse: jest.fn(),
};
const Range = jest.fn();
const Diagnostic = jest.fn();
const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };

const debug = {
  onDidTerminateDebugSession: jest.fn(),
  startDebugging: jest.fn(),
};

const commands = {
  executeCommand: jest.fn(),
};

const vscode = {
  languages,
  StatusBarAlignment,
  window,
  workspace,
  OverviewRulerLane,
  Uri,
  Range,
  Diagnostic,
  DiagnosticSeverity,
  debug,
  commands,
};

module.exports = vscode;
