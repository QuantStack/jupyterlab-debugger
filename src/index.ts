import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  INotebookTracker
} from "@jupyterlab/notebook";

// import {
//   Widget
// } from '@phosphor/widgets';

import '../style/index.css';


/**
 * Initialization data for the jupyterlab-debugger extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-debugger',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension jupyterlab-debugger is activated!');

    notebookTracker.widgetAdded.connect((sender, widget) => {
      let notebookPanel = widget;
      let toolbar = notebookPanel.toolbar;
      let notebook = notebookPanel.content;
      let kernel = notebookPanel.session.kernel;

      // Create a single widget
      let debugButton: ToolbarButton = new ToolbarButton({
        iconClassName: 'jp-BugIcon jp-Icon jp-Icon-16',
        onClick: async () => {
          console.log('Send requestDebug')
          // let future = notebookPanel.session.kernel.requestDebug({seq: 0, type: 'request', command: 'attach'});
          // await future.done;
        },
        tooltip: 'Start Debugging'
      });

      console.log('Added notebook');
      console.log(notebookPanel);
      console.log(toolbar);
      console.log(notebook);
      console.log(kernel);

      toolbar.insertItem(0, 'Debugger', debugButton);
    });
  }
};

export default extension;
