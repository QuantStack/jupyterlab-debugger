import { ToolbarButtonComponent } from '@jupyterlab/apputils';

import * as React from 'react';

import {
  BreakpointsComponent
} from './breakpoints';

import { Debugger } from '../debugger/main';

const DEBUGGER_HEADER_CLASS = "jp-Debugger-header";

interface IDebuggerProps {
  debugger: Debugger;
}

interface IDebuggerState {
  started: boolean;
}

export class DebuggerComponent extends React.Component<IDebuggerProps, IDebuggerState> {
  constructor(props: IDebuggerProps) {
    super(props);
    this.state = {
      started: false
    }
  }

  startDebugger = async () => {
    const { debugSession } = this.props.debugger;
    console.log("Start Debugger");
    await debugSession.start();
    this.setState({
      started: debugSession.started
    })
  }

  stopDebugger = async () => {
    const { debugSession } = this.props.debugger;
    console.log("Stop Debugger");
    await debugSession.stop();
    this.setState({
      started: debugSession.started
    })
  }

  render() {
    const { activeCellChanged, breakpointChanged } = this.props.debugger;
    return (
      <>
        <div className={DEBUGGER_HEADER_CLASS}>
          <h2>Debug</h2>
          <ToolbarButtonComponent
            enabled={!this.state.started}
            tooltip="Start Debugger"
            iconClassName="jp-BugIcon"
            onClick={this.startDebugger}
          />
          <ToolbarButtonComponent
            enabled={this.state.started}
            tooltip="Stop Debugger"
            iconClassName="jp-StopIcon"
            onClick={this.stopDebugger}
          />
        </div>
        <BreakpointsComponent activeCellChanged={activeCellChanged} breakpointChanged={breakpointChanged} />
      </>
    )
  }
}
