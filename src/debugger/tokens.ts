import { Token } from '@phosphor/coreutils';
import { Signal } from '@phosphor/signaling';

import { IDebugSession, IBreakpoint } from './session';

export const IDebugger = new Token<IDebugger>('jupyterlab-debugger');

export interface IDebugger {
    debugSession: IDebugSession;
    breakpointChanged: Signal<this, IBreakpoint[]>;
    activeCellChanged: Signal<this, IBreakpoint[]>;
}
