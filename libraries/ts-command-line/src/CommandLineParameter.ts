// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  IBaseCommandLineDefinition,
  ICommandLineFlagDefinition,
  ICommandLineStringDefinition,
  ICommandLineStringListDefinition,
  ICommandLineIntegerDefinition,
  ICommandLineChoiceDefinition,
  IBaseCommandLineDefinitionWithArgument
} from './CommandLineDefinition';

/**
 * Identifies the kind of a CommandLineParameter.
 * @public
 */
export enum CommandLineParameterKind {
  /** Indicates a CommandLineChoiceParameter */
  Choice,
  /** Indicates a CommandLineFlagParameter */
  Flag,
  /** Indicates a CommandLineIntegerParameter */
  Integer,
  /** Indicates a CommandLineStringParameter */
  String,
  /** Indicates a CommandLineStringListParameter */
  StringList
}

/**
 * The base class for the various command-line parameter types.
 * @public
 */
export abstract class CommandLineParameter {
  // Example: "--do-something"
  private static _longNameRegExp: RegExp = /^-(-[a-z0-9]+)+$/;

  // Example: "-d"
  private static _shortNameRegExp: RegExp = /^-[a-zA-Z]$/;

  // "Environment variable names used by the utilities in the Shell and Utilities volume of
  // IEEE Std 1003.1-2001 consist solely of uppercase letters, digits, and the '_' (underscore)
  // from the characters defined in Portable Character Set and do not begin with a digit."
  // Example: "THE_SETTING"
  private static _environmentVariableRegExp: RegExp = /^[A-Z_][A-Z0-9_]*$/;

  /**
   * A unique internal key used to retrieve the value from the parser's dictionary.
   * @internal
   */
  public _parserKey: string;

  /** {@inheritdoc IBaseCommandLineDefinition.parameterLongName} */
  public readonly longName: string;

  /** {@inheritdoc IBaseCommandLineDefinition.parameterShortName} */
  public readonly shortName: string | undefined;

  /** {@inheritdoc IBaseCommandLineDefinition.description} */
  public readonly description: string;

  /** {@inheritdoc IBaseCommandLineDefinition.required} */
  public readonly required: boolean;

  /** {@inheritdoc IBaseCommandLineDefinition.environmentVariable} */
  public readonly environmentVariable: string | undefined;

  /** @internal */
  constructor(definition: IBaseCommandLineDefinition) {
    this.longName = definition.parameterLongName;
    this.shortName = definition.parameterShortName;
    this.description = definition.description;
    this.required = !!definition.required;
    this.environmentVariable = definition.environmentVariable;

    if (!CommandLineParameter._longNameRegExp.test(this.longName)) {
      throw new Error(`Invalid name: "${this.longName}". The parameter long name must be`
        + ` lower-case and use dash delimiters (e.g. "--do-a-thing")`);
    }

    if (this.shortName) {
      if (!CommandLineParameter._shortNameRegExp.test(this.shortName)) {
        throw new Error(`Invalid name: "${this.shortName}". The parameter short name must be`
          + ` a dash followed by a single upper-case or lower-case letter (e.g. "-a")`);
      }
    }

    if (this.environmentVariable) {
      if (this.required) {
        throw new Error(`An "environmentVariable" cannot be specified for "${this.longName}"`
          + ` because it is a required parameter`);
      }

      if (!CommandLineParameter._environmentVariableRegExp.test(this.environmentVariable)) {
        throw new Error(`Invalid environment variable name: "${this.environmentVariable}". The name must`
          + ` consist only of upper-case letters, numbers, and underscores. It may not start with a number.`);
      }
    }
  }

  /**
   * Called internally by CommandLineParameterProvider._processParsedData()
   * @internal
   */
  public abstract _setValue(data: any): void; // tslint:disable-line:no-any

  /**
   * Returns additional text used by the help formatter.
   * @internal
   */
  public _getSupplementaryNotes(supplementaryNotes: string[]): void { // virtual
    if (this.environmentVariable !== undefined) {
      supplementaryNotes.push('This parameter may alternatively specified via the ' + this.environmentVariable
      + ' environment variable.');
    }
  }

  /**
   * Indicates the type of parameter.
   */
  public abstract get kind(): CommandLineParameterKind;

