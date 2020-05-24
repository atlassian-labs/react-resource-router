/*
    Tests the current implemented usage of generatePath from src/project-settings-apps/issue-type-page/view/main-header/edit-workflow-button. These tests are purposely not co-located with EditWorkflowButton because they test generatePath functionality. We want these tests to maintain certainty that we don't introduce application regressions as we continue iterating on @atlassian/spa-router
*/

import generatePath from '../../../../../common/utils/generate-path';

describe('generatePath', () => {
  describe('tests covering cases for PROJECT_SETTINGS_ISSUE_TYPES_ROUTE', () => {
    const PROJECT_SETTINGS_ISSUE_TYPES_ROUTE =
      '/projects/:projectKey/settings/issuetypes/:issueTypeId?';

    it('should resolve url with params supplied', () => {
      const resolvedUrl = generatePath(PROJECT_SETTINGS_ISSUE_TYPES_ROUTE, {
        projectKey: 'PEN',
        issueTypeId: 10001,
      });
      expect(resolvedUrl).toBe('/projects/PEN/settings/issuetypes/10001');
    });

    it('should resolve url with params supplied, with optional param excluded', () => {
      const resolvedUrl = generatePath(PROJECT_SETTINGS_ISSUE_TYPES_ROUTE, {
        projectKey: 'PEN',
      });
      expect(resolvedUrl).toBe('/projects/PEN/settings/issuetypes');
    });
  });

  describe('tests covering cases for PROJECT_SETTINGS_WORKFLOW_EDITOR_ROUTE', () => {
    const PROJECT_SETTINGS_WORKFLOW_EDITOR_ROUTE =
      '/projects/:projectKey/settings/issuetypes/:issueTypeId/:initialSection(workflow)';

    /*
              Re: :initialSection(workflow)
              This syntax creates a route parameter called `initialSection` and that only
              matches when the regular expression between parentheses also matches. At the
              moment it only matches `workflow` because it's the only thing we have created
              so far, but could be very easily expanded to match other parts of donut world
              like screens or fields later on.
             */
    const initialSection = 'workflow';

    it('should resolve url where "initialSection" matches "workflow"', () => {
      const resolvedUrl = generatePath(PROJECT_SETTINGS_WORKFLOW_EDITOR_ROUTE, {
        projectKey: 'PEN',
        issueTypeId: 10001,
        initialSection,
      });
      const expectedUrl = `/projects/PEN/settings/issuetypes/10001/${initialSection}`;
      expect(resolvedUrl).toBe(expectedUrl);
    });

    it('should throw where "initialSection" does not match "workflow', () => {
      expect(() =>
        generatePath(PROJECT_SETTINGS_WORKFLOW_EDITOR_ROUTE, {
          projectKey: 'PEN',
          issueTypeId: 10001,
          initialSection: 'play',
        }),
      ).toThrow();
    });
  });

  // https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/__tests__/generatePath-test.js
  describe('React Router tests', () => {
    describe('with pattern="/"', () => {
      it('returns correct url with no params', () => {
        const pattern = '/';
        const generated = generatePath(pattern);
        expect(generated).toBe('/');
      });

      it('returns correct url with params', () => {
        const pattern = '/';
        const params = { foo: 'tobi', bar: 123 };
        const generated = generatePath(pattern, params);
        expect(generated).toBe('/');
      });
    });

    describe('with pattern="/:foo/somewhere/:bar"', () => {
      it('throws with no params', () => {
        const pattern = '/:foo/somewhere/:bar';
        expect(() => {
          generatePath(pattern);
        }).toThrow();
      });

      it('throws with some params', () => {
        const pattern = '/:foo/somewhere/:bar';
        const params = { foo: 'tobi', quux: 999 };
        expect(() => {
          generatePath(pattern, params);
        }).toThrow();
      });

      it('returns correct url with params', () => {
        const pattern = '/:foo/somewhere/:bar';
        const params = { foo: 'tobi', bar: 123 };
        const generated = generatePath(pattern, params);
        expect(generated).toBe('/tobi/somewhere/123');
      });

      it('returns correct url with additional params', () => {
        const pattern = '/:foo/somewhere/:bar';
        const params = { foo: 'tobi', bar: 123, quux: 999 };
        const generated = generatePath(pattern, params);
        expect(generated).toBe('/tobi/somewhere/123');
      });
    });

    describe('with no path', () => {
      it('matches the root URL', () => {
        const generated = generatePath();
        expect(generated).toBe('/');
      });
    });
  });
});
