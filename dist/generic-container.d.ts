import { HostConfig } from "dockerode";
import { Duration } from "node-duration";
import {
  BindMode,
  BuildContext,
  Command,
  ContainerName,
  Dir,
  EnvKey,
  EnvValue,
  HealthCheck,
  NetworkMode,
  TmpFs
} from "./docker-client";
import { DockerClientFactory } from "./docker-client-factory";
import { Port } from "./port";
import { Image, Tag } from "./repo-tag";
import { StartedTestContainer, TestContainer } from "./test-container";
import { Uuid } from "./uuid";
import { WaitStrategy } from "./wait-strategy";
export declare class GenericContainerBuilder {
  private readonly context;
  private readonly uuid;
  private readonly dockerClientFactory;
  private buildArgs;
  constructor(context: BuildContext, uuid?: Uuid, dockerClientFactory?: DockerClientFactory);
  withBuildArg(key: string, value: string): GenericContainerBuilder;
  build(): Promise<GenericContainer>;
}
export declare class GenericContainer implements TestContainer {
  readonly image: Image;
  readonly tag: Tag;
  readonly dockerClientFactory: DockerClientFactory;
  static fromDockerfile(context: BuildContext): GenericContainerBuilder;
  private readonly repoTag;
  private readonly dockerClient;
  private env;
  private networkMode?;
  private ports;
  private cmd;
  private bindMounts;
  private name?;
  private tmpFs;
  private healthCheck?;
  private waitStrategy?;
  private startupTimeout;
  private additionalHostConfig?;
  constructor(image: Image, tag?: Tag, dockerClientFactory?: DockerClientFactory);
  start(): Promise<StartedTestContainer>;
  withCmd(cmd: Command[]): this;
  withName(name: ContainerName): this;
  withEnv(key: EnvKey, value: EnvValue): this;
  withTmpFs(tmpFs: TmpFs): this;
  withNetworkMode(networkMode: NetworkMode): this;
  withExposedPorts(...ports: Port[]): this;
  withBindMount(source: Dir, target: Dir, bindMode?: BindMode): this;
  withHealthCheck(healthCheck: HealthCheck): this;
  withStartupTimeout(startupTimeout: Duration): this;
  withWaitStrategy(waitStrategy: WaitStrategy): this;
  withAdditionalHostConfig(additionalHostConfig: Partial<HostConfig>): this;
  hasRepoTagLocally(): Promise<boolean>;
  private waitForContainer;
  private getWaitStrategy;
}
