import React from 'react';
import {
    useRouter
} from 'react-resource-router';


export const StateConsumer = () => {
    const [{ location: { state = {} } }, { goBack, push }] = useRouter();
    const { message, replaced } = state as any;

    return (
        <>
            <button type="button" onClick={() => replaced ? push('/') : goBack()}>go back</button>
            <p>{message}</p>
        </>
    );
};
