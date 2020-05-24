// import React, { ReactNode } from 'react';
// import { defaultRegistry, BoundActions } from 'react-sweet-state';
// import withSetupAndTeardown from '@atlassian/jira-common/src/util/decorators/with-setup-and-teardown';
// import createMemoryHistory from 'history/createMemoryHistory';

// import {
//   Router,
//   Link,
//   RouteComponent,
//   Redirect,
//   withRouter,
//   RouterSubscriber,
//   StaticRouter,
// } from '../index';

// import { RouteContext } from './common/types';
// import {
//   RouterState,
//   RouterActionsType,
// } from './controllers/router-store/types';

// const baseName = '/';

// const RouterDecorator = ({ children }: { children: ReactNode }) => (
//   <div>
//     {children}
//     <div style={{ marginTop: '50px' }}>
//       <Link href="/">Back to home</Link>
//     </div>
//   </div>
// );

// const ROUTES = [
//   {
//     path: `${baseName}`,
//     exact: true,
//     component: () => (
//       <div>
//         <h2>Home route</h2>
//         <p>
//           <Link href="/about">Go to About</Link>
//         </p>
//         <p>
//           <Link href="/redirect-example">Go to redirect example</Link>
//         </p>
//         <p>
//           <Link href="/about">Navigate using the `to` prop</Link>
//         </p>
//         <p>
//           <Link href="/about" type="button">
//             Render links as a button
//           </Link>
//         </p>
//         <p>
//           {/* $FlowFixMe - `to` is not typed as it is there for legacy support */}
//           <Link
//             to={{
//               pathname: '/contact-us',
//             }}
//           >
//             Navigate with a location object (legacy)
//           </Link>
//         </p>
//         <p>
//           <Link href="http://atlassian.com" target="_blank">
//             Open links in a new tab
//           </Link>
//         </p>
//         <p>
//           <Link href="http://atlassian.com" target="_top">
//             Open links in iframe parent
//           </Link>
//         </p>
//         <p>
//           <Link href="/about" replace>
//             Use `history.replace` instead of `history.push`
//           </Link>
//         </p>
//       </div>
//     ),
//   },
//   {
//     path: `${baseName}about`,
//     exact: true,
//     component: () => (
//       <RouterDecorator>
//         <h2>About page</h2>
//         <p>
//           <Link href="/">Go to home</Link>
//         </p>
//       </RouterDecorator>
//     ),
//   },
//   {
//     path: `${baseName}contact-us`,
//     exact: true,
//     component: () => (
//       <RouterDecorator>
//         <h2>Contact us</h2>
//         <p>
//           <Link href="/">Go to home</Link>
//         </p>
//       </RouterDecorator>
//     ),
//   },
//   {
//     path: `${baseName}redirect-example`,
//     exact: true,
//     component: () => (
//       <RouterDecorator>
//         <h2>Redirect to contact page</h2>
//         <p>
//           <Link href="/bounce">GO</Link>
//         </p>
//       </RouterDecorator>
//     ),
//   },
//   {
//     path: `${baseName}bounce`,
//     exact: true,
//     component: () => (
//       <div>
//         <Redirect to="/contact-us" />
//       </div>
//     ),
//   },
//   {
//     path: `${baseName}hello`,
//     exact: true,
//     component: () => (
//       <div>
//         <h2>You made it!</h2>
//         <p>
//           <Link href="/">Go to home</Link>
//         </p>
//       </div>
//     ),
//   },
// ];

// export const LinkComponentExample = () => {
//   const history = createMemoryHistory({
//     initialEntries: [baseName],
//   });
//   return (
//     <Router history={history} routes={ROUTES}>
//       <RouteComponent />
//     </Router>
//   );
// };

// export const RouterSubscriberComponent = () => {
//   const history = createMemoryHistory({
//     initialEntries: ['/about'],
//   });
//   const ComponentToBeWrapped = ({
//     state,
//     actions,
//   }: {
//     state: RouterState;
//     actions: BoundActions<RouterState, RouterActionsType>;
//   }) => (
//     <div>
//       <h2>{'<RouterSubscriber /> example'}</h2>
//       <p>The current route is {state.location.pathname}</p>
//       {state.location.pathname === '/about' ? (
//         <button onClick={() => actions.push('/hello')}>
//           Go to a new page using actions
//         </button>
//       ) : (
//         <button onClick={() => actions.push('/about')}>
//           Go back to the about page
//         </button>
//       )}
//     </div>
//   );
//   return (
//     <Router history={history} routes={ROUTES}>
//       <RouterSubscriber>
//         {(state, actions) => (
//           <ComponentToBeWrapped state={state} actions={actions} />
//         )}
//       </RouterSubscriber>
//     </Router>
//   );
// };

// export const WithRouterHoc = () => {
//   const history = createMemoryHistory({
//     initialEntries: ['/about'],
//   });
//   const ComponentToBeWrapped = (props: RouteContext) => (
//     <div>
//       <h2>withRouter() example</h2>
//       <p>The current route is {props.location.pathname}</p>
//     </div>
//   );
//   const ComponentWithRouter = withRouter(ComponentToBeWrapped);
//   return (
//     <Router history={history} routes={ROUTES}>
//       <ComponentWithRouter />
//     </Router>
//   );
// };

// export const StaticRouting = () => (
//   <StaticRouter routes={[]}>
//     <RouterSubscriber>
//       {({ location }) => (
//         <div>
//           <h2>Static router example</h2>
//           <p>The current location is {location.pathname}.</p>
//           <p>
//             Links rendered within a StaticRouter will not use SPA transitions.
//           </p>
//           <Link href="/some-page" target="_blank">
//             Clicking this link navigate to some page
//           </Link>
//         </div>
//       )}
//     </RouterSubscriber>
//   </StaticRouter>
// );

// export const storybookDecorators = [
//   withSetupAndTeardown({ teardown: () => defaultRegistry.stores.clear() }),
// ];
