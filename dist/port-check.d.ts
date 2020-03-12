import { Container } from "./container";
import { DockerClient } from "./docker-client";
import { Host } from "./docker-client-factory";
import { Port } from "./port";
export interface PortCheck {
  isBound(port: Port): Promise<boolean>;
}
export declare class HostPortCheck implements PortCheck {
  private readonly host;
  constructor(host: Host);
  isBound(port: Port): Promise<boolean>;
}
export declare class InternalPortCheck implements PortCheck {
  private readonly container;
  private readonly dockerClient;
  constructor(container: Container, dockerClient: DockerClient);
  isBound(port: Port): Promise<boolean>;
}
