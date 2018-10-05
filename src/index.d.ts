interface ServiceOptions {
    /** Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object. */
    transport?: JQueryAjaxSettings,

    /** Called when the call completes successfully. Defaults to `$.noop`. */
    success?: Function,

    /** Called when the call completes successfully. Defaults to `$.noop`. */
    error?: Function,

    /** For projects that require authentication, pass in the user access token (defaults to undefined). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)). @see [Authentication API Service](../auth/auth-service/) for getting tokens. */
    token?: string,

    [x: string]: any 
}

interface AccountAPIServiceOptions extends ServiceOptions {
    /** The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to undefined. If left undefined, taken from the URL. */
    account?: string,

    /** The project id. Defaults to undefined. If left undefined, taken from the URL. */
    project?: string,
}