import { Observable } from './observable';
type Delay = number | `${number}s` | `${number}ms`;
declare function withDelay(obs: Observable<any>, delay: Delay, callback: () => void): void;
declare function clearDelay(obs: Observable<any>): void;
export type { Delay };
export { clearDelay, withDelay };
