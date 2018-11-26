// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as colors from 'colors';
import * as os from 'os';
import * as path from 'path';

import { CommandLineParser, CommandLineFlagParameter, CommandLineAction } from '@microsoft/ts-command-line';

import { RushConfiguration } from '../api/RushConfiguration';
import { RushConstants } from '../logic/RushConstants';
import { CommandLineConfiguration } from '../api/CommandLineConfiguration';
import { Utilities } from '../utilities/Utilities';
import { BaseScriptAction } from '../cli/scriptActions/BaseScriptAction';

import { AddAction } from './actions/AddAction';
import { ChangeAction } from './actions/ChangeAction';
import { CheckAction } from './actions/CheckAction';
import { UpdateAction } from './actions/UpdateAction';
import { InstallAction } from './actions/InstallAction';
import { InitAction } from './actions/InitAction';
import { LinkAction } from './actions/LinkAction';
import { PublishAction } from './actions/PublishAction';
import { PurgeAction } from './actions/PurgeAction';
import { UnlinkAction } from './actions/UnlinkAction';
import { ScanAction } from './actions/ScanAction';
import { VersionAction } from './actions/VersionAction';

import { BulkScriptAction } from './scriptActions/BulkScriptAction';
import { GlobalScriptAction } from './scriptActions/GlobalScriptAction';

import { Telemetry } from '../logic/Telemetry';
import { AlreadyReportedError } from '../utilities/AlreadyReportedError';
import { RushGlobalFolder } from '../api/RushGlobalFolder';

export class RushCommandLineParser extends CommandLineParser {
  public telemetry: Telemetry | undefined;
  public rushConfiguration: RushConfiguration;
  public rushGlobalFolder: RushGlobalFolder;

  private _debugParameter: CommandLineFlagParameter;

  constructor() {
    super({
      toolFilename: 'rush',
      toolDescription: 'Rush makes life easier for JavaScript developers who develop, build, and publish'
        + ' many packages from a central Git repo.  It is designed to handle very large repositories'
        + ' supporting many projects and people.  Rush provides policies, protections, and customizations'
        + ' that help coordinate teams and safely onboard new contributors.  Rush also generates change logs'
        + ' and automates package publishing.  It can manage decoupled subsets of projects with different'
        + ' release and versioning strategies.  A full API is included to facilitate integration with other'
        + ' automation tools.  If you are looking for a proven turnkey solution for monorepo management,'
        + ' Rush is for you.'
    });
    this._populateActions();
  }

  public get isDebug(): boolean {
    return this._debugParameter.value;
  }

  public flushTelemetry(): void {
    if (this.telemetry) {
      this.telemetry.flush();
    }
  }

  protected onDefineParameters(): void {
    this._debugParameter = this.defineFlagParameter({
      parameterLongName: '--debug',
      parameterShortName: '-d',
      description: 'Show the full call stack if an error occurs while executing the tool'
    });
  }

  protected onExecute(): Promise<void> {
    // Defensively set the exit code to 1 so if Rush crashes for whatever reason, we'll have a nonzero exit code.
    // For example, NodeJS currently has the inexcusable design of terminating with zero exit code when
    // there is an uncaught promise exception.  This will supposedly be fixed in NodeJS 9.
    // Ideally we should do this for all the Rush actions, but "rush build" is the most critical one
    // -- if it falsely appears to succeed, we could merge bad PRs, publish empty packages, etc.
    process.exitCode = 1;

    return this._wrapOnExecute().catch((error: Error) => {
      this._reportErrorAndSetExitCode(error);
    }).then(() => {
      // If we make it here, everything went fine, so reset the exit code back to 0
      process.exitCode = 0;
    });
  }

