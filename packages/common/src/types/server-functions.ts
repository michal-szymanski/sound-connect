export type ServerFunctionSuccess<T> = {
    success: true;
    body: T;
};

export type ServerFunctionError<E = null> = {
    success: false;
    body: E;
};

export type ServerFunctionResult<TSuccess, TError = null> = ServerFunctionSuccess<TSuccess> | ServerFunctionError<TError>;
