import { Cell } from "@jupyterlab/cells";
import { CodeMirrorEditor } from "@jupyterlab/codemirror";
import { INotebookTracker } from "@jupyterlab/notebook";
import { Signal } from "@phosphor/signaling";

export interface IBreakpointEvent {
  line: number;
  text: string;
  remove: boolean;
}

export interface IBreakpoint {
  text: string;
  line: number;
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