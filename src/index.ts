import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  INotebookTracker
} from "@jupyterlab/notebook";

import {
  Debugger
} from './widget';

import '../style/index.css';

/**
 * Initialization data for the jupyterlab-debugger extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-debugger',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    let widget = new Debugger({ tracker });
    widget.id = "jp-debugger";
    widget.title.iconClass = "jp-SideBar-tabIcon jp-BugIcon";
    widget.title.caption = "Debugger";
    app.shell.add(widget, "left");
  }
};

export default extension;
