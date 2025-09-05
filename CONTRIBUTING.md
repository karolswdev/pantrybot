# Contributing to Fridgr

First off, thank you for considering contributing to Fridgr! It's people like you that make Fridgr such a great tool for reducing food waste and helping households manage their food inventory better.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues where we need community help
- `documentation` - Help improve our docs

## Development Process

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git
- A code editor (VS Code recommended)

### Setting Up Your Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/fridgr.git
   cd fridgr
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/KaShaSoft/food-ventory.git
   ```

4. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Mock Backend
   cd ../mock-backend/mock-backend
   npm install
   ```

5. Start the development environment:
   ```bash
   # Using Docker (recommended)
   docker-compose up -d
   
   # Or manually
   cd frontend && npm run dev
   cd mock-backend/mock-backend && npm start
   ```

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards (see below)

3. Write or update tests as needed

4. Run tests to ensure everything passes:
   ```bash
   # Frontend tests
   cd frontend
   npm test
   npm run test:e2e
   npm run lint
   npm run type-check
   ```

5. Commit your changes using a descriptive commit message:
   ```bash
   git commit -m "feat: add new feature"
   ```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons, etc)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add barcode scanning support
fix: resolve inventory sync issue
docs: update API documentation
```

### Pull Request Process

1. Update your branch with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request through GitHub

4. Ensure your PR:
   - Has a clear title and description
   - References any related issues
   - Includes tests for new functionality
   - Passes all CI checks
   - Has been tested locally

5. Wait for review from maintainers

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Prefer functional components in React
- Use React Hooks appropriately
- Avoid `any` types - be explicit with types
- Document complex functions with JSDoc comments

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use CSS variables for theming

### Testing

- Write E2E tests for new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test edge cases and error scenarios

### File Organization

```
frontend/
├── app/              # Next.js pages
├── components/       # Reusable components
│   └── [feature]/   # Feature-specific components
├── hooks/           # Custom hooks
├── lib/             # Utilities and helpers
└── types/           # TypeScript type definitions
```

## Documentation

- Update README.md if adding new features
- Document API changes in `.pm/api-specifications.md`
- Add JSDoc comments for complex functions
- Update user documentation for user-facing changes

## Review Process

All contributions go through the following review process:

1. **Automated checks** - Linting, type checking, and tests must pass
2. **Code review** - At least one maintainer reviews the code
3. **Testing** - Manual testing of the feature/fix
4. **Documentation review** - Ensuring docs are updated
5. **Merge** - Once approved, maintainers will merge your PR

## Community

- Join our [GitHub Discussions](https://github.com/KaShaSoft/food-ventory/discussions)
- Report issues on [GitHub Issues](https://github.com/KaShaSoft/food-ventory/issues)
- Follow us for updates

## Recognition

Contributors will be recognized in our README and release notes. We value every contribution, no matter how small!

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

Thank you for contributing to Fridgr! Together, we're reducing food waste one household at a time 🌱