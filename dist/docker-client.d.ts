import Dockerode, { HostConfig } from "dockerode";
import { Duration } from "node-duration";
import { BoundPorts } from "./bound-ports";
import { Container } from "./container";
import { Host } from "./docker-client-factory";
import { RepoTag } from "./repo-tag";
export declare type Command = string;
export declare type ContainerName = string;
export declare type NetworkMode = string;
export declare type ExitCode = number;
export declare type EnvKey = string;
export declare type EnvValue = string;
export declare type Env = { [key in EnvKey]: EnvValue };
export declare type Dir = string;
export declare type TmpFs = { [dir in Dir]: Dir };
export declare type HealthCheck = {
  test: string;
  interval?: Duration;
  timeout?: Duration;
  retries?: number;
  startPeriod?: Duration;
};
export declare type BuildContext = string;
export declare type BuildArgs = { [key in EnvKey]: EnvValue };
export declare type StreamOutput = string;
export declare type ExecResult = {
  output: StreamOutput;
  exitCode: ExitCode;
};
export declare type BindMode = "rw" | "ro";
export declare type BindMount = {
  source: Dir;
  target: Dir;
  bindMode: BindMode;
};
declare type CreateOptions = {
  repoTag: RepoTag;
  env: Env;
  cmd: Command[];
  bindMounts: BindMount[];
  tmpFs: TmpFs;
  boundPorts: BoundPorts;
  name?: ContainerName;
  networkMode?: NetworkMode;
  healthCheck?: HealthCheck;
  additionalHostConfig?: Partial<HostConfig>;
};
export interface DockerClient {
  pull(repoTag: RepoTag): Promise<void>;
  create(options: CreateOptions): Promise<Container>;
  start(container: Container): Promise<void>;
  exec(container: Container, command: Command[]): Promise<ExecResult>;
  buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void>;
  fetchRepoTags(): Promise<RepoTag[]>;
  getHost(): Host;
}
export declare class DockerodeClient implements DockerClient {
  private readonly host;
  private readonly dockerode;
  constructor(host: Host, dockerode: Dockerode);
  pull(repoTag: RepoTag): Promise<void>;
  create(options: CreateOptions): Promise<Container>;
  start(container: Container): Promise<void>;
  exec(container: Container, command: Command[]): Promise<ExecResult>;
  buildImage(repoTag: RepoTag, context: BuildContext, buildArgs: BuildArgs): Promise<void>;
  fetchRepoTags(): Promise<RepoTag[]>;
  getHost(): Host;
  private isDanglingImage;
  private getEnv;
  private getHealthCheck;
  private toNanos;
  private getExposedPorts;
  private getPortBindings;
  private getBindMounts;
}
export {};
