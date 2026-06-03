// SunClaw commit-message lint config — Conventional Commits.
// Upstream already uses conventional-style messages (`fix(scope): ...`,
// `feat: ...`); commitlint enforces it mechanically and unblocks Release-Please.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
