import React from "react";

import { DEBUGGER_HEADER_CLASS } from "./constants";
import { DebugProtocol } from "../debugger/debugProtocol";

const DEBUGGER_VARIABLES_LIST_CLASS = "jp-Debugger-variableList";
const DEBUGGER_VARIABLE_ITEM_VALUE_CLASS = "jp-Debugger-variableItem-name";
const DEBUGGER_VARIABLE_ITEM_NAME_CLASS = "jp-Debugger-variableItem-value";

interface IVariableProps {
  name: string;
  value: string;
}

interface IVariablesProps {
  // TODO: handle scopes
  variables: DebugProtocol.Variable[];
}

function Variable(props: IVariableProps) {
  return (
    <li>
      <span className={DEBUGGER_VARIABLE_ITEM_NAME_CLASS} title="Name">
        {props.name}
      </span>
      <span className={DEBUGGER_VARIABLE_ITEM_VALUE_CLASS} title="Value">
        {props.value}
      </span>
    </li>
  );
}

export function VariablesComponent(props: IVariablesProps) {
  return (
    <>
      <div className={DEBUGGER_HEADER_CLASS}>
        <h2>Variables</h2>
      </div>
      <ul className={DEBUGGER_VARIABLES_LIST_CLASS}>
        {props.variables.map((variable, i) => (
          <Variable key={i} name={variable.name} value={variable.value} />
        ))}
      </ul>
    </>
  );
}
