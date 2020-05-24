import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import '@testing-library/jest-dom/extend-expect';
import { configure } from 'enzyme';

configure({ adapter: new Adapter() });

React.useLayoutEffect = React.useEffect;
