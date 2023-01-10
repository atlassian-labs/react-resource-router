import React from 'react';

import { Link, usePathParam } from 'react-resource-router';

const randomStr = (length: number) => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const generateLightColorHex = () => {
  let color = '#';
  for (let i = 0; i < 3; i++)
    color += (
      '0' + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)
    ).slice(-2);

  return color;
};

const UpdateButton = ({ for: paramKey = '' }) => {
  //eslint-disable-next-line
  const [param, setParam] = usePathParam(paramKey);

  return (
    <div
      style={{
        margin: '20px 0',
      }}
    >
      <button onClick={() => setParam(randomStr(5))}>Update {paramKey}</button>
      <button onClick={() => setParam(randomStr(5), 'replace')}>
        Replace {paramKey}
      </button>
    </div>
  );
};

const ComponentFoo = () => {
  // eslint-disable-next-line
  const [foo, setFoo] = usePathParam('foo');

  return (
    <div
      style={{
        margin: '20px 0',
        padding: '20px',
        backgroundColor: generateLightColorHex(),
      }}
    >
      <div>
        I am ComponentFoo that consumes &apos;foo&apos; query param. My
        background color changes on every render.
      </div>
      <p>foo={foo}</p>
    </div>
  );
};

const ComponentBar = () => {
  // eslint-disable-next-line
  const [bar, setBar] = usePathParam('bar');

  return (
    <div
      style={{
        margin: '20px 0',
        padding: '20px',
        backgroundColor: generateLightColorHex(),
      }}
    >
      <div>
        I am ComponentBar that consumes &apos;bar&apos; query param. My
        background color changes on every render.
      </div>
      <p>bar={bar}</p>
    </div>
  );
};

const PathParamExample = () => {
  return (
    <div>
      <h1>usePathParam - /hooks/use-path-param/:foo/:bar</h1>
      <ComponentFoo />
      <UpdateButton for={'foo'} />
      <ComponentBar />
      <UpdateButton for={'bar'} />
      <Link to={'/'}>Go back to list of hooks</Link>
    </div>
  );
};

export default PathParamExample;
