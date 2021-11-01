import { StateConsumer } from './state-consumer';
import { StateProvider } from './state-provider';
import { StateConsumerWithRedirection } from './state-consumer-with-redirection';

export const stateProviderRoute = {
    name: 'provider',
    path: '/',
    exact: true,
    component: StateProvider,
    navigation: null,
    resources: [],
};

export const stateConsumerRoute = {
    name: 'consumer',
    path: '/consumer',
    exact: true,
    component: StateConsumer,
    navigation: null,
    resources: [],
};

export const stateConsumerWithRedirectionRoute = {
    name: 'consumer-with-redirection',
    path: '/redirector',
    exact: true,
    component: StateConsumerWithRedirection,
    navigation: null,
    resources: [],
};

