import React from 'react';
import ReactDOM from 'react-dom';

import {
    Router,
    RouteComponent,
    createBrowserHistory,
} from 'react-resource-router';

import { stateProviderRoute, stateConsumerRoute, stateConsumerWithRedirectionRoute } from './routes';

const myHistory = createBrowserHistory();

const appRoutes = [stateProviderRoute, stateConsumerRoute, stateConsumerWithRedirectionRoute];

const App = () => {
    return (
        <Router
            routes={appRoutes}
            history={myHistory}
            basePath="/routing-with-route-state"
            onPrefetch={({ route }) => console.log('Prefetcing route', route.name)}
        >
            <RouteComponent />
        </Router>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));
