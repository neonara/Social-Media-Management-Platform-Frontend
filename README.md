# PlanIt - Social Media Management Platform

A modern, feature-rich social media management platform built with Next.js 15, designed to help brands and content managers streamline their social media operations.

## 🚀 Features

- **Content Management**: Create, edit, and schedule social media posts
- **Multi-Platform Support**: Manage content across various social media platforms
- **User Management**: Role-based access control for teams and clients
- **Analytics Dashboard**: Track performance with interactive charts and metrics
- **Drag & Drop Interface**: Intuitive content organization and post scheduling
- **Rich Text Editor**: Advanced WYSIWYG editor with image support
- **Real-time Notifications**: Stay updated with live notifications
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for better user experience

## �️ Tech Stack

- **Framework**: Next.js 15.1.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Charts**: ApexCharts with React integration
- **Drag & Drop**: DnD Kit
- **Rich Text Editing**: TipTap
- **Authentication**: NextAuth.js
- **Date Handling**: Day.js, date-fns
- **Icons**: Lucide React, React Icons
- **Maps**: JSVectorMap
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast, React Toastify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn** or **pnpm**
- **Git**

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd planit/frontend
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your environment variables:

```env
# Add your environment variables here
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
# Add other required environment variables
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (home)/            # Main application routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── Auth/             # Authentication components
│   ├── Charts/           # Chart components
│   ├── Tables/           # Data table components
│   ├── ui/               # Base UI components
│   └── ...
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API service functions
├── types/                # TypeScript type definitions
└── utils/                # Helper utilities
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Styling

This project uses:

- **Tailwind CSS** for utility-first styling
- **Custom CSS** for specific design requirements
- **CSS Variables** for theme management
- **Responsive Design** principles

## 🔐 Authentication

The application includes a robust authentication system with:

- User registration and login
- Role-based access control
- Session management with NextAuth.js
- Protected routes and middleware

## 📊 Dashboard Features

- **Analytics Charts**: Interactive charts showing social media metrics
- **Content Calendar**: Visual scheduling interface
- **User Management**: Admin panel for managing team members
- **Content Library**: Organize and manage media assets
- **Performance Tracking**: Monitor engagement and reach

## 🔌 API Integration

The frontend communicates with backend services through:

- RESTful API endpoints
- Axios for HTTP requests
- Service layer architecture
- Error handling and loading states

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop computers
- Tablets
- Mobile devices
- Various screen sizes and orientations

## 🌙 Theme Support

- Light and dark theme modes
- System theme detection
- Persistent theme preferences
- Smooth theme transitions

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Support

The project includes a Dockerfile for containerized deployment:

```bash
docker build -t planit-frontend .
docker run -p 3000:3000 planit-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

This project follows:

- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Conventional commit** messages

## 🐛 Known Issues

- Check the [Issues](../../issues) page for current known issues
- Report bugs using the issue template

## 📄 License

This project is private and proprietary. All rights reserved.

## 👥 Team

This project is maintained by the Brand And Com development team.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a Next.js application focused on social media management. Make sure to configure all environment variables properly before deployment.
