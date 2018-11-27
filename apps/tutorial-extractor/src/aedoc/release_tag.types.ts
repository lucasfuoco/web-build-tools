/**
 * A "realease tag" is an AeDoc tag which indicated whether an AstItem definition
 * is considered Public API for third party developers, as well as its release
 * stage (alpha, beta, etc).
 */
export enum ReleaseTag {
    /** No release tag was specified in the AEDoc summary */
    None,
    /**
     * Indicated that an API item is meant only for usage by other NPM packages from the same
     * maintainer. Third parties should never use "internal" API's. (To emphasize this, their
     * names are prefixed by underscores.)
     */
    Internal,
    /**
     * Indicates that an API item is eventually intended to be public, but currently is in an
     * early stage of development. Third parties should not use "aplha" APIs.
     */
    Alpha,
    /**
     * Indicates that an API item has been released in an experimental state. Third parties are
     * encouraged to try it and provide feedback. However, a "beta" API should NOT be used
     * in production.
     */
    Beta,
    /**
     * Indicates that an API item has been officially released. It is part of the supported
     * contract (e.g SemVer) for a package.
     */
    Public
}