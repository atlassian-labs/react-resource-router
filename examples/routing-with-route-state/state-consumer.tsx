import React from 'react';
import {
    useRouter
} from 'react-resource-router';


export const StateConsumer = () => {
    const [{ location: { state = {} } }] = useRouter();
    const { fromPush, fromReplace, fromLink, fromRedirect } = state as any;

    return (
        <ul>
            {fromPush && <li>From push() {fromPush}</li>}
            {fromReplace && <li>From replace() {fromReplace}</li>}
            {fromLink && <li>From Link {fromLink}</li>}
            {fromRedirect && <li>From Redirect {fromRedirect}</li>}
        </ul>
    );
};
