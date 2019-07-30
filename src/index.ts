import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from "@jupyterlab/application";

import { INotebookTracker } from "@jupyterlab/notebook";

import { DebuggerPanel } from "./widget";

import "../style/index.css";

/**
 * Initialization data for the jupyterlab-debugger extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-debugger",
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ILabShell],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    labShell: ILabShell
  ) => {
    let widget = new DebuggerPanel({ tracker });
    widget.id = "jp-debugger";
    widget.title.iconClass = "jp-SideBar-tabIcon jp-BugIcon";
    widget.title.caption = "Debugger";

    labShell.currentChanged.connect(() => {
      if (tracker.size) {
        if (!widget.isAttached) {
          labShell.add(widget, "left");
        }
        return;
      }
      return widget.close();
    });
  }
};

export default extension;
