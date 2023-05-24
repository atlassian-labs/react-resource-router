import {
  getImportDeclaration,
  removeImportDeclaration,
} from '@codeshift/utils';
import type { FileInfo, API } from 'jscodeshift';

const resourcesImportSpecifiers = [
  'createResourcesPlugin',
  'ResourceSubscriber',
  'useResource',
  'addResourcesListener',
  'createResource',
  'useResourceStoreContext',
  'ResourceDependencyError',
  'getResourceStore',
  'ResourceStore',
  'CreateResourceArgBase',
  'CreateResourceArgSync',
  'CreateResourceArgAsync',
  'RouteResources',
  'ResourceStoreContext',
  'ResourceStoreData',
  'RouteResource',
  'RouteResourceError',
  'RouteResourceLoading',
  'RouteResourceResponse',
  'RouteResourceUpdater',
  'RouterDataContext',
  'UseResourceHookResponse',
  'mockRouteResourceResponse',
  'RouteResourceEnabledSubscriber',
];

const packageName = 'react-resource-router';
const resourcesPackageName = 'react-resource-router/resources';

export default function transformer(
  file: FileInfo,
  { jscodeshift: j }: API
): string | undefined {
  const source = j(file.source);

  const rrrImportDeclaration = getImportDeclaration(j, source, packageName);

  if (rrrImportDeclaration.length === 0) {
    return file.source;
  }

  // Here we narrow our search to only relevant import nodes
  const importSpecifiersToMove = rrrImportDeclaration
    .find(j.ImportSpecifier)
    .filter(path =>
      resourcesImportSpecifiers.includes(path.node.imported.name)
    );

  if (importSpecifiersToMove.length > 0) {
    const newImport = j.importDeclaration(
      importSpecifiersToMove.nodes(),
      j.stringLiteral(resourcesPackageName)
    );

    rrrImportDeclaration.insertAfter(newImport);

    // remove "resource" specifiers from rrr import
    rrrImportDeclaration
      .find(j.ImportSpecifier)
      .filter(path =>
        resourcesImportSpecifiers.includes(path.node.imported.name)
      )
      .remove();

    // remove rrr import if empty
    if (rrrImportDeclaration.find(j.ImportSpecifier).length === 0) {
      rrrImportDeclaration.remove();
      removeImportDeclaration(j, source, packageName);
    }
  }

  return source.toSource();
}

export const parser = 'tsx';
