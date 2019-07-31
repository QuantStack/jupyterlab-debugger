import { NotebookPanel } from "@jupyterlab/notebook";
import { KernelMessage } from "@jupyterlab/services";
import { IClientSession } from "@jupyterlab/apputils";
import { IDisposable } from "@phosphor/disposable";
import { DebugProtocol } from "./debugProtocol";

export interface IBreakpoint {
  text: string;
  line: number;
}

export interface IDebugSession extends IDisposable {
  start(): Promise<void>;
  stop(): Promise<void>;
  continue(): Promise<void>;
  getVariables(): Promise<DebugProtocol.Variable[]>;
  started: boolean;
  breakpoints: IBreakpoint[];
  variables: DebugProtocol.Variable[];
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
    return this.createRequestMsg("stackTrace", { threadId: threadId });
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

  protected _onIOPubMessage(sender: IClientSession, msg: any) {
    if (msg["msg_type"] !== "debug_event") {
      return;
    }
    console.log("received debug event message");
    console.log(msg);

    if (msg.content.event === "thread") {
      this._threadId = msg.content.body.threadId;
    }

    return false;
  }

  public async start() {
    this._seq = 0;

    const kernel = this._notebook.session.kernel;
    const cell = this._notebook.content.activeCell;

    if (!cell) {
      return;
    }

    // listen to debug events on the IOPub channel
    const session = this._notebook.session;
    session.iopubMessage.connect(this._onIOPubMessage, this);

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
    const debugCell = kernel.requestDebug(
      this.createUpdateCellRequest(0, this._nextId++, cellContent)
    );
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

    const debugConfigDone = kernel.requestDebug(
      this.createConfigurationDoneMsg()
    );
    debugConfigDone.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received config done reply");
      console.log(msg);
    };

    await debugConfigDone.done;

    this._started = true;

    // execute the current cell
    const debugExecute = kernel.requestExecute({ code: cellContent });
    debugExecute.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
      console.log("received execute reply");
      console.log(msg);
    };
    // do not await here (blocking)
  }

  public async getVariables(): Promise<DebugProtocol.Variable[]> {
    const kernel = this._notebook.session.kernel;

    const debugStacktrace = kernel.requestDebug(
      this.createStacktraceRequest(this._threadId)
    );
    let frameId;
    debugStacktrace.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received stacktrace reply");
      console.log(msg);
      const stackTraceResponse = msg.content as DebugProtocol.StackTraceResponse;
      const stackFrames = stackTraceResponse.body.stackFrames;
      if (stackFrames.length === 0) {
        return;
      }
      frameId = stackFrames[0].id;
    };
    await debugStacktrace.done;

    if (!frameId) {
      return [];
    }

    const debugScopes = kernel.requestDebug(this.createScopesRequest(frameId));
    let scopes: DebugProtocol.Scope[];
    debugScopes.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received scopes reply");
      console.log(msg);
      const scopesResponse = msg.content as DebugProtocol.ScopesResponse;
      if (!scopesResponse.body.scopes) {
        return;
      }
      scopes = scopesResponse.body.scopes;
    };
    await debugScopes.done;

    const scope = scopes[0];
    const variablesReference = scope.variablesReference;
    const debugVariables = kernel.requestDebug(
      this.createVariablesRequest(variablesReference)
    );
    let variables = null;
    debugVariables.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received variables reply");
      console.log(msg);
      const variablesResponse = msg.content as DebugProtocol.VariablesResponse;
      variables = variablesResponse.body.variables;
    };
    await debugVariables.done;
    return variables;
  }

  public async continue() {
    const kernel = this._notebook.session.kernel;

    this._variables = await this.getVariables();

    if (this._variables.length === 0) {
      await this.stop();
      return;
    }

    const debugContinue = kernel.requestDebug(
      this.createContinueRequest(this._threadId)
    );

    debugContinue.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received continue reply");
      console.log(msg);
    };
    await debugContinue.done;
  }

  public async stop() {
    const kernel = this._notebook.session.kernel;
    const session = this._notebook.session;
    session.iopubMessage.disconnect(this._onIOPubMessage, this);

    const debugDisconnect = kernel.requestDebug(
      this.createDisconnectMsg(false, true)
    );
    debugDisconnect.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received disconnect reply");
      console.log(msg);
    };
    await debugDisconnect.done;

    this._variables = [];
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

  get variables(): DebugProtocol.Variable[] {
    return this._variables;
  }

  set variables(variables: DebugProtocol.Variable[]) {
    this._variables = variables;
  }

  dispose(): void {}

  isDisposed: boolean;

  private _notebook: NotebookPanel;
  private _seq: number;
  private _nextId: number = 1;
  private _threadId: number = 1;
  private _started: boolean = false;
  private _breakpoints: IBreakpoint[] = [];
  private _variables: DebugProtocol.Variable[] = [];
}
