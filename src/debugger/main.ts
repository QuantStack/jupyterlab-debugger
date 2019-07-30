import { Cell } from "@jupyterlab/cells";
import { CodeMirrorEditor } from "@jupyterlab/codemirror";
import { INotebookTracker } from "@jupyterlab/notebook";
import { Signal } from "@phosphor/signaling";

import { IDebugger } from './tokens';
import { DebugSession, IDebugSession, IBreakpoint } from './session';

export interface IBreakpointEvent {
  line: number;
  text: string;
  remove: boolean;
}

export class Debugger implements IDebugger {
  constructor(options: Debugger.IOptions) {
    const { tracker } = options;
    this._tracker = tracker;
    this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);
  }

  protected async _onActiveCellChanged() {
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

    if (this._debugSession && this._debugSession.started) {
      await this._debugSession.stop();
    }
    // reinitialize the list of breakpoints
    // TODO: retrieve breakpoints from StateDB?
    const breakpoints = this._getExistingBreakpoints(activeCell);
    this._debugSession = new DebugSession(widget);
    this._debugSession.breakpoints = breakpoints;
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

    const breakpoints = this._getExistingBreakpoints(this._tracker.activeCell);
    this.debugSession.breakpoints = breakpoints;
    this.breakpointChanged.emit(breakpoints);
  }

  protected _getExistingBreakpoints(cell: Cell): IBreakpoint[] {
    const editor = cell.editor as CodeMirrorEditor;
    // TODO: is there a better way to get all gutter markers at once?
    let lines = [];
    for (let i = 0; i < editor.doc.lineCount(); i++) {
      const info = editor.editor.lineInfo(i);
      if (info.gutterMarkers) {
        const breakpoint = {
          line: info.line + 1, // lines start at 1
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

  get debugSession(): IDebugSession {
    return this._debugSession;
  }

  readonly breakpointChanged = new Signal<this, IBreakpoint[]>(this);
  readonly activeCellChanged = new Signal<this, IBreakpoint[]>(this);

  private _tracker: INotebookTracker;
  private _previousCell: Cell;
  private _debugSession: IDebugSession;
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