import { Log, WaitStrategy } from "./wait-strategy";
export declare class Wait {
  static forLogMessage(message: Log): WaitStrategy;
  static forHealthCheck(): WaitStrategy;
}
