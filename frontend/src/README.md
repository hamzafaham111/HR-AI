# Frontend Project Structure

This document outlines the folder structure and organization principles for the React frontend application.

## 📁 Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout-related components
│   │   ├── Layout.js
│   │   ├── Navbar.js
│   │   └── Sidebar.js
│   ├── auth/           # Authentication components
│   │   └── ProtectedRoute.js
│   ├── ui/             # Generic UI components
│   │   └── FileUpload.js
│   └── index.js        # Component exports
├── pages/              # Page components (route-level)
│   ├── Home.js
│   ├── Login.js
│   ├── Register.js
│   ├── Dashboard.js
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   ├── useApi.js
│   └── index.js
├── utils/              # Utility functions
│   ├── api.js          # API helper functions
│   ├── validation.js   # Validation utilities
│   └── index.js
├── constants/          # Application constants
│   ├── routes.js       # Route definitions
│   ├── api.js          # API endpoints and config
│   └── index.js
├── context/            # React Context providers
│   └── AuthContext.js
├── services/           # API service layers
│   ├── api/            # API service files
│   │   └── api.js
│   └── auth/           # Auth service files
├── styles/             # CSS/SCSS files
│   ├── App.css
│   └── index.css
├── types/              # TypeScript type definitions (if using TS)
├── App.js              # Main App component
├── index.js            # Application entry point
└── README.md           # This file
```

## 🏗️ Organization Principles

### 1. **Feature-Based Organization**
- Components are organized by their purpose and scope
- Layout components are separated from UI components
- Authentication components have their own folder

### 2. **Separation of Concerns**
- **Components**: Reusable UI elements
- **Pages**: Route-level components
- **Hooks**: Custom React hooks for logic
- **Utils**: Pure utility functions
- **Constants**: Application-wide constants
- **Services**: API and external service integrations

### 3. **Import/Export Patterns**
- Use index files for clean imports
- Export components from `components/index.js`
- Export hooks from `hooks/index.js`
- Export utilities from `utils/index.js`

### 4. **Naming Conventions**
- **Components**: PascalCase (e.g., `FileUpload.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`)
- **Utils**: camelCase (e.g., `validation.js`)
- **Constants**: UPPER_SNAKE_CASE in files (e.g., `ROUTES`)

## 🔧 Usage Examples

### Importing Components
```javascript
import { Layout, Navbar, FileUpload } from '../components';
```

### Importing Hooks
```javascript
import { useAuth, useApi } from '../hooks';
```

### Importing Utils
```javascript
import { validateEmail, apiRequest } from '../utils';
```

### Importing Constants
```javascript
import { ROUTES, API_ENDPOINTS } from '../constants';
```

## 📋 Best Practices

1. **Keep components small and focused**
2. **Use custom hooks for complex logic**
3. **Centralize constants and configurations**
4. **Use utility functions for common operations**
5. **Maintain consistent naming conventions**
6. **Document complex components and functions**
7. **Use TypeScript for better type safety (optional)**

## 🚀 Adding New Features

When adding new features:

1. **Components**: Add to appropriate subfolder in `components/`
2. **Pages**: Add to `pages/` folder
3. **Hooks**: Add to `hooks/` folder
4. **Utils**: Add to `utils/` folder
5. **Constants**: Add to `constants/` folder
6. **Services**: Add to `services/` folder

## 📝 Notes

- This structure follows React best practices and modern conventions
- It's scalable and maintainable for growing applications
- All imports should use the index files for consistency
- Keep the structure flat where possible to avoid deep nesting 