import { ToolbarButtonComponent } from '@jupyterlab/apputils';

import * as React from 'react';

import {
  BreakpointsComponent
} from './breakpoints';

import { Debugger } from '../debugger';

const DEBUGGER_HEADER_CLASS = "jp-Debugger-header";

interface IDebuggerProps {
  debugger: Debugger;
}

interface IDebuggerState { }

export class DebuggerComponent extends React.Component<IDebuggerProps, IDebuggerState> {
  constructor(props: IDebuggerProps) {
    super(props);
  }

  render() {
    const { activeCellChanged, breakpointChanged } = this.props.debugger;
    return (
      <>
        <div className={DEBUGGER_HEADER_CLASS}>
          <h2>Debug</h2>
          <ToolbarButtonComponent
            tooltip="Start Debugger"
            iconClassName="jp-BugIcon"
            onClick={() => {
              console.log("Start Debugger");
            }}
          />
          <ToolbarButtonComponent
            tooltip="Stop Debugger"
            iconClassName="jp-StopIcon"
            onClick={() => {
              console.log("Stop Debugger");
            }}
          />
        </div>
        <BreakpointsComponent activeCellChanged={activeCellChanged} breakpointChanged={breakpointChanged} />
      </>
    )
  }
}
