# Ehub Project Management System

A comprehensive, scalable project management system designed for fabricators, supervisors, and administrators. Built with React, TypeScript, Node.js, Express, and MySQL.

---
---
## **>> VIEW THE LATES RELEASE OF THIS REPOSITORY TO QUICKLY START LOCAL DEVELOPMENT <<**
---
---

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

The fastest way to get started with full production-ready setup:

```bash
# Clone repository
git clone <repository-url>
cd EHUB_PMSV3

# Configure environment
cp env.production.template .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3002/api
```

### Option 2: Local Development

**For localhost development**: See [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md) for a simple guide.

```bash
npm install
npm run setup      # Setup database
npm run start:full  # Start both frontend and backend
```

Then open http://localhost:5173

## Features

### Multi-Role Authentication
- **Administrators**: Full system access, user management, and oversight
- **Supervisors**: Project management, team coordination, and assignment control  
- **Fabricators**: Task management, work logs, and project participation
- **Clients**: Project status viewing and documentation access

### Core Functionality
- **Project Management**: Create, track, and manage construction/fabrication projects
- **Task Management**: Assign, update, and monitor task progress
- **Work Logs**: Detailed progress reports and time tracking
- **Materials Management**: Track materials usage and costs
- **User Management**: Role-based access control and team administration
- **Revenue Tracking**: Financial overview with role-based visibility
- **Archives System**: Completed project history filtered by organization
- **File Upload**: Support for project documentation and images
- **Email Notifications**: Automated alerts for assignments and updates

### Security Features
- **Secure ID Generation**: Unique FAB/SUP/ADM IDs for user identification
- **Password Hashing**: Secure password storage
- **Role-based Access**: Granular permissions system
- **Forgot Password**: Email-based password recovery
- **Database Integration**: Full Supabase backend with real-time sync

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** primitives with custom components
- **Vite** for build tooling
- **React Hook Form** for form management

### Backend
- **Node.js** with Express.js
- **MySQL 8.0** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Rate Limit** for security

### Infrastructure
- **Docker** & Docker Compose for containerization
- **Nginx** reverse proxy and load balancing
- **Redis** (optional) for caching and sessions
- **Scalable architecture** supporting horizontal scaling

## Quick Start (Localhost)

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account (optional - free tier available at [supabase.com](https://supabase.com))

### Installation Steps

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd ehub-project-management
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables (Optional)**
   
   The app can run in demo mode without Supabase. For full functionality:
   
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_DB_URL=your-database-url
   ```

4. **Deploy Supabase Edge Functions (Optional)**
   
   Only needed if using Supabase backend:
   ```bash
   # Install Supabase CLI globally
   npm install -g supabase
   
   # Login to your Supabase account
   supabase login
   
   # Link to your Supabase project
   supabase link --project-ref your-project-id
   
   # Deploy the server functions
   supabase functions deploy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will start at: **http://localhost:3000**

6. **Access the application**
   - Open your browser to http://localhost:3000
   - Create an administrator account to get started
   - The app works in demo mode if Supabase is not configured

### Running Without Supabase (Demo Mode)

The application can run locally without a Supabase backend connection. In this mode:
- Data is stored in memory (lost on refresh)
- All features are available for testing
- Perfect for development and testing
- No external dependencies required

## Usage

### Initial Setup
1. Login with your administrator credentials
2. The system will automatically initialize the database
3. Create supervisor and fabricator accounts as needed

### User Registration
- **Fabricators**: Can self-register through the signup form
- **Supervisors/Admins**: Must be created by existing administrators
- All users receive unique secure IDs (FAB001, SUP001, ADM001, etc.)

### Login Methods
- **All Users**: Can login with email, employee number, or secure ID
- **Multi-Factor Support**: System supports various identifier types

### Forgot Password
- Click "Forgot Password" on login screen
- Enter email address to receive reset instructions
- System sends credentials reminder and reset options

## 📚 Documentation

### Quick Links
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide (Docker, cloud platforms, VPS)
- **[SCALING_GUIDE.md](./SCALING_GUIDE.md)** - Guide for scaling to handle increased load
- **[Guidelines.md](./guidelines/Guidelines.md)** - Development guidelines and best practices
- **[LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md)** - Quick local development setup

### Deployment Options

#### 🐳 Docker (Recommended)
Production-ready deployment with a single command:
```bash
docker-compose up -d
```
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#docker-deployment) for details.

#### ☁️ Cloud Platforms
- **AWS EC2 + RDS**: Full guide in deployment docs
- **DigitalOcean**: App Platform deployment
- **Heroku**: Platform-as-a-Service option
- **Azure/GCP**: Container-based deployment

#### 🖥️ Traditional VPS
Deploy to any Linux server with Docker support. Full instructions in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Scaling

The application is designed for scalability:
- **Horizontal Scaling**: Scale backend instances easily with Docker Compose
- **Load Balancing**: Automatic load balancing via Nginx
- **Database Optimization**: Connection pooling, indexing, read replicas support
- **Caching**: Redis support for session storage and query caching

See [SCALING_GUIDE.md](./SCALING_GUIDE.md) for detailed scaling strategies.

## Project Structure

```
├── components/           # React components
│   ├── auth/            # Authentication forms
│   ├── dashboard/       # Dashboard widgets
│   ├── projects/        # Project management
│   ├── tasks/           # Task management
│   ├── users/           # User management
│   ├── ui/              # Reusable UI components
│   └── ...
├── supabase/            # Supabase configuration
│   └── functions/       # Edge functions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── styles/              # Global styles
└── data/                # Data management
```

## API Endpoints

RESTful API built with Express.js:

### Authentication
- `POST /api/auth/login` - User authentication (supports admin, supervisor, and regular users)
- `POST /api/auth/signup` - User registration (fabricators)
- `POST /api/auth/forgot-password` - Password reset

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Work Logs
- `GET /api/worklogs` - List work logs
- `POST /api/worklogs` - Create work log entry

### Materials
- `GET /api/materials` - List materials
- `POST /api/materials` - Add material

### Users
- `GET /api/users` - List all users
- `POST /api/users/client` - Create client user
- `POST /api/users/supervisor` - Create supervisor user

### Health
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## Security

### Production Checklist
- ✅ Change all default passwords immediately
- ✅ Generate strong JWT secret (use `openssl rand -base64 32`)
- ✅ Use strong database passwords (min 16 characters)
- ✅ Enable HTTPS/SSL in production
- ✅ Configure firewall rules
- ✅ Enable rate limiting (configured in Nginx)
- ✅ Set up security headers (configured in Nginx)
- ✅ Regular security updates: `docker-compose pull`
- ✅ Automated database backups
- ✅ Never commit `.env` files to version control

### Security Features
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with expiration
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configurable CORS policies
- **Rate Limiting**: API endpoint protection
- **Security Headers**: Comprehensive headers via Nginx

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#security-checklist) for complete security checklist.

## Changelog

### Version 1.0.0
- Initial release with full project management features
- Multi-role authentication system
- Database integration with Supabase
- Responsive design for mobile and desktop
- Email notification system
- File upload and documentation management