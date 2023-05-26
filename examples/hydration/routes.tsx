import { Home, homeResource } from './home';

export const homeRoute = {
  name: 'home',
  path: '/',
  exact: true,
  component: Home,
  navigation: null,
  resources: [homeResource],
};
