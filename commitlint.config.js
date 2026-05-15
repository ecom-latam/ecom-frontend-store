module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(feat|fix)\(([A-Z]+-\d+)\): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'header-match-pattern': [2, 'always'],
    'subject-case': [2, 'always', 'lower-case'],
  },
  plugins: [
    {
      rules: {
        'header-match-pattern': (parsed) => {
          const { type, scope, subject } = parsed;
          if (!type || !scope || !subject) {
            return [
              false,
              'Commit must follow format: feat(EC-1234): description in lowercase\nAllowed types: feat, fix',
            ];
          }
          return [true, ''];
        },
      },
    },
  ],
};
