import { Duration } from "node-duration";
import { BoundPorts } from "./bound-ports";
import { Container } from "./container";
import { ContainerState } from "./container-state";
import { DockerClient } from "./docker-client";
import { PortCheck } from "./port-check";
export interface WaitStrategy {
  waitUntilReady(container: Container, containerState: ContainerState, boundPorts: BoundPorts): Promise<void>;
  withStartupTimeout(startupTimeout: Duration): WaitStrategy;
}
declare abstract class AbstractWaitStrategy implements WaitStrategy {
  protected startupTimeout: Duration;
  abstract waitUntilReady(container: Container, containerState: ContainerState, boundPorts: BoundPorts): Promise<void>;
  withStartupTimeout(startupTimeout: Duration): WaitStrategy;
}
export declare class HostPortWaitStrategy extends AbstractWaitStrategy {
  private readonly dockerClient;
  private readonly hostPortCheck;
  private readonly internalPortCheck;
  constructor(dockerClient: DockerClient, hostPortCheck: PortCheck, internalPortCheck: PortCheck);
  waitUntilReady(container: Container, containerState: ContainerState, boundPorts: BoundPorts): Promise<void>;
  private waitForHostPorts;
  private waitForInternalPorts;
  private waitForPort;
}
export declare type Log = string;
export declare class LogWaitStrategy extends AbstractWaitStrategy {
  private readonly message;
  constructor(message: Log);
  waitUntilReady(container: Container): Promise<void>;
}
export declare class HealthCheckWaitStrategy extends AbstractWaitStrategy {
  waitUntilReady(container: Container): Promise<void>;
}
export {};