  /**
   * Append the parsed values to the provided string array.
   * @remarks
   * Sometimes a command line parameter is not used directly, but instead gets passed through to another
   * tool that will use it.  For example if our parameter comes in as "--max-count 3", then we might want to
   * call `child_process.spawn()` and append ["--max-count", "3"] to the args array for that tool.
   * appendToArgList() appends zero or more strings to the provided array, based on the input command-line
   * that we parsed.
   *
   * If the parameter was omitted from our command-line and has no default value, then
   * nothing will be appended.  If the short name was used, the long name will be appended instead.
   * @param argList - the parsed strings will be appended to this string array
   */
  public abstract appendToArgList(argList: string[]): void;

  /**
   * Internal usage only.  Used to report unexpected output from the argparse library.
   */
  protected reportInvalidData(data: any): never { // tslint:disable-line:no-any
    throw new Error(`Unexpected data object for parameter "${this.longName}": `
      + JSON.stringify(data));
  }

  protected validateDefaultValue(hasDefaultValue: boolean): void {
    if (this.required && hasDefaultValue) {
      // If a parameter is "required", then the user understands that they always need to
      // specify a value for this parameter (either via the command line or via an environment variable).
      // It would be confusing to allow a default value that sometimes allows the "required" parameter
      // to be omitted.  If you sometimes don't have a suitable default value, then the better approach
      // is to throw a custom error explaining why the parameter is required in that case.
      throw new Error(`A default value cannot be specified for "${this.longName}"`
        + ` because it is a "required" parameter`);
    }
  }
}

/**
 * The common base class for parameters types that receive an argument.
 *
 * @remarks
 * An argument is an accompanying command-line token, such as "123" in the
 * example "--max-count 123".
 * @public
 */
export abstract class CommandLineParameterWithArgument extends CommandLineParameter {
  // Matches the first character that *isn't* part of a valid upper-case argument name such as "URL_2"
  private static _invalidArgumentNameRegExp: RegExp = /[^A-Z_0-9]/;

  /** {@inheritdoc IBaseCommandLineDefinitionWithArgument.argumentName} */
  public readonly argumentName: string;

  /** @internal */
  constructor(definition: IBaseCommandLineDefinitionWithArgument) {
    super(definition);

    if (definition.argumentName === '') {
      throw new Error('The argument name cannot be an empty string. (For the default name, specify undefined.)');
    }
    if (definition.argumentName.toUpperCase() !== definition.argumentName) {
      throw new Error(`Invalid name: "${definition.argumentName}". The argument name must be all upper case.`);
    }
    const match: RegExpMatchArray | null = definition.argumentName.match(
      CommandLineParameterWithArgument._invalidArgumentNameRegExp);
    if (match) {
      throw new Error(`The argument name "${definition.argumentName}" contains an invalid character "${match[0]}".`
        + ` Only upper-case letters, numbers, and underscores are allowed.`);
    }
    this.argumentName = definition.argumentName;
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineChoiceParameter}.
 * @public
 */
export class CommandLineChoiceParameter extends CommandLineParameter {
  /** {@inheritdoc ICommandLineChoiceDefinition.alternatives} */
  public readonly alternatives: ReadonlyArray<string>;

  /** {@inheritdoc ICommandLineStringDefinition.defaultValue} */
  public readonly defaultValue: string | undefined;

  private _value: string | undefined = undefined;

  /** @internal */
  constructor(definition: ICommandLineChoiceDefinition) {
    super(definition);

    if (definition.alternatives.length <= 1) {
      throw new Error(`When defining a choice parameter, the alternatives list must contain at least one value.`);
    }
    if (definition.defaultValue && definition.alternatives.indexOf(definition.defaultValue) === -1) {
      throw new Error(`The specified default value "${definition.defaultValue}"`
        + ` is not one of the available options: ${definition.alternatives.toString()}`);
    }

    this.alternatives = definition.alternatives;
    this.defaultValue = definition.defaultValue;
    this.validateDefaultValue(!!this.defaultValue);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Choice;
  }

  /**
   * {@inheritdoc CommandLineParameter._setValue}
   * @internal
   */
  // tslint:disable-next-line:no-any
  public _setValue(data: any): void { // abstract
    if (data !== null && data !== undefined) {
      if (typeof data !== 'string') {
        this.reportInvalidData(data);
      }
      this._value = data;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined && environmentValue !== '') {
        if (this.alternatives.indexOf(environmentValue) < 0) {
          const choices: string = '"' + this.alternatives.join('", "') + '"';
          throw new Error(`Invalid value "${environmentValue}" for the environment variable`
            + ` ${this.environmentVariable}.  Valid choices are: ${choices}`);
        }
        this._value = environmentValue;
        return;
      }
    }

