import { BoundPorts } from "./bound-ports";
import { Port } from "./port";
import { PortClient } from "./port-client";
export declare class PortBinder {
  private readonly portClient;
  constructor(portClient?: PortClient);
  bind(ports: Port[]): Promise<BoundPorts>;
}
