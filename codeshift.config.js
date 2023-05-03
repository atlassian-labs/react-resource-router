module.exports = {
  presets: {
    'use-resource-imports': require.resolve(
      './codemods/transforms/use-resource-imports'
    ),
  },
};
