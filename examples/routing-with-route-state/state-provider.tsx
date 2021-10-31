import React from 'react';
import {
    Link,
    useRouterActions
} from 'react-resource-router';


export const StateProvider = () => {
    const { push, replace } = useRouterActions();
    return (
        <>
            <h1>There is a several variants presented to pass some state options to the next route</h1>
            <button type="button" onClick={() => {
                push('/consumer', { fromPush: "Aloha from push()" })
            }}>Use PUSH method</button>
            <br />
            <button type="button" onClick={() => {
                replace('/consumer', { fromReplace: "Greatings from replace()" })
            }}>Use REPLACE method</button>
            <br />
            <Link to={{
                pathname: '/consumer',
                state: { fromLink: 'Hola! There was a Link!' }
            }}>Use LINK component</Link>
            <br />
            <Link to={{
                pathname: '/redirector',
            }}>Use LINK  to REDIRECT component</Link>
        </>
    );
};
