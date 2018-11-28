/** Allowed Token types. */
export enum TokenType {
    /** A Token that contains only text */
    Text,
    /** A Token representing an AEDoc block tags */
    BlockTag,
    /**
     * A Token representing a AEDoc inline tag. Inline tags must be enclosed
     * in curly braces, which may include parameters
    */
   InlineTag
}

/** A structured object created from a doc comment string within an AEDoc comment block. */
export class Token {
    /** The type of the token */
    private _type: TokenType;
    /** This is not used for text */
    private _tag: string;
    /**
     * For inline tags, this is the parameter.
     * For text it is the text.
    */
   private _text: string;
    constructor(type: TokenType, tag?: string, text?: string) {
        this._type = type;
        this._tag = tag ? tag : '';
        this._text = text ? this._unescape(text) : '';
        return this;
    }

    get type(): TokenType {
        return this._type;
    }

    get tag(): string {
        return this._tag;
    }

    get text(): string {
        return this._text;
    }

    /** Determines if the type is not what we expect. */
    public requireType(type: TokenType): void {
        if (this._type !== type) {
            throw new Error(`Encountered a token of type \"${this._type}\" when expecting \"${type}\"`);
        }
    }

    private _unescape(text: string): string {
        return text.replace('\\@', '@').replace('\\{', '{').replace('\\\\', '\\').replace('\\}', '}');
    }
}