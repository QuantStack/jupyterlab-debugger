import { NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage } from "@jupyterlab/services";

export class DebugSession {
  constructor(notebook: NotebookPanel) {
    this._notebook = notebook;
  }

  createRequestMsg(
    command: string,
    args: any
  ): KernelMessage.IDebugRequestMsg["content"] {
    this._seq += 2;
    return {
      seq: this._seq - 2,
      type: "request",
      command: command,
      arguments: args
    } as KernelMessage.IDebugRequestMsg["content"];
  }

  createAttachMsg(cwd: string, justMyCode: boolean) {
    return this.createRequestMsg("attach", {
      cwd: cwd,
      justMyCode: justMyCode
    });
  }

  createEvaluateMsg(code: string) {
    return this.createRequestMsg("evaluate", {
      expression: code
    });
  }

  createStacktraceRequest(threadId: number) {
    return this.createRequestMsg("stacktrace", { threadId: threadId });
  }

  createScopesRequest(frameId: number) {
    return this.createRequestMsg("scopes", { frameId: frameId });
  }

  createVariablesRequest(variablesReference: number) {
    return this.createRequestMsg("variables", {
      variablesReference: variablesReference
    });
  }

  createContinueRequest(threadId: number) {
    return this.createRequestMsg("continue", { threadId: threadId });
  }

  createUpdateCellRequest(cellId: number, nextId: number, code: string) {
    return this.createRequestMsg("update_cell", {
      cellId: cellId,
      nextId: nextId,
      code: code
    });
  }

  createBreakpointRequest(path: string, lineNumbers: number[]) {
    let breakarray = [];
    for (let el in lineNumbers) {
      breakarray.push({ line: el });
    }

    return this.createRequestMsg("setBreakpoints", {
      source: { path: path },
      breakpoints: breakarray,
      lines: lineNumbers,
      sourceModified: false
    });
  }

  createConfigurationDoneMsg() {
    return this.createRequestMsg("configurationDone", {});
  }

  createDisconnectMsg(restart: boolean, terminateDebuggee: boolean) {
    return this.createRequestMsg("disconnect", {
      restart: restart,
      terminateDebuggee: terminateDebuggee
    });
  }

  createNextMsg(threadId: number) {
    return this.createRequestMsg("next", { threadId: threadId });
  }

  createInitializeMsg() {
    return this.createRequestMsg("initialize", {
      clientId: "vscode",
      clientName: "Visual Studio Code",
      adapterID: "python",
      pathFormat: "path",
      linesStartAt1: true,
      columnsStartAt1: true,
      supportsVariableType: true,
      supportsVariablePaging: true,
      supportsRunInTerminalRequest: true,
      locale: true
    });
  }

  public async start() {
    this._seq = 0;

    const kernel = this._notebook.session.kernel;
    const debugInit = kernel.requestDebug(this.createInitializeMsg());
    debugInit.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received init reply");
      console.log(msg);
    };
    await debugInit.done;

    const debugAttach = kernel.requestDebug(
      this.createAttachMsg("/tmp/", false)
    );
    debugAttach.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received attach reply");
      console.log(msg);
    };
    await debugAttach.done;
  }

  public async stop() {
    const kernel = this._notebook.session.kernel;
    const debugDisconnect = kernel.requestDebug(this.createDisconnectMsg(false, true));
    debugDisconnect.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received disconnect reply");
      console.log(msg);
    };
    await debugDisconnect.done;
  }

  private _notebook: NotebookPanel;
  private _seq: number;
}
