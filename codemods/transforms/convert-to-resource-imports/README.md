# react-resouce-router to react-resource-router/resources codemod

This codemod transforms relevant `react-resource-router` imports to `react-resource-router/resources`

## How to run

Via the CLI

```
npm run codeshift -- --transform codemods/transforms/convert-to-resource-imports/index.ts source_file.tsx
```


```
npm run codeshift -- --transform codemods/transforms/convert-to-resource-imports/index.ts ~my-project/**/*.tsx
```