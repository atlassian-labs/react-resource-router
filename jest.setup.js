import React from 'react';
import { format } from 'util';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom/extend-expect';
import { configure } from 'enzyme';

configure({ adapter: new Adapter() });

React.useLayoutEffect = React.useEffect;

const error = console.error;

console.error = function (...args) {
  error(...args);
  throw new Error(format(...args));
};