    if (this.defaultValue !== undefined) {
      this._value = this.defaultValue;
      return;
    }

    this._value = undefined;
  }

  /**
   * {@inheritdoc CommandLineParameter._getSupplementaryNotes}
   * @internal
   */
  public _getSupplementaryNotes(supplementaryNotes: string[]): void { // virtual
    super._getSupplementaryNotes(supplementaryNotes);
    if (this.defaultValue !== undefined) {
      supplementaryNotes.push(`The default value is "${this.defaultValue}".`);
    }
  }

  /**
   * Returns the argument value for a choice parameter that was parsed from the command line.
   *
   * @remarks
   * The return value will be `undefined` if the command-line has not been parsed yet,
   * or if the parameter was omitted and has no default value.
   */
  public get value(): string | undefined {
    return this._value;
  }

  /** {@inheritdoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.value !== undefined) {
      argList.push(this.longName);
      argList.push(this.value);
    }
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineFlagParameter}.
 * @public
 */
export class CommandLineFlagParameter extends CommandLineParameter {
  private _value: boolean = false;

  /** @internal */
  constructor(definition: ICommandLineFlagDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Flag;
  }

  /**
   * {@inheritdoc CommandLineParameter._setValue}
   * @internal
   */
  // tslint:disable-next-line:no-any
  public _setValue(data: any): void { // abstract
    if (data !== null && data !== undefined) {
      if (typeof data !== 'boolean') {
        this.reportInvalidData(data);
      }
      this._value = data;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined && environmentValue !== '') {
        if (environmentValue !== '0' && environmentValue !== '1') {
          throw new Error(`Invalid value "${environmentValue}" for the environment variable`
            + ` ${this.environmentVariable}.  Valid choices are 0 or 1.`);
        }
        this._value = environmentValue === '1';
        return;
      }
    }

    this._value = false;
  }

  /**
   * Returns a boolean indicating whether the parameter was included in the command line.
   *
   * @remarks
   * The return value will be false if the command-line has not been parsed yet,
   * or if the flag was not used.
   */
  public get value(): boolean {
    return this._value;
  }

  /** {@inheritdoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.value) {
      argList.push(this.longName);
    }
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineIntegerParameter}.
 * @public
 */
export class CommandLineIntegerParameter extends CommandLineParameterWithArgument {
  /** {@inheritdoc ICommandLineStringDefinition.defaultValue} */
  public readonly defaultValue: number | undefined;

  private _value: number | undefined = undefined;

  /** @internal */
  constructor(definition: ICommandLineIntegerDefinition) {
    super(definition);
    this.defaultValue = definition.defaultValue;
    this.validateDefaultValue(!!this.defaultValue);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.Integer;
  }

  /**
   * {@inheritdoc CommandLineParameter._setValue}
   * @internal
   */
  // tslint:disable-next-line:no-any
  public _setValue(data: any): void { // abstract
    if (data !== null && data !== undefined) {
      if (typeof data !== 'number') {
        this.reportInvalidData(data);
      }
      this._value = data;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined && environmentValue !== '') {
        const parsed: number = parseInt(environmentValue, 10);
        if (isNaN(parsed) || environmentValue.indexOf('.') >= 0) {
          throw new Error(`Invalid value "${environmentValue}" for the environment variable`
            + ` ${this.environmentVariable}.  It must be an integer value.`);
        }
        this._value = parsed;
        return;
      }
    }

    if (this.defaultValue !== undefined) {
      this._value = this.defaultValue;
      return;
    }

    this._value = undefined;
  }

  /**
   * {@inheritdoc CommandLineParameter._getSupplementaryNotes}
   * @internal
   */
  public _getSupplementaryNotes(supplementaryNotes: string[]): void { // virtual
    super._getSupplementaryNotes(supplementaryNotes);
    if (this.defaultValue !== undefined) {
      supplementaryNotes.push(`The default value is ${this.defaultValue}.`);
    }
  }

  /**
   * Returns the argument value for an integer parameter that was parsed from the command line.
   *
   * @remarks
   * The return value will be undefined if the command-line has not been parsed yet,
   * or if the parameter was omitted and has no default value.
   */
  public get value(): number | undefined {
    return this._value;
  }

