import React from 'react';
import {
    Redirect
} from 'react-resource-router';


export const StateConsumerWithRedirection = () => {
    return (
        <Redirect to={{
            pathname: '/consumer',
            state: { fromRedirect: 'Hola! There was a redirection!' }
        }} />
    );
};
