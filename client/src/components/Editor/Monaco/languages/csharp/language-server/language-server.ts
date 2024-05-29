import * as monaco from "monaco-editor";
import { Disposable, PgCommon, PgExplorer } from "../../../../../../utils/pg";

/** Monaco language id for csharp */
const LANGUAGE_ID = "csharp";

/**
 * Initialize Language Server.
 * *
 * @returns a disposable to dispose all events
 */
export const initLanguageServer = async (): Promise<Disposable> => {
  const { dispose: disposeUpdateCurrentCrate } = await PgCommon.executeInitial(
    (cb) => {
      // Both `onDidInit` and `onDidSwitchWorkspace` is required to catch all
      // cases in which the current crate needs to be updated
      return PgCommon.batchChanges(cb, [
        PgExplorer.onDidInit,
        PgExplorer.onDidSwitchWorkspace,
      ]);
    },
    async () => {}
  );

  // Register providers at the end in order to avoid out of bound errors due to
  // a possible mismatch between the LSP and the client files before initialization
  const { dispose: disposeProviders } = registerProviders();

  return {
    dispose: () => {
      disposeUpdateCurrentCrate();
      disposeProviders();
    },
  };
};

var assemblies: Array<string> = [];

/**
 * Register editor providers.
 *
 * @returns a disposable to remove all registered providers
 */
const registerProviders = (): Disposable => {
  const disposables: Array<monaco.IDisposable> = [
    monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
      triggerCharacters: [".", " "],
      provideCompletionItems: async (model, position) => {
        // https://github.com/microsoft/monaco-editor/issues/1352#issuecomment-470830482
        const word = model.getWordUntilPosition(position);
        const range: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        let suggestions: Array<monaco.languages.CompletionItem> = [];

        let request = {
          Code: model.getValue(),
          Position: model.getOffsetAt(position),
          Assemblies: assemblies,
        };

        let resultQ = await sendRequest("complete", request);

        for (let elem of resultQ.data) {
          suggestions.push({
            label: {
              label: elem.Suggestion,
              description: elem.Description,
            },
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: elem.Suggestion,
            range: range,
          });
        }

        return { suggestions: suggestions };
      },
    }),
    monaco.languages.registerSignatureHelpProvider(LANGUAGE_ID, {
      signatureHelpTriggerCharacters: ["("],
      signatureHelpRetriggerCharacters: [","],

      provideSignatureHelp: async (model, position, token, context) => {
        let request = {
          Code: model.getValue(),
          Position: model.getOffsetAt(position),
          Assemblies: assemblies,
        };

        let resultQ = await sendRequest("signature", request);
        if (!resultQ.data) return;

        let signatures = [];
        for (let signature of resultQ.data.Signatures) {
          let params = [];
          for (let param of signature.Parameters) {
            params.push({
              label: param.Label,
              documentation: param.Documentation ?? "",
            });
          }

          signatures.push({
            label: signature.Label,
            documentation: signature.Documentation ?? "",
            parameters: params,
          });
        }

        let signatureHelp: monaco.languages.SignatureHelp = {
          signatures,
          activeParameter: resultQ.data.ActiveParameter,
          activeSignature: resultQ.data.ActiveSignature,
        };

        return {
          value: signatureHelp,
          dispose: () => {},
        };
      },
    }),
    monaco.languages.registerHoverProvider(LANGUAGE_ID, {
      provideHover: async function (model, position) {
        let request = {
          Code: model.getValue(),
          Position: model.getOffsetAt(position),
          Assemblies: assemblies,
        };

        let resultQ = await sendRequest("hover", request);

        if (resultQ.data) {
          const posStart = model.getPositionAt(resultQ.data.OffsetFrom);
          const posEnd = model.getPositionAt(resultQ.data.OffsetTo);

          return {
            range: new monaco.Range(
              posStart.lineNumber,
              posStart.column,
              posEnd.lineNumber,
              posEnd.column
            ),
            contents: [{ value: resultQ.data.Information }],
          };
        }

        return null;
      },
    }),
    monaco.editor.onDidCreateModel(function (model) {
      async function validate() {
        let request = {
          Code: model.getValue(),
          Assemblies: assemblies,
        };

        let resultQ = await sendRequest("codeCheck", request);

        let markers = [];

        for (let elem of resultQ.data) {
          const posStart = model.getPositionAt(elem.OffsetFrom);
          const posEnd = model.getPositionAt(elem.OffsetTo);
          markers.push({
            severity: elem.Severity,
            startLineNumber: posStart.lineNumber,
            startColumn: posStart.column,
            endLineNumber: posEnd.lineNumber,
            endColumn: posEnd.column,
            message: elem.Message,
            code: elem.Id,
          });
        }

        monaco.editor.setModelMarkers(model, LANGUAGE_ID, markers);
      }

      var handle: ReturnType<typeof setTimeout> | null = null;
      model.onDidChangeContent(() => {
        monaco.editor.setModelMarkers(model, LANGUAGE_ID, []);
        if (handle) clearTimeout(handle);
        handle = setTimeout(() => validate(), 500);
      });
      validate();
    }),
  ];

  return { dispose: () => disposables.forEach(({ dispose }) => dispose()) };
};

async function sendRequest(type: string, request: Object) {
  let endPoint = "/";
  switch (type) {
    case "complete":
      endPoint = "/completion/complete";
      break;
    case "signature":
      endPoint = "/completion/signature";
      break;
    case "hover":
      endPoint = "/completion/hover";
      break;
    case "codeCheck":
      endPoint = "/completion/codeCheck";
      break;
  }

  const req = await fetch(endPoint, {
    method: "POST",
    body: JSON.stringify(request),
  });
  const data = await req.json();

  return { data };
}
