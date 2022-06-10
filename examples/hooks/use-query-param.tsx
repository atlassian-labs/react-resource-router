import React from 'react';
import { Link, useQueryParam } from '../../src';

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
  const [param, setParam] = useQueryParam(paramKey);

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
      <button onClick={() => setParam(undefined)}>Empty {paramKey}</button>
    </div>
  );
};

const ComponentFoo = () => {
  // eslint-disable-next-line
  const [foo, setFoo] = useQueryParam('foo');

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
  const [bar, setBar] = useQueryParam('bar');

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

const QueryParamExample = () => {
  return (
    <div>
      <h1>useQueryParam</h1>
      <ComponentFoo />
      <UpdateButton for={'foo'} />
      <ComponentBar />
      <UpdateButton for={'bar'} />
      <Link to={'/'}>Go back to list of hooks</Link>
    </div>
  );
};

export default QueryParamExample;
