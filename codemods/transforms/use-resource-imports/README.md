# use-resource-imports codemod

This codemod transforms relevant `react-resource-router` imports to `react-resource-router/resources`

## Usage

```sh
npm run codeshift -- --transform codemods/transforms/convert-to-resource-imports/index.ts source_file.tsx
```

```sh
npm run codeshift -- --transform codemods/transforms/convert-to-resource-imports/index.ts ~my-project/**/*.tsx
```