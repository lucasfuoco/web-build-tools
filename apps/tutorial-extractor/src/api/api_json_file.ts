import { JsonFile } from '@microsoft/node-core-library';
import { IApiPackage } from './api_item';
/** Support for loading the *.api.json file */
export class ApiJsonFile {
    static loadFromFile (apiJsonFilePath: string): IApiPackage {
        return JsonFile.load(apiJsonFilePath);
    }
}