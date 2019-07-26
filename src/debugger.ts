import { Cell } from "@jupyterlab/cells";
import { CodeMirrorEditor } from "@jupyterlab/codemirror";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { Signal } from "@phosphor/signaling";

import { KernelMessage } from "@jupyterlab/services";

export interface IBreakpointEvent {
  line: number;
  text: string;
  remove: boolean;
}

export interface IBreakpoint {
  text: string;
  line: number;
}

export class DebugSession {
  notebook: NotebookPanel;
  seq: number;

  constructor(notebook: NotebookPanel)
  {
    this.notebook = notebook;
  }

  create_request_msg(command: string, args: any)
    : KernelMessage.IDebugRequestMsg['content']
  {
    this.seq += 2;
    return {
      seq: this.seq - 2,
      type: 'request',
      command: command,
      arguments: args
    } as KernelMessage.IDebugRequestMsg['content']
  }

  create_attach_msg(cwd: string, justMyCode: boolean)
  {
    return this.create_request_msg('attach', {
      cwd: cwd,
      justMyCode: justMyCode
    });
  }

  create_evaluate_msg(code: string) 
  {
    return this.create_request_msg('evaluate', {
      expression: code
    });
  }

  create_stacktrace_request(threadId: number) 
  {
    return this.create_request_msg('stacktrace', {threadId: threadId});
  }

  create_scopes_request(frameId: number) 
  {
    return this.create_request_msg('scopes', {frameId: frameId});
  }

  create_variables_request(variablesReference: number) 
  {
    return this.create_request_msg('variables', {variablesReference: variablesReference});
  }

  create_continue_request(threadId: number) 
  {
    return this.create_request_msg('continue', {threadId: threadId});
  }

  create_update_cell_request(cellId: number, nextId: number, code: string) 
  {
    return this.create_request_msg('update_cell', {
      cellId: cellId,
      nextId: nextId,
      code: code
    });
  }

  create_breakpoint_request(path: string, lineNumbers: number[])
  {
    let breakarray = []
    for (let el in lineNumbers)
    {
      breakarray.push({line: el});
    }

    return this.create_request_msg('setBreakpoints',
    {
      source: { path: path }, 
      breakpoints: breakarray,
      lines: lineNumbers,
      sourceModified: false
    });
  }

  create_configuration_done_msg()
  {
    return this.create_request_msg('configurationDone', {});
  }

  create_disconnect_msg(restart: boolean, terminateDebuggee: boolean)
  {
    return this.create_request_msg('disconnect', {
      restart: restart,
      terminateDebuggee: terminateDebuggee
    });
  }

  create_next_msg(threadId: number)
  {
    return this.create_request_msg('next', {threadId: threadId});
  }

  create_initialize_msg()
  {
    return this.create_request_msg('initialize', {
      clientId: 'vscode',
      clientName: 'Visual Studio Code',
      adapterID: 'python',
      pathFormat: 'path',
      linesStartAt1: true,
      columnsStartAt1: true,
      supportsVariableType: true,
      supportsVariablePaging: true,
      supportsRunInTerminalRequest: true,
      locale: true
    });
  }

  async start() {
    this.seq = 0;
    console.log("Start Debugger");
    let kernel = this.notebook.session.kernel;
    let debug_init = kernel.requestDebug(this.create_initialize_msg());
    debug_init.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received init reply");
      console.log(msg)
    };
    await debug_init.done;

    console.log("did i already receive the reply? moving to attach...");

    let debug_attach = kernel.requestDebug(this.create_attach_msg('/tmp/', false));
    debug_attach.onReply = (msg: KernelMessage.IDebugReplyMsg) => {
      console.log("received attach reply");
      console.log(msg)
    };
    await debug_attach.done;
  }
}

export class Debugger {
  constructor(options: Debugger.IOptions) {
    const { tracker } = options;
    this._tracker = tracker;
    this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);
  }

  protected _onActiveCellChanged() {
    const widget = this._tracker.currentWidget;
    if (!widget) {
      return;
    }
    if (this._previousCell && !this._previousCell.isDisposed) {
      this._removeListeners(this._previousCell);
    }
    const activeCell = this.activeCell;
    this._previousCell = activeCell;
    if (!activeCell) {
      return;
    }
    // reinitialize the list of breakpoints
    // TODO: retrieve breakpoints from StateDB?
    const breakpoints = this._getExistingBreakpoints(activeCell);
    this.activeCellChanged.emit(breakpoints);
    this._setupListeners(activeCell);
  }

  protected _setupListeners(cell: Cell) {
    const editor = cell.editor as CodeMirrorEditor;

    editor.setOption("lineNumbers", true);
    editor.editor.setOption("gutters", [
      "CodeMirror-linenumbers",
      "breakpoints"
    ]);
    editor.editor.on("gutterClick", this._addBreakpointMarker);
  }

  protected _removeListeners(cell: Cell) {
    const editor = cell.editor as CodeMirrorEditor;
    editor.editor.off("gutterClick", this._addBreakpointMarker);
  }

  protected _addBreakpointMarker = (
    editor: CodeMirror.Editor,
    lineNumber: number
  ) => {
    const info = editor.lineInfo(lineNumber);
    if (!info) {
      return;
    }
    const breakpoint = {
      line: lineNumber,
      text: info.text,
      remove: !!info.gutterMarkers
    }
    editor.setGutterMarker(
      lineNumber,
      "breakpoints",
      breakpoint.remove ? null : Private.createMarkerNode()
    );
    this.breakpointChanged.emit(breakpoint);
  }

  protected _getExistingBreakpoints(cell: Cell): IBreakpoint[] {
    const editor = cell.editor as CodeMirrorEditor;
    // TODO: is there a better way to get all gutter markers at once?
    let lines = [];
    for (let i = 0; i < editor.doc.lineCount(); i++) {
      const info = editor.editor.lineInfo(i);
      if (info.gutterMarkers) {
        const breakpoint = {
          line: info.line,
          text: info.text,
          remove: false,
        }
        lines.push(breakpoint);
      }
    }
    return lines;
  }

  get activeCell(): Cell | null {
    return this._tracker.activeCell;
  }

  readonly breakpointChanged = new Signal<this, IBreakpointEvent>(this);
  readonly activeCellChanged = new Signal<this, IBreakpoint[]>(this);

  private _tracker: INotebookTracker;
  private _previousCell: Cell;
}

export namespace Debugger {
  export interface IOptions {
    tracker: INotebookTracker;
  }
}

namespace Private {
  export function createMarkerNode() {
    var marker = document.createElement("div");
    marker.style.color = "#f22";
    marker.innerHTML = "●";
    return marker;
  }
}