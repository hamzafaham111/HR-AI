# HR AI Backend - NestJS

A production-ready HR management system built with NestJS, MongoDB, and AI-powered resume analysis.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Job Management**: Create, update, and manage job postings with AI-powered text parsing
- **Resume Bank**: Upload and manage resumes with AI-powered candidate extraction
- **Dashboard**: Comprehensive analytics and insights
- **Hiring Processes**: Manage candidate pipelines and recruitment workflows
- **Meetings**: Schedule and manage interviews
- **Job Applications**: Handle public job applications

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with Passport
- **Validation**: Class Validator & Class Transformer
- **Documentation**: Swagger/OpenAPI
- **AI Integration**: OpenAI API
- **File Upload**: Multer

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- OpenAI API Key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-nestjs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Configure your `.env` file with the required variables:
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=resume_analysis

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, you can access the Swagger documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password

### Job Management
- `POST /api/v1/jobs` - Create a new job posting
- `GET /api/v1/jobs` - Get all job postings
- `GET /api/v1/jobs/:id` - Get specific job posting
- `PUT /api/v1/jobs/:id` - Update job posting
- `DELETE /api/v1/jobs/:id` - Delete job posting
- `POST /api/v1/jobs/parse-text` - Parse job text with AI

### Resume Bank
- `POST /api/v1/resume-bank/upload` - Upload resume
- `GET /api/v1/resume-bank` - Get all resumes
- `GET /api/v1/resume-bank/:id` - Get specific resume
- `PUT /api/v1/resume-bank/:id` - Update resume
- `DELETE /api/v1/resume-bank/:id` - Delete resume
- `GET /api/v1/resume-bank/stats` - Get resume statistics
- `GET /api/v1/resume-bank/search-candidates/:jobId` - Search candidates for job

### Dashboard
- `GET /api/v1/dashboard/overview` - Get dashboard overview
- `GET /api/v1/dashboard/statistics` - Get detailed statistics
- `GET /api/v1/dashboard/analytics` - Get comprehensive analytics
- `GET /api/v1/dashboard/quick-stats` - Get quick stats

## Project Structure

```
src/
├── common/                 # Shared utilities and DTOs
│   ├── dto/               # Common DTOs (pagination, response)
│   └── database/          # Database configuration
├── config/                # Configuration files
├── modules/               # Feature modules
│   ├── auth/              # Authentication module
│   ├── jobs/              # Job management module
│   ├── resume-bank/       # Resume bank module
│   ├── dashboard/         # Dashboard module
│   ├── hiring-processes/  # Hiring processes module
│   ├── meetings/          # Meetings module
│   └── job-applications/  # Job applications module
├── app.module.ts          # Root module
└── main.ts                # Application entry point
```

## Development

### Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode
- Class-based validation with decorators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
