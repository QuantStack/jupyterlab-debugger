import { Widget, PanelLayout } from "@phosphor/widgets";
import { INotebookTracker } from "@jupyterlab/notebook";
import { Toolbar, ToolbarButton } from "@jupyterlab/apputils";

const DEBUGGER_WIDGET_CLASS = "jp-Debugger";

export class Debugger extends Widget {
  constructor(options: Debugger.IOptions) {
    super();
    this.addClass(DEBUGGER_WIDGET_CLASS);

    this._tracker = options.tracker;

    this.toolbar = new Toolbar<Widget>();
    let start = new ToolbarButton({
      iconClassName: "jp-BugIcon",
      onClick: async () => {
        const widget = this._tracker.currentWidget;
        if (!widget) {
          return;
        }
        // const kernel = widget.context.session.kernel;
        // kernel.sendControlMessage();
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
        // const kernel = widget.context.session.kernel;
        // kernel.sendControlMessage();
        console.log("Stop Debugger");
      },
      tooltip: "Stop Debugger"
    });

    this.toolbar.addItem("start-debugger", start);
    this.toolbar.addItem("stop-debugger", stop);

    let layout = new PanelLayout();
    layout.addWidget(this.toolbar);

    this.layout = layout;
  }

  readonly toolbar: Toolbar<Widget>;
  private _tracker: INotebookTracker;
}

export namespace Debugger {
  export interface IOptions {
    tracker: INotebookTracker;
  }
}