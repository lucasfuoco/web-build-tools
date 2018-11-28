import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';
import {UTIL_GetSourceFile} from '../utils/util_source_file';
import {
    ApiDocumentation,
    ReleaseTag,
    ExtractorContext
} from '@ossiaco/tutorial-extractor';

describe('Class ApiDocumentation', () => {
    let instance: ApiDocumentation;
    let internalApiDocumentation: ApiDocumentation;
    let alphaApiDocumentation: ApiDocumentation;
    let betaApiDocumentation: ApiDocumentation;
    let badReleaseTagApiDocumentation: () => ApiDocumentation;
    let badRemarksApiDocumentation: () => ApiDocumentation;
    let deprecatedApiDocumentation: ApiDocumentation;
    let badDeprecatedApiDocumentation: () => ApiDocumentation;
    let preapprovedApiDocumentation: ApiDocumentation;
    let badPreapprovedApiDocumentation: () => ApiDocumentation;
    let badTutorialCountApiDocumentation: () => ApiDocumentation;
    let badTutorialNameCountApiDocumentation: () => ApiDocumentation;
    let stepApiDocumentation: ApiDocumentation;
    let badStepIndexApiDocumentation: () => ApiDocumentation;
    beforeAll(() => {
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const reportError: (message: string) => void = (message: string) => {
            throw new Error(message);
        };
        const docs: string = UTIL_GetSourceFile();
        const internalDocs: string = `
            /**
             * @tutorial
             * @internal
            */
        `;
        const alphaDocs: string = `
            /**
             * @tutorial
             * @alpha
            */
        `;
        const betaDocs: string = `
            /**
             * @tutorial
             * @beta
            */
        `;
        const badReleaseTagDocs: string = `
            /**
             * @public
             * @alpha
             * @beta
            */
        `;
        const badRemarksDocs: string = `
            /**
             * @tutorial
             * {@inheritdoc UTIL_GetSourceFile}
             * @remarks This is a test message.
            */
        `;
        const deprecatedDocs: string = `
            /**
             * @tutorial
             * @deprecated This is a test message.
            */
        `;
        const badDeprecatedDocs: string = `
            /**
             * @tutorial
             * @deprecated
            */
        `;
        const preapprovedDocs: string = `
            /**
             * @tutorial
             * @internal
             * @preapproved
            */
        `;
        const badPreapprovedDocs: string = `
            /**
             * @tutorial
             * @preapproved
            */
        `;
        const badTutorialCountDocs: string = `
            /**
             * @tutorial
             * @tutorial
            */
        `;
        const badTutorialNameCountDocs: string = `
            /**
             * @tutorial
             * @tutorialname Jest testing baby!
             * @tutorialname Jest rocks!
            */
        `;
        const stepDocs: string = `
            /**
             * @stepstart
             * @stepindex 1
            */
           /**
            * @stepend
           */
        `;
        const badStepIndexDocs: string = `
            /**
             * @stepstart
             * @stepindex 1
             * @stepindex 2
            */
           /**
            * @stepend
           */
        `;
        instance = new ApiDocumentation(
            docs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        internalApiDocumentation = new ApiDocumentation(
            internalDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        alphaApiDocumentation = new ApiDocumentation(
            alphaDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        betaApiDocumentation = new ApiDocumentation(
            betaDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badReleaseTagApiDocumentation = () => new ApiDocumentation(
            badReleaseTagDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badRemarksApiDocumentation = () => new ApiDocumentation(
            badRemarksDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        deprecatedApiDocumentation = new ApiDocumentation(
            deprecatedDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badDeprecatedApiDocumentation = () => new ApiDocumentation(
            badDeprecatedDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        preapprovedApiDocumentation = new ApiDocumentation(
            preapprovedDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badPreapprovedApiDocumentation = () => new ApiDocumentation(
            badPreapprovedDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badTutorialCountApiDocumentation = () => new ApiDocumentation(
            badTutorialCountDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badTutorialNameCountApiDocumentation = () => new ApiDocumentation(
            badTutorialNameCountDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        stepApiDocumentation = new ApiDocumentation(
            stepDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badStepIndexApiDocumentation = () => new ApiDocumentation(
            badStepIndexDocs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of ApiDocumentation', () => {
        expect(instance instanceof ApiDocumentation).toBeTruthy();
    });

    it('has variable _aedocTagsRegex', () => {
        expect(ApiDocumentation._aedocTagsRegex).toBeDefined();
    });

    it('variable _aedocTagsRegex is an instance of RegExp', () => {
        expect(ApiDocumentation._aedocTagsRegex instanceof RegExp).toBeTruthy();
    });

    it('variable _aedocTagsRegex is the right regular expression', () => {
        expect(ApiDocumentation._aedocTagsRegex.source).toBe(
            '{\\s*@(\\\\{|\\\\}|[^{}])*}|(?:^|\\s)(\\@[a-z_]+)(?=\\s|$)'
        );
    });

    it('has variable _allowedRegularAedocTags', () => {
        expect(ApiDocumentation._allowedRegularAedocTags).toBeDefined();
    });

    it('variable _allowedRegularAedocTags is type object', () => {
        expect(typeof ApiDocumentation._allowedRegularAedocTags).toBe('object');
    });

    it('variable _allowedRegularAedocTags returns the right array', () => {
        expect(ApiDocumentation._allowedRegularAedocTags).toEqual([
            '@alpha',
            '@beta',
            '@internal',
            '@internalremarks',
            '@preapproved',
            '@public',
            '@deprecated',
            '@summary',
            '@remarks',
            '@tutorial',
            '@tutorialname',
            '@stepstart',
            '@stepend',
            '@stepindex',
            '@stepname',
            '@code',
            '@codedescription'
        ]);
    });

    it('has variable _allowedInlineAedocTags', () => {
        expect(ApiDocumentation._allowedInlineAedocTags).toBeDefined();
    });

    it('variable _allowedInlineAedocTags is type object', () => {
        expect(typeof ApiDocumentation._allowedInlineAedocTags).toBe('object');
    });

    it('variable _allowedInlineAedocTags returns the right array', () => {
        expect(ApiDocumentation._allowedInlineAedocTags).toEqual([
            '@inheritdoc',
            '@link'
        ]);
    });

    it('has variable originalAeDocs', () => {
        expect(instance.originalAedocs).toBeDefined();
    });

    it('variable originalAeDocs is type string', () => {
        expect(typeof instance.originalAedocs).toBe('string');
    });

    it('variable originalAeDocs returns the document body', () => {
        const docs: string = UTIL_GetSourceFile();
        expect(instance.originalAedocs).toEqual(docs);
    });

    it('has variable failedToParse', () => {
        expect(instance.failedToParse).toBeDefined();
    });

    it('variable failedToParse is type boolean', () => {
        expect(typeof instance.failedToParse).toBe('boolean');
    });

    it('variable failedToParse is false by default', () => {
        expect(instance.failedToParse).toEqual(false);
    });

    it('has variable referenceResolver', () => {
        expect(instance.referenceResolver).toBeDefined();
    });

    it('variable referenceResolver is type object', () => {
        expect(typeof instance.referenceResolver).toBe('object');
    });

    it('has variable context', () => {
        expect(instance.context).toBeDefined();
    });

    it('variable context is an instance of ExtractorContext', () => {
        expect(instance.context instanceof ExtractorContext).toBeTruthy();
    });

    it('variable context returns an instance of ExtractorContext', () => {
        expect(instance.context).toEqual(UTIL_GetExtractorContext());
    });

    it('has variable warnings', () => {
        expect(instance.warnings).toBeDefined();
    });

    it('variable warnings is type object', () => {
        expect(typeof instance.warnings).toBe('object');
    });

    it('variable warnings returns array of warnings', () => {
        expect(instance.warnings).toEqual([]);
    });

    it('has variable releaseTag', () => {
        expect(instance.releaseTag).toBeDefined();
    });

    it('variable releaseTag is type number', () => {
        expect(typeof instance.releaseTag).toBe('number');
    });

    it('variable releaseTag returns release tag public when the \'@public\' token is present', () => {
        expect(instance.releaseTag).toEqual(ReleaseTag.Public);
    });

    it('variable releaseTag returns release tag internal when the \'@internal\' token is present', () => {
        expect(internalApiDocumentation.releaseTag).toEqual(ReleaseTag.Internal);
    });

    it('variable releaseTag returns release tag alpha when the \'@alpha\' token is present', () => {
        expect(alphaApiDocumentation.releaseTag).toEqual(ReleaseTag.Alpha);
    });

    it('variable releaseTag returns release tag beta when the \'@beta\' token is present', () => {
        expect(betaApiDocumentation.releaseTag).toEqual(ReleaseTag.Beta);
    });

    it('variable releaseTag returns returns null and throws error when multiple release tags are set', () => {
        expect(() => {
            badReleaseTagApiDocumentation();
        }).toThrow(new Error('More than one release tag (@alpha, @beta, etc) was specified'));
    });

    it('has variable summary', () => {
        expect(instance.summary).toBeDefined();
    });

    it('variable summary is type object', () => {
        expect(typeof instance.summary).toBe('object');
    });

    it('variable summary returns an IMarkupParagraph object', () => {
        expect(instance.summary).toEqual([
            {
                kind: 'text',
                text: 'Load the runtime context.'
            }
        ]);
    });

    it('has variable deprecatedMessage', () => {
        expect(deprecatedApiDocumentation.deprecatedMessage).toBeDefined();
    });

    it('variable deprecatedMessage is type object', () => {
        expect(typeof deprecatedApiDocumentation.deprecatedMessage).toBe('object');
    });

    it('variable deprecatedMessage returns an array of MarkupElement' +
    'objects when the \'@deprecated\' token is set', () => {
        expect(deprecatedApiDocumentation.deprecatedMessage).toEqual([
            {
                kind: 'text',
                text: 'This is a test message.'
            }
        ]);
    });

    it('variable deprecatedMessage returns an empty array and throws an error if no deprecated message is set', () => {
        expect(() => {
            badDeprecatedApiDocumentation();
        }).toThrow(new Error('deprecated description required after @deprecated AEDoc tag.'));
    });

    it('has variable remarks', () => {
        expect(instance.remarks).toBeDefined();
    });

    it('variable remarks is type object', () => {
        expect(typeof instance.remarks).toBe('object');
    });

    it('variable remarks returns an array of MarkupElement objects when the \'@remarks\' token is set', () => {
        expect(instance.remarks).toEqual([
            {
                kind: 'text',
                text: 'blah blah blah'
            }
        ]);
    });

    it('variable remarks returns an empty array and throws an error if the documentation is inherited', () => {
        expect(() => {
            badRemarksApiDocumentation();
        }).toThrow(new Error('The @remarks tag may not be used because ' +
        'this state is provided by the @inheritdoc target'));
    });

    it('has variable preapproved', () => {
        expect(preapprovedApiDocumentation.preapproved).toBeDefined();
    });

    it('variable preapproved is type boolean', () => {
        expect(typeof preapprovedApiDocumentation.preapproved).toBe('boolean');
    });

    it('variable preapproved returns true when the \'@preapproved\' token is set', () => {
        expect(preapprovedApiDocumentation.preapproved).toEqual(true);
    });

    it('variable preapproved returns false when the \'@preapproved\' token is NOT set', () => {
        expect(instance.preapproved).toEqual(false);
    });

    it('variable preapproved returns false and throws an error ' +
    'when it\'s release tag isn\'t set to \'@internal\'', () => {
        expect(() => {
            badPreapprovedApiDocumentation();
        }).toThrow(new Error('The @preapproved tag may only be applied to @internal definitions'));
    });

    it('has variable isTutorial', () => {
        expect(instance.isTutorial).toBeDefined();
    });

    it('variable isTutorial is type boolean', () => {
        expect(typeof instance.isTutorial).toBe('boolean');
    });

    it('variable isTutorial is set to true when the \'@tutorial\' token is set', () => {
        expect(instance.isTutorial).toEqual(true);
    });

    it('throws an error when the \'@tutorial\' tag is set more than ones', () => {
        expect(() => {
            badTutorialCountApiDocumentation();
        }).toThrow(new Error('More than one tutorial tag (@tutorial) was specified'));
    });

    it('has variable tutorialName', () => {
        expect(instance.tutorialName).toBeDefined();
    });

    it('variable tutorialName is type object', () => {
        expect(typeof instance.tutorialName).toBe('object');
    });

    it('variable tutorialName returns the tutorial name when the \'@tutorialname\' is set', () => {
        expect(instance.tutorialName).toEqual([
            {
                kind: 'text',
                text: 'Load Context'
            }
        ]);
    });

    it('variable tutorialName returns null and throws error when the \'@tutorialname\' is set more than ones', () => {
        expect(() => {
            badTutorialNameCountApiDocumentation();
        }).toThrow(new Error('More than one tutorial name tag (@tutorialname) was specified'));
    });

    it('has variable stepIndex', () => {
        expect(stepApiDocumentation.stepIndex).toBeDefined();
    });

    it('variable stepIndex is type number', () => {
        expect(typeof stepApiDocumentation.stepIndex).toBe('number');
    });

    it('variable stepIndex returns 1', () => {
        expect(stepApiDocumentation.stepIndex).toEqual(1);
    });

    it('variable stepIndex return null and throws error when the \'@stepindex\' is set more than ones', () => {
        expect(() => {
            badStepIndexApiDocumentation();
        }).toThrow(new Error('More than one step index tag (@stepindex) was specified'));
    });

    it('has variable incompleteInheritdocs', () => {
        expect(instance.incompleteInheritdocs).toBeDefined();
    });

    it('variable incompleteInheritdocs is type object', () => {
        expect(typeof instance.incompleteInheritdocs).toBe('object');
    });

    it('variable incompleteInheritdocs returns an empty array', () => {
        expect(instance.incompleteInheritdocs).toEqual([]);
    });

    it('has variable isDocInheritedDeprecated', () => {
        expect(instance.incompleteInheritdocs).toBeDefined();
    });

    it('variable isDocInheritedDeprecated is type boolean', () => {
        expect(typeof instance.isDocInheritedDeprecated).toBe('boolean');
    });

    it('variable isDocInheritedDeprecated returns false by default', () => {
        expect(instance.isDocInheritedDeprecated).toEqual(false);
    });

    it('has variable isDocInherited', () => {
        expect(instance.isDocInherited).toBeDefined();
    });

    it('variable isDocInherited is type boolean', () => {
        expect(typeof instance.isDocInherited).toBe('boolean');
    });

    it('variable isDocInherited return false by default', () => {
        expect(instance.isDocInherited).toEqual(false);
    });
});