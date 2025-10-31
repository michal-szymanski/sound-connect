export type ServerFunctionSuccess<T> = {
    success: true;
    body: T;
};

export type ServerFunctionError<E = null> = {
    success: false;
    body: E;
};