  /** {@inheritdoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.value !== undefined) {
      argList.push(this.longName);
      argList.push(this.value.toString());
    }
  }
}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineStringParameter}.
 * @public
 */
export class CommandLineStringParameter extends CommandLineParameterWithArgument {
  /** {@inheritdoc ICommandLineStringDefinition.defaultValue} */
  public readonly defaultValue: string | undefined;

  private _value: string | undefined = undefined;

  /** @internal */
  constructor(definition: ICommandLineStringDefinition) {
    super(definition);

    this.defaultValue = definition.defaultValue;
    this.validateDefaultValue(!!this.defaultValue);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.String;
  }

  /**
   * {@inheritdoc CommandLineParameter._setValue}
   * @internal
   */
  // tslint:disable-next-line:no-any
  public _setValue(data: any): void { // abstract
    if (data !== null && data !== undefined) {
      if (typeof data !== 'string') {
        this.reportInvalidData(data);
      }
      this._value = data;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined) {
        // NOTE: If the environment variable is defined as an empty string,
        // here we will accept the empty string as our value.  (For number/flag we don't do that.)
        this._value = environmentValue;
        return;
      }
    }

    if (this.defaultValue !== undefined) {
      this._value = this.defaultValue;
      return;
    }

    this._value = undefined;
  }

  /**
   * {@inheritdoc CommandLineParameter._getSupplementaryNotes}
   * @internal
   */
  public _getSupplementaryNotes(supplementaryNotes: string[]): void { // virtual
    super._getSupplementaryNotes(supplementaryNotes);
    if (this.defaultValue !== undefined) {
      if (this.defaultValue.length < 160) {
        supplementaryNotes.push(`The default value is ${JSON.stringify(this.defaultValue)}.`);
      }
    }
  }

  /**
   * Returns the argument value for a string parameter that was parsed from the command line.
   *
   * @remarks
   * The return value will be undefined if the command-line has not been parsed yet,
   * or if the parameter was omitted and has no default value.
   */
  public get value(): string | undefined {
    return this._value;
  }

  /** {@inheritdoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.value !== undefined) {
      argList.push(this.longName);
      argList.push(this.value);
    }
  }

}

/**
 * The data type returned by {@link CommandLineParameterProvider.defineStringListParameter}.
 * @public
 */
export class CommandLineStringListParameter extends CommandLineParameterWithArgument {
  private _values: string[] = [];

  /** @internal */
  constructor(definition: ICommandLineStringListDefinition) {
    super(definition);
  }

  /** {@inheritdoc CommandLineParameter.kind} */
  public get kind(): CommandLineParameterKind {
    return CommandLineParameterKind.StringList;
  }

  /**
   * {@inheritdoc CommandLineParameter._setValue}
   * @internal
   */
  // tslint:disable-next-line:no-any
  public _setValue(data: any): void { // abstract
    if (data !== null && data !== undefined) {
      if (!Array.isArray(data)) {
        this.reportInvalidData(data);
      }
      for (const arrayItem of data) {
        if (typeof(arrayItem) !== 'string') {
          this.reportInvalidData(data);
        }
      }
      this._values = data;
      return;
    }

    if (this.environmentVariable !== undefined) {
      // Try reading the environment variable
      const environmentValue: string | undefined = process.env[this.environmentVariable];
      if (environmentValue !== undefined) {
        // NOTE: If the environment variable is defined as an empty string,
        // here we will accept the empty string as our value.  (For number/flag we don't do that.)

        // In the current implementation, the environment variable for a "string list" can only
        // store a single item.  If we wanted to allow multiple items (and still have a conventional-seeming
        // environment), we would ask the caller to provide an appropriate delimiter.  Getting involved
        // with escaping here seems unwise, since there are so many shell escaping mechanisms that could
        // potentially confuse the experience.
        this._values = [ environmentValue ];
        return;
      }
    }

    // (No default value for string lists)

    this._values = [];
  }

  /**
   * Returns the string arguments for a string list parameter that was parsed from the command line.
   *
   * @remarks
   * The array will be empty if the command-line has not been parsed yet,
   * or if the parameter was omitted and has no default value.
   */
  public get values(): ReadonlyArray<string> {
    return this._values;
  }

  /** {@inheritdoc CommandLineParameter.appendToArgList} @override */
  public appendToArgList(argList: string[]): void {
    if (this.values.length > 0) {
      for (const value of this.values) {
        argList.push(this.longName);
        argList.push(value);
      }
    }
  }
}
