import { ReactWidget } from "@jupyterlab/apputils";
import { INotebookTracker } from "@jupyterlab/notebook";
import { Widget, PanelLayout } from "@phosphor/widgets";

import * as React from "react";

import { Debugger } from "./debugger/main";

import { DebuggerComponent } from "./components/debugger";

const DEBUGGER_WIDGET_CLASS = "jp-Debugger";

export class DebuggerPanel extends Widget {
  constructor(options: Debugger.IOptions) {
    super();
    this.addClass(DEBUGGER_WIDGET_CLASS);

    const { tracker } = options;
    this.debugger = new Debugger({ tracker });
    const debuggerComponent = ReactWidget.create(
      <DebuggerComponent debugger={this.debugger} />
    );

    let layout = new PanelLayout();
    layout.addWidget(debuggerComponent);

    this.layout = layout;
  }

  readonly debugger: Debugger;
}

export namespace Debugger {
  export interface IOptions {
    tracker: INotebookTracker;
  }
}
