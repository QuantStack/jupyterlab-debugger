import React from "react";

import { DEBUGGER_HEADER_CLASS } from "./constants";

interface IVariablesProps {}

export function VariablesComponent(props: IVariablesProps) {
  return (
    <>
      <div className={DEBUGGER_HEADER_CLASS}>
        <h2>Variables</h2>
      </div>
    </>
  );
}
