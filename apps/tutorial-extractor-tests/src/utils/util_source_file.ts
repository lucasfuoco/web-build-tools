/**
 * @public
 */

export function UTIL_GetSourceFile(): string {
    return `
        /**
         * @public
         * @tutorial
         * @summary Load the runtime context.
         * @remarks blah blah blah
         * @tutorialname Load Context
         */

        import * as fs from 'fs';
        import { Observable, Observer } from 'rxjs';
        import { ISessionProps } from '../../../../core/src/index';

        export function loadContextFromFile (fileName: string): Observable<ISessionProps> {
            return new Observable((observer: Observer<ISessionProps>) => {
                fs.readFile(fileName, (err: Error, data: Buffer) => {
                    if (err) {
                        observer.error(err);
                    }
                    observer.next(JSON.parse(data.toString()));
                    observer.complete();
                });
            });
        }

        loadContextFromFile('../../../runtime_context.json').subscribe(
            (context: ISessionProps) => {
                console.log(context);
            },
            (err: Error) => {
                console.error(err);
            }
        );
    `;
}