import { Home } from './home';
import { About } from './about';
import { Contact } from './contact';
import resource from './resource';

export const homeRoute = {
  name: 'home',
  path: '/',
  exact: true,
  component: Home,
  navigation: null,
  resources: [resource],
};

export const aboutRoute = {
  name: 'about',
  path: '/about',
  exact: true,
  component: About,
  navigation: null,
  resources: [resource],
}
;
export const contactRoute = {
  name: 'contact',
  path: '/contact',
  exact: true,
  component: Contact,
  navigation: null,
  resources: [resource],
};
