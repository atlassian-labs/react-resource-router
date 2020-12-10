import { Home, homeResource } from './home';
import { About, aboutResource } from './about';

export const homeRoute = {
  name: 'home',
  path: '/',
  exact: true,
  component: Home,
  navigation: null,
  resources: [homeResource],
};

export const aboutRoute = {
  name: 'about',
  path: '/about',
  exact: true,
  component: About,
  navigation: null,
  resources: [aboutResource],
};
