import { HostConfig } from "dockerode";
import { Duration, TemporalUnit } from "node-duration";
import { BoundPorts } from "./bound-ports";
import { Container, Id as ContainerId } from "./container";
import { ContainerState } from "./container-state";
import {
  BindMode,
  BindMount,
  BuildArgs,
  BuildContext,
  Command,
  ContainerName,
  Dir,
  DockerClient,
  Env,
  EnvKey,
  EnvValue,
  ExecResult,
  HealthCheck,
  NetworkMode,
  TmpFs
} from "./docker-client";
import { DockerClientFactory, DockerodeClientFactory, Host } from "./docker-client-factory";
import log from "./logger";
import { Port } from "./port";
import { PortBinder } from "./port-binder";
import { HostPortCheck, InternalPortCheck } from "./port-check";
import { Image, RepoTag, Tag } from "./repo-tag";
import {
  DEFAULT_STOP_OPTIONS,
  OptionalStopOptions,
  StartedTestContainer,
  StoppedTestContainer,
  TestContainer
} from "./test-container";
import { RandomUuid, Uuid } from "./uuid";
import { HostPortWaitStrategy, WaitStrategy } from "./wait-strategy";

export class GenericContainerBuilder {
  private buildArgs: BuildArgs = {};

  constructor(
    private readonly context: BuildContext,
    private readonly uuid: Uuid = new RandomUuid(),
    private readonly dockerClientFactory: DockerClientFactory = new DockerodeClientFactory()
  ) {}

  public withBuildArg(key: string, value: string): GenericContainerBuilder {
    this.buildArgs[key] = value;
    return this;
  }

  public async build(): Promise<GenericContainer> {
    const image = this.uuid.nextUuid();
    const tag = this.uuid.nextUuid();

    const repoTag = new RepoTag(image, tag);
    const dockerClient = this.dockerClientFactory.getClient();
    await dockerClient.buildImage(repoTag, this.context, this.buildArgs);
    const container = new GenericContainer(image, tag, this.dockerClientFactory);

    if (!(await container.hasRepoTagLocally())) {
      throw new Error("Failed to build image");
    }

    return Promise.resolve(container);
  }
}

export class GenericContainer implements TestContainer {
  public static fromDockerfile(context: BuildContext): GenericContainerBuilder {
    return new GenericContainerBuilder(context);
  }

  private readonly repoTag: RepoTag;
  private readonly dockerClient: DockerClient;

  private env: Env = {};
  private networkMode?: NetworkMode;
  private ports: Port[] = [];
  private cmd: Command[] = [];
  private bindMounts: BindMount[] = [];
  private name?: ContainerName;
  private tmpFs: TmpFs = {};
  private healthCheck?: HealthCheck;
  private waitStrategy?: WaitStrategy;
  private startupTimeout: Duration = new Duration(60_000, TemporalUnit.MILLISECONDS);
  private additionalHostConfig?: Partial<HostConfig>;

  constructor(
    readonly image: Image,
    readonly tag: Tag = "latest",
    readonly dockerClientFactory: DockerClientFactory = new DockerodeClientFactory()
  ) {
    this.repoTag = new RepoTag(image, tag);
    this.dockerClient = dockerClientFactory.getClient();
  }

  public async start(): Promise<StartedTestContainer> {
    if (!(await this.hasRepoTagLocally())) {
      await this.dockerClient.pull(this.repoTag);
    }

    const boundPorts = await new PortBinder().bind(this.ports);
    const container = await this.dockerClient.create({
      repoTag: this.repoTag,
      env: this.env,
      cmd: this.cmd,
      bindMounts: this.bindMounts,
      tmpFs: this.tmpFs,
      boundPorts,
      name: this.name,
      networkMode: this.networkMode,
      healthCheck: this.healthCheck,
      additionalHostConfig: this.additionalHostConfig
    });
    await this.dockerClient.start(container);
    const inspectResult = await container.inspect();
    const containerState = new ContainerState(inspectResult);
    await this.waitForContainer(container, containerState, boundPorts);

    return new StartedGenericContainer(
      container,
      this.dockerClient.getHost(),
      boundPorts,
      inspectResult.name,
      this.dockerClient
    );
  }

  public withCmd(cmd: Command[]): this {
    this.cmd = cmd;
    return this;
  }

  public withName(name: ContainerName): this {
    this.name = name;
    return this;
  }

  public withEnv(key: EnvKey, value: EnvValue): this {
    this.env[key] = value;
    return this;
  }

  public withTmpFs(tmpFs: TmpFs): this {
    this.tmpFs = tmpFs;
    return this;
  }

  public withNetworkMode(networkMode: NetworkMode): this {
    this.networkMode = networkMode;
    return this;
  }

  public withExposedPorts(...ports: Port[]): this {
    this.ports = ports;
    return this;
  }

  public withBindMount(source: Dir, target: Dir, bindMode: BindMode = "rw"): this {
    this.bindMounts.push({ source, target, bindMode });
    return this;
  }

  public withHealthCheck(healthCheck: HealthCheck): this {
    this.healthCheck = healthCheck;
    return this;
  }

  public withStartupTimeout(startupTimeout: Duration): this {
    this.startupTimeout = startupTimeout;
    return this;
  }

  public withWaitStrategy(waitStrategy: WaitStrategy): this {
    this.waitStrategy = waitStrategy;
    return this;
  }

  public withAdditionalHostConfig(additionalHostConfig: Partial<HostConfig>): this {
    this.additionalHostConfig = additionalHostConfig;
    return this;
  }

  public async hasRepoTagLocally(): Promise<boolean> {
    const repoTags = await this.dockerClient.fetchRepoTags();
    return repoTags.some(repoTag => repoTag.equals(this.repoTag));
  }

  private async waitForContainer(
    container: Container,
    containerState: ContainerState,
    boundPorts: BoundPorts
  ): Promise<void> {
    log.debug("Waiting for container to be ready");
    const waitStrategy = this.getWaitStrategy(container);
    await waitStrategy.withStartupTimeout(this.startupTimeout).waitUntilReady(container, containerState, boundPorts);
    log.debug("Container is ready");
  }

  private getWaitStrategy(container: Container): WaitStrategy {
    if (this.waitStrategy) {
      return this.waitStrategy;
    }
    const hostPortCheck = new HostPortCheck(this.dockerClient.getHost());
    const internalPortCheck = new InternalPortCheck(container, this.dockerClient);
    return new HostPortWaitStrategy(this.dockerClient, hostPortCheck, internalPortCheck);
  }
}

class StartedGenericContainer implements StartedTestContainer {
  constructor(
    private readonly container: Container,
    private readonly host: Host,
    private readonly boundPorts: BoundPorts,
    private readonly name: ContainerName,
    private readonly dockerClient: DockerClient
  ) {}

  public async stop(options: OptionalStopOptions = {}): Promise<StoppedTestContainer> {
    const resolvedOptions = { ...DEFAULT_STOP_OPTIONS, ...options };
    await this.container.stop({ timeout: resolvedOptions.timeout });
    await this.container.remove({ removeVolumes: resolvedOptions.removeVolumes });
    return new StoppedGenericContainer();
  }

  public getContainerIpAddress(): Host {
    return this.host;
  }

  public getMappedPort(port: Port): Port {
    return this.boundPorts.getBinding(port);
  }

  public getId(): ContainerId {
    return this.container.getId();
  }

  public getName(): ContainerName {
    return this.name;
  }

  public exec(command: Command[]): Promise<ExecResult> {
    return this.dockerClient.exec(this.container, command);
  }
}

class StoppedGenericContainer implements StoppedTestContainer {}
