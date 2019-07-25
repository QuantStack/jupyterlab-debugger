import { Toolbar, ToolbarButton, ReactWidget } from "@jupyterlab/apputils";
import { Cell } from "@jupyterlab/cells";
import { CodeMirrorEditor } from "@jupyterlab/codemirror";
import { INotebookTracker } from "@jupyterlab/notebook";
import { Widget, PanelLayout } from "@phosphor/widgets";

import * as React from "react";

import {
  IBreakpoint,
  BreakpointsComponent
} from './components/breakpoints';

import { Signal } from "@phosphor/signaling";

const DEBUGGER_WIDGET_CLASS = "jp-Debugger";

export interface IBreakpointEvent {
  line: number;
  text: string;
  remove: boolean;
}

export class Debugger extends Widget {
  constructor(options: Debugger.IOptions) {
    super();
    this.addClass(DEBUGGER_WIDGET_CLASS);

    this._tracker = options.tracker;
    this._tracker.activeCellChanged.connect(this._onActiveCellChanged, this);

    this.toolbar = new Toolbar<Widget>();
    let start = new ToolbarButton({
      iconClassName: "jp-BugIcon",
      onClick: async () => {
        const widget = this._tracker.currentWidget;
        if (!widget) {
          return;
        }
        console.log("Start Debugger");
      },
      tooltip: "Start Debugger"
    });

    let stop = new ToolbarButton({
      iconClassName: "jp-StopIcon",
      onClick: () => {
        const widget = this._tracker.currentWidget;
        if (!widget) {
          return;
        }
        console.log("Stop Debugger");
      },
      tooltip: "Stop Debugger"
    });

    this.toolbar.addItem("start-debugger", start);
    this.toolbar.addItem("stop-debugger", stop);

    this.breakpointsView = ReactWidget.create(
      <BreakpointsComponent activeCellChanged={this.activeCellChanged} breakpointChanged={this.breakpointChanged} />
    );

    let layout = new PanelLayout();
    layout.addWidget(this.toolbar);
    layout.addWidget(this.breakpointsView);

    this.layout = layout;
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
    // TODO: retrieve the breakpoints from the cell or StateDB
    this.activeCellChanged.emit([]);
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

  get activeCell(): Cell | null {
    return this._tracker.activeCell;
  }

  readonly breakpointChanged = new Signal<this, IBreakpointEvent>(this);
  readonly activeCellChanged = new Signal<this, IBreakpoint[]>(this);
  readonly toolbar: Toolbar<Widget>;
  readonly breakpointsView: ReactWidget;

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
