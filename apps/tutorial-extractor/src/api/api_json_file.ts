import { JsonFile } from '@microsoft/node-core-library';
import { IApiPackage } from './api_item';
/** Support for loading the *.api.json file */
// tslint:disable-next-line:export-name
export class ApiJsonFile {
    public static loadFromFile (apiJsonFilePath: string): IApiPackage {
        return JsonFile.load(apiJsonFilePath);
    }
}