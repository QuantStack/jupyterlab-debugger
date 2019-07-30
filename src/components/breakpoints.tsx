import { ToolbarButtonComponent } from "@jupyterlab/apputils";

import * as React from "react";

import { IDebugSession } from "../debugger/session";

// Breakpoint section: header and general icons
const DEBUGGER_HEADER_CLASS = "jp-Debugger-header";
const DEBUGGER_BREAKPOINTS_REMOVE_ICON_CLASS = "jp-CloseIcon";
const DEBUGGER_BREAKPOINTS_DISABLE_ICON_CLASS = "jp-Debugger-DisableIcon";

// Breakpoint list
const DEBUGGER_BREAKPOINTS_LIST_CLASS = "jp-Debugger-breakpointList";

// Breakpoint items
const DEBUGGER_BREAKPOINT_ITEM_CLASS = "jp-Debugger-breakpointItem";
const DEBUGGER_BREAKPOINT_ITEM_ENABLED_CLASS =
  "jp-Debugger-breakpointItem-enabled";
const DEBUGGER_BREAKPOINT_ITEM_LABEL_CLASS = "jp-Debugger-breakpointItem-label";
const DEBUGGER_BREAKPOINT_ITEM_LINE_CLASS = "jp-Debugger-breakpointItem-line";

interface IBreakpointProps {
  text: string;
  line: number;
}

interface IBreakpointState {}

interface IBreakpointListProps {
  breakpoints: IBreakpointProps[];
}

interface IBreakpointsProps {
  debugSession: IDebugSession;
  breakpoints?: IBreakpointProps[];
}

interface IBreakpointsState {}

class Breakpoint extends React.Component<IBreakpointProps, IBreakpointState> {
  constructor(props: IBreakpointProps) {
    super(props);
  }

  render() {
    return (
      <li className={DEBUGGER_BREAKPOINT_ITEM_CLASS}>
        <ToolbarButtonComponent
          // TODO: replace by a checkbox?
          tooltip="Enable / Disable"
          iconClassName={DEBUGGER_BREAKPOINT_ITEM_ENABLED_CLASS}
          onClick={() => console.log("enable / disable individual breakpoint")}
        />
        <span
          className={DEBUGGER_BREAKPOINT_ITEM_LABEL_CLASS}
          title="Cell Text"
        >
          {this.props.text}
        </span>
        <span className={DEBUGGER_BREAKPOINT_ITEM_LINE_CLASS} title="Cell Line">
          {this.props.line}
        </span>
      </li>
    );
  }
}

function BreakpointsListView(props: IBreakpointListProps) {
  const { breakpoints } = props;
  return (
    <ul className={DEBUGGER_BREAKPOINTS_LIST_CLASS}>
      {breakpoints.map((props, i) => (
        <Breakpoint key={i} {...props} />
      ))}
    </ul>
  );
}

export class BreakpointsComponent extends React.Component<
  IBreakpointsProps,
  IBreakpointsState
> {
  constructor(props: IBreakpointsProps) {
    super(props);
    this.state = {
      breakpoints: props.breakpoints || []
    };
  }

  render() {
    return (
      <>
        <div className={DEBUGGER_HEADER_CLASS}>
          <h2>Breakpoints</h2>
          <ToolbarButtonComponent
            enabled={this.props.breakpoints.length > 0}
            tooltip="Disable All Breakpoints"
            iconClassName={DEBUGGER_BREAKPOINTS_DISABLE_ICON_CLASS}
            onClick={() => {
              console.log("Disable all breakpoints");
            }}
          />
          <ToolbarButtonComponent
            enabled={this.props.breakpoints.length > 0}
            tooltip="Remove All Breakpoints"
            iconClassName={DEBUGGER_BREAKPOINTS_REMOVE_ICON_CLASS}
            onClick={() => {
              console.log("Remove all breakpoints");
            }}
          />
        </div>
        <BreakpointsListView breakpoints={this.props.breakpoints} />
      </>
    );
  }
}
