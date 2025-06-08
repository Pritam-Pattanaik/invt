# Roti Factory ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for roti manufacturing businesses with franchise and counter management capabilities.

## 🏭 Features

### Manufacturing Unit Management
- **Inventory Management**: Track raw materials (flour, spices, etc.) and finished products
- **Production Planning**: Schedule production based on demand and resources
- **Quality Control**: Manage quality checks at various production stages
- **Equipment Maintenance**: Schedule and track machinery maintenance

### Franchise Management
- **Franchise Onboarding**: Streamlined setup process for new franchises
- **Sales Tracking**: Monitor performance across all franchise locations
- **Inventory Replenishment**: Automated inventory management and ordering
- **Royalty Management**: Calculate and track royalty payments

### Counter Management
- **POS Integration**: Seamless point-of-sale system integration
- **Order Management**: Efficient order processing and tracking
- **Cash Management**: Complete cash flow and transaction management
- **Customer Relationship Management**: Loyalty programs and customer data

### Reporting & Analytics
- **Real-time Dashboards**: Live insights into key performance indicators
- **Custom Reports**: Flexible reporting on all business aspects
- **Predictive Analytics**: Demand forecasting and optimization

## 🛠️ Technology Stack

- **Frontend**: React.js with Vite, Anime.js for animations
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Neon (Cloud)
- **ORM**: Prisma
- **Authentication**: JWT-based with role-based access control
- **Styling**: Tailwind CSS with white and green theme

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/roti-factory-erp.git
cd roti-factory-erp
```

2. Install dependencies
```bash
npm run setup
```

3. Set up environment variables
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Set up the database
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the development servers
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5174
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555 (run `npm run db:studio`)

## 🌐 Deployment

### Deploy to Vercel

1. **Prepare for deployment**
```bash
npm run build
```

2. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. **Deploy on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `JWT_SECRET`: Strong secret key for JWT tokens
     - `JWT_REFRESH_SECRET`: Strong secret key for refresh tokens
     - `NODE_ENV`: production
   - Deploy!

### Environment Variables for Production

Set these environment variables in Vercel:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_NsG3bmhO6lHV@ep-weathered-hall-a1pj359g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 📁 Project Structure

```
roti-factory-erp/
├── client/                 # React.js frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   ├── animations/     # Anime.js configurations
│   │   └── styles/         # CSS and styling
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── uploads/            # File uploads
└── docs/                   # Documentation
```

## 🔐 User Roles

- **Super Admin**: Full system access and configuration
- **Admin**: Administrative access to all modules
- **Manager**: Management access to assigned modules
- **Franchise Manager**: Franchise-specific management access
- **Counter Operator**: POS and counter operations access

## 💰 Currency

All monetary values are displayed in Indian Rupees (₹).

## 🎨 Design System

The application uses a clean white and green color scheme optimized for the food industry, with smooth animations powered by Anime.js.

## 📊 API Documentation

API documentation is available at `/api/docs` when running the development server.

## 🧪 Testing

```bash
# Run frontend tests
cd client && npm test

# Run backend tests
cd server && npm test
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
