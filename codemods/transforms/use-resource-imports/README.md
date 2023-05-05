# use-resource-imports codemod

This codemod transforms relevant `react-resource-router` imports to `react-resource-router/resources`

## Usage

```sh
npx @codeshift/cli --packages "react-resource-router#use-resource-imports" source_file.tsx
```

```sh
npx @codeshift/cli --packages "react-resource-router#use-resource-imports" ~my-project/**/*.tsx
```