  private _wrapOnExecute(): Promise<void> {
    try {
      if (this.rushConfiguration) {
        this.telemetry = new Telemetry(this.rushConfiguration);
      }
      return super.onExecute().then(() => {
        if (this.telemetry) {
          this.flushTelemetry();
        }
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private _populateActions(): void {
    try {
      const rushJsonFilename: string | undefined = RushConfiguration.tryFindRushJsonLocation();
      if (rushJsonFilename) {
        this.rushConfiguration = RushConfiguration.loadFromConfigurationFile(rushJsonFilename);
      }

      this.rushGlobalFolder = new RushGlobalFolder();

      this.addAction(new AddAction(this));
      this.addAction(new ChangeAction(this));
      this.addAction(new CheckAction(this));
      this.addAction(new InstallAction(this));
      this.addAction(new InitAction(this));
      this.addAction(new LinkAction(this));
      this.addAction(new PublishAction(this));
      this.addAction(new PurgeAction(this));
      this.addAction(new ScanAction(this));
      this.addAction(new UpdateAction(this));
      this.addAction(new UnlinkAction(this));
      this.addAction(new VersionAction(this));

      this._populateScriptActions();

    } catch (error) {
      this._reportErrorAndSetExitCode(error);
    }
  }

  private _populateScriptActions(): void {
    let commandLineConfiguration: CommandLineConfiguration | undefined = undefined;

    // If there is not a rush.json file, we still want "build" and "rebuild" to appear in the
    // command-line help
    if (this.rushConfiguration) {
      const commandLineConfigFile: string = path.join(
        this.rushConfiguration.commonRushConfigFolder, RushConstants.commandLineFilename
      );

      commandLineConfiguration = CommandLineConfiguration.loadFromFileOrDefault(commandLineConfigFile);
    }

    // always create a build and a rebuild command
    this.addAction(new BulkScriptAction({
      actionName: 'build',
      summary: '(EXPERIMENTAL) Build all projects that haven\'t been built, or have changed since they were last '
        + 'built.',
      documentation: 'This command is similar to "rush rebuild", except that "rush build" performs'
        + ' an incremental build. In other words, it only builds projects whose source files have'
        + ' changed since the last successful build. The analysis requires a Git working tree, and'
        + ' only considers source files that are tracked by Git and whose path is under the project folder.'
        + ' (For more details about this algorithm, see the documentation for the "package-deps-hash"'
        + ' NPM package.) The incremental build state is tracked in a file "package-deps.json" which should'
        + ' NOT be added to Git.  The build command is tracked by the "arguments" field in this JSON file;'
        + ' a full rebuild is forced whenever the command has changed (e.g. "--production" or not).',
      parser: this,
      commandLineConfiguration: commandLineConfiguration,

      enableParallelism: true,
      ignoreMissingScript: false
    }));

    this.addAction(new BulkScriptAction({
      actionName: 'rebuild',
      summary: 'Clean and rebuild the entire set of projects',
      documentation: 'This command assumes that the package.json file for each project contains'
        + ' a "scripts" entry for "npm run build" that performs a full clean build.'
        + ' Rush invokes this script to build each project that is registered in rush.json.'
        + ' Projects are built in parallel where possible, but always respecting the dependency'
        + ' graph for locally linked projects.  The number of simultaneous processes will be'
        + ' based on the number of machine cores unless overridden by the --parallelism flag.'
        + ' (For an incremental build, see "rush build" instead of "rush rebuild".)',
      parser: this,
      commandLineConfiguration: commandLineConfiguration,

      enableParallelism: true,
      ignoreMissingScript: false
    }));

    if (!commandLineConfiguration) {
      // If there is not a rush.json file, so don't attempt to define custom commands/parameters
      return;
    }

    // Register each custom command
    for (const command of commandLineConfiguration.commands) {
      if (this.tryGetAction(command.name)) {
        throw new Error(`${RushConstants.commandLineFilename} defines a command "${command.name}"`
          + ` using a name that already exists`);
      }

      switch (command.commandKind) {
        case 'bulk':
          this.addAction(new BulkScriptAction({
            actionName: command.name,
            summary: command.summary,
            documentation: command.description || command.summary,
            safeForSimultaneousRushProcesses: command.safeForSimultaneousRushProcesses,

            parser: this,
            commandLineConfiguration: commandLineConfiguration,

            enableParallelism: command.enableParallelism,
            ignoreMissingScript: command.ignoreMissingScript || false
          }));
          break;
        case 'global':
          this.addAction(new GlobalScriptAction({
            actionName: command.name,
            summary: command.summary,
            documentation: command.description || command.summary,
            safeForSimultaneousRushProcesses: command.safeForSimultaneousRushProcesses,

            parser: this,
            commandLineConfiguration: commandLineConfiguration,

            shellCommand: command.shellCommand
          }));
          break;
        default:
          throw new Error(`${RushConstants.commandLineFilename} defines a command "${command!.name}"`
            + ` using an unsupported command kind "${command!.commandKind}"`);
      }
    }

    // Check for any invalid associations
    for (const parameter of commandLineConfiguration.parameters) {
      for (const associatedCommand of parameter.associatedCommands) {
        const action: CommandLineAction | undefined = this.tryGetAction(associatedCommand);
        if (!action) {
          throw new Error(`${RushConstants.commandLineFilename} defines a parameter "${parameter.longName}"`
            + ` that is associated with a nonexistent command "${associatedCommand}"`);
        }
        if (!(action instanceof BaseScriptAction)) {
          throw new Error(`${RushConstants.commandLineFilename} defines a parameter "${parameter.longName}"`
            + ` that is associated with a command "${associatedCommand}", but that command does not`
            + ` support custom parameters`);
        }
      }
    }
  }

  private _reportErrorAndSetExitCode(error: Error): void {
    if (!(error instanceof AlreadyReportedError)) {
      const prefix: string = 'ERROR: ';
      console.error(os.EOL + colors.red(Utilities.wrapWords(prefix + error.message)));
    }

    if (this._debugParameter.value) {
      // If catchSyncErrors() called this, then show a call stack similar to what NodeJS
      // would show for an uncaught error
      console.error(os.EOL + error.stack);
    }

    this.flushTelemetry();

    // Ideally we want to eliminate all calls to process.exit() from our code, and replace them
    // with normal control flow that properly cleans up its data structures.
    // For this particular call, we have a problem that the RushCommandLineParser constructor
    // performs nontrivial work that can throw an exception.  Either the Rush class would need
    // to handle reporting for those exceptions, or else _populateActions() should be moved
    // to a RushCommandLineParser lifecycle stage that can handle it.
    if (process.exitCode > 0) {
      process.exit(process.exitCode);
    } else {
      process.exit(1);
    }
  }
}
