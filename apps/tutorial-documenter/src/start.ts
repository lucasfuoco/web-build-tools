import * as colors from 'colors';
import * as os from 'os';
import * as path from 'path';
import { TutorialDocumenterCommandLine } from './cli/tutorial_documenter_command_line';

const myPackageJsonFilename: string = path.resolve(path.join(
    __dirname, '..', 'package.json'
));
const myPackageJson: { version: string } = require(myPackageJsonFilename);

console.log(os.EOL + colors.bold(`api-documenter ${myPackageJson.version} ` +
    colors.cyan(' -http://aka.ms/extractor') + os.EOL));

const parser: TutorialDocumenterCommandLine = new TutorialDocumenterCommandLine();
parser.execute();