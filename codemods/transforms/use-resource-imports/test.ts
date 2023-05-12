import { applyTransform } from '@codeshift/test-utils';

import * as transformer from './index';

it('codemod should move resources imports to react-resource-router/resources', async () => {
  const result = await applyTransform(
    transformer,
    `
      import { Link, createResource, useResource } from 'react-resource-router';

      const Button = (props) => <button {...props} />;
    `
  );

  expect(result).toContain(`import { Link } from 'react-resource-router';`);
  expect(result).toContain(
    `import { createResource, useResource } from "react-resource-router/resources"`
  );
});
