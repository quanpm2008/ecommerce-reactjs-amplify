# E-Commerce Frontend

A modern, fully-featured React + TypeScript e-commerce frontend application with AWS Cognito authentication and GraphQL API integration.

## 🚀 Features

- **Authentication**: AWS Cognito Hosted UI OAuth flow
- **Product Browsing**: Product listing, filtering by category, and detailed product views
- **Shopping Cart**: Persistent cart with add/remove/update quantity
- **Checkout**: Address form, delivery pricing calculation, and order placement
- **Order Management**: View order history and order details
- **Responsive Design**: Mobile-first, responsive UI built with TailwindCSS
- **Type Safety**: Full TypeScript support
- **GraphQL Integration**: Apollo Client for efficient data fetching

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS Account with:
  - Cognito User Pool configured
  - AppSync GraphQL API endpoint
- Environment variables configured (see below)

## 🛠️ Installation

1. **Install Dependencies**

```bash
cd frontend
npm install
```

2. **Configure Environment Variables**

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your AWS configuration:

```env
# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:3000

# GraphQL API Configuration
VITE_GRAPHQL_ENDPOINT=https://your-api-endpoint.appsync-api.us-east-1.amazonaws.com/graphql
```

3. **Start Development Server**

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Header, Footer, Layout
│   │   ├── product/        # ProductCard, ProductGrid
│   │   └── ui/             # Button, Input, Card, Modal, Spinner
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── CartContext.tsx # Shopping cart state
│   ├── graphql/            # GraphQL queries and mutations
│   │   └── queries.ts
│   ├── lib/                # Third-party library configurations
│   │   └── apollo.ts       # Apollo Client setup
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   └── CallbackPage.tsx
│   ├── services/           # Business logic services
│   │   └── auth.ts         # Cognito OAuth service
│   ├── store/              # Zustand stores
│   │   └── cartStore.ts    # Cart state management
│   ├── types/              # TypeScript type definitions
│   │   ├── auth.ts
│   │   └── graphql.ts
│   ├── config/             # Application configuration
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.js     # TailwindCSS config
└── README.md              # This file
```

## 🎨 Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: Zustand (cart), React Context (auth)
- **GraphQL Client**: Apollo Client
- **Routing**: React Router v6
- **Authentication**: AWS Cognito (OAuth 2.0)

## 🔐 Authentication Flow

1. User clicks "Sign In"
2. Redirects to Cognito Hosted UI
3. User authenticates with Cognito
4. Cognito redirects back to `/callback` with authorization code
5. App exchanges code for tokens
6. Tokens stored in localStorage
7. User is authenticated

## 📱 Key Pages

### Home Page (`/`)
Landing page with hero section and feature highlights

### Products Page (`/products`)
- Product grid with images, prices, and "Add to Cart" buttons
- Category filtering
- Pagination support

### Product Detail Page (`/products/:id`)
- Product images gallery
- Full description and pricing
- Quantity selector
- Add to cart functionality

### Cart Page (`/cart`)
- List of cart items
- Quantity controls
- Order summary
- Proceed to checkout

### Checkout Page (`/checkout`)
- Shipping address form
- Delivery price calculation
- Mock payment information
- Order placement

### Orders Page (`/orders`)
- List of user's orders
- Order status badges
- Quick order summary

### Order Detail Page (`/orders/:id`)
- Complete order information
- Item details
- Shipping address
- Order status

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 🌐 API Integration

The frontend integrates with the AWS AppSync GraphQL API. Key operations:

### Queries
- `getProducts` - Fetch product list
- `getProduct` - Get single product
- `getOrders` - Get user orders
- `getOrder` - Get single order
- `getDeliveryPricing` - Calculate shipping cost

### Mutations
- `createOrder` - Place a new order

See `src/graphql/queries.ts` for full query definitions.

## 🎯 GraphQL Schema Types

All GraphQL types are defined in `src/types/graphql.ts`:
- Product, PaginatedProducts
- Order, OrderStatus, PaginatedOrders
- Address, OrderProduct
- DeliveryPricingInput, DeliveryPricingResponse
- CreateOrderRequest, CreateOrderResponse

## 🛒 Cart Management

The shopping cart uses Zustand for state management with localStorage persistence:

```typescript
const { items, addItem, removeItem, updateQuantity, clearCart } = useCart();
```

Cart state persists across browser sessions.

## 🔒 Protected Routes

Currently, all routes are accessible without authentication. To add route protection:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};
```

## 🎨 Styling

### TailwindCSS
Primary color scheme defined in `tailwind.config.js`:
- primary-50 to primary-900

### Custom Components
All UI components in `src/components/ui/` support:
- Multiple variants
- Different sizes
- Full customization via className prop

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to AWS

Example deployment to S3 + CloudFront:

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Environment Variables in Production

Update `.env` or configure in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment
- AWS Amplify: App Settings → Environment Variables

## 🐛 Troubleshooting

### Authentication Issues

- Verify Cognito User Pool ID and Client ID
- Check redirect URIs are correctly configured in Cognito
- Ensure callback URL is added to allowed URLs

### GraphQL Errors

- Check API endpoint URL
- Verify authentication tokens are being sent
- Review network tab for API responses

### Build Errors

- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist .vite`

## 📝 Future Enhancements

- [ ] User profile page
- [ ] Product search functionality
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Order tracking with real-time updates
- [ ] Multiple payment methods
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Email notifications

## 📄 License

This project is part of the AWS Serverless E-Commerce Platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions, please open a GitHub issue in the main repository.
