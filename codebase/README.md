# Civic Saathi

An intelligent maintenance management platform leveraging AI to streamline issue tracking, analysis, and resolution across institutional environments.

## Features

- **AI-Powered Analysis**: Automatic categorization and severity assessment of maintenance issues using Google Gemini API
- **Role-Based Access**: User and admin roles with appropriate permissions and dashboards
- **Real-time Tracking**: Live status updates and progress monitoring for all maintenance issues
- **Community Voting**: Upvote system to prioritize the most important issues
- **Technician Management**: Track specialist availability and assignments
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** components for consistent design
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Firebase Authentication** for user management

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Google Gemini API** for AI analysis
- **RESTful API** design

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Firebase project (for authentication)
- Google Gemini API key

### Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=your_postgresql_connection_string
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/maintain-ai.git
cd maintain-ai
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables (see above)

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Demo Login

For testing purposes, you can use these credentials:

- **Admin User**: username: `admin`, password: `password`
- **Regular User**: username: `user`, password: `password`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── index.css       # Global styles
├── server/                 # Express backend
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── services/           # External service integrations
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema and types
└── package.json
```

## Database Schema

- **Users**: Firebase UID integration, role-based access, credibility scoring
- **Maintenance Issues**: Comprehensive tracking with AI analysis and progress monitoring
- **Technicians**: Specialist tracking with availability status
- **Comments**: Threaded commenting system for collaboration
- **Upvotes**: Community voting mechanism for issue prioritization

## API Endpoints

### Authentication

- `GET /api/users/firebase/:uid` - Get user by Firebase UID
- `POST /api/users` - Create new user

### Issues

- `GET /api/issues` - Get all issues
- `GET /api/issues/:id` - Get specific issue
- `POST /api/issues` - Create new issue
- `PATCH /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `POST /api/issues/:id/upvote` - Toggle upvote

### Technicians

- `GET /api/technicians` - Get all technicians
- `POST /api/technicians` - Create technician
- `PATCH /api/technicians/:id` - Update technician

### AI Analysis

- `POST /api/analyze-issue` - Analyze issue with Gemini AI

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
