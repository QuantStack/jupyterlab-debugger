import { NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage } from "@jupyterlab/services";

export interface IBreakpoint {
  text: string;
  line: number;
}

export interface IDebugSession {
  start(): void;
  stop(): void;
  started: boolean;
  breakpoints: IBreakpoint[];
}

export class DebugSession implements IDebugSession {
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
    return this.createRequestMsg("updateCell", {
      cellId: cellId,
      nextId: nextId,
      code: code
    });
  }

  createBreakpointRequest(path: string) {
    const lines = this._breakpoints.map(line => {
      line;
    });

    return this.createRequestMsg("setBreakpoints", {
      source: { path: path },
      breakpoints: this._breakpoints,
      lines: lines,
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
    const cell = this._notebook.content.activeCell;

    if (!cell) {
      return;
    }

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

    const cellContent = cell.model.value.text;
    // cellId does not seem to be used in xeus-python
    // TODO: send proper value for cellId
    const debugCell = kernel.requestDebug(this.createUpdateCellRequest(0, this._nextId++, cellContent));
    let debugCellReply: KernelMessage.IDebugReplyMsg;
    debugCell.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received updateCell reply");
      console.log(msg);
      debugCellReply = msg;
    };
    await debugCell.done;

    const path = debugCellReply.content.body.sourcePath;
    const debugBreakpoints = kernel.requestDebug(
      this.createBreakpointRequest(path)
    );
    debugBreakpoints.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received breakpoints reply");
      console.log(msg);
    };
    await debugBreakpoints.done;

    this._started = true;
  }

  public async stop() {
    const kernel = this._notebook.session.kernel;
    const debugDisconnect = kernel.requestDebug(
      this.createDisconnectMsg(false, true)
    );
    debugDisconnect.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received disconnect reply");
      console.log(msg);
    };
    await debugDisconnect.done;

    this._started = false;
  }

  get started(): boolean {
    return this._started;
  }

  get breakpoints(): IBreakpoint[] {
    return this._breakpoints;
  }

  set breakpoints(breakpoints: IBreakpoint[]) {
    this._breakpoints = breakpoints;
  }

  private _notebook: NotebookPanel;
  private _seq: number;
  private _nextId: number = 0;
  private _started: boolean = false;
  private _breakpoints: IBreakpoint[] = [];
}
