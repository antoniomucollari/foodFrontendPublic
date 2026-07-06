# FoodApp Frontend

A modern, responsive food ordering application built with React, Tailwind CSS, and shadcn/ui components.

## Features

### 🍽️ **Menu Management**
- Browse menu items with categories
- Search and filter functionality
- High-quality food images
- Detailed item descriptions and pricing

### 🛒 **Shopping Cart**
- Add/remove items from cart
- Quantity management
- Real-time price calculation
- Persistent cart state

### 👤 **User Authentication**
- User registration and login
- JWT token-based authentication
- Role-based access control (Customer/Admin)
- Secure password handling

### 📦 **Order Management**
- Place orders from cart
- Order history and tracking
- Order status updates
- Admin order management

### ⭐ **Review System**
- Rate and review menu items
- Average rating display
- Customer feedback

### 🔧 **Admin Panel**
- Manage menu items and categories
- Order status management
- Customer statistics
- Dashboard with key metrics

## Tech Stack

- **React 19** - Frontend framework
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.jsx      # Main layout component
│   ├── ProtectedRoute.jsx
│   └── ReviewModal.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Menu.jsx
│   ├── Cart.jsx
│   ├── Orders.jsx
│   └── AdminPanel.jsx
├── services/           # API services
│   └── api.js
├── lib/                # Utility functions
│   └── utils.js
└── App.jsx            # Main app component
```

## API Integration

The frontend integrates with the following backend endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Users**: `/api/users/*`
- **Menu**: `/api/menu/*`
- **Categories**: `/api/categories/*`
- **Cart**: `/api/cart/*`
- **Orders**: `/api/orders/*`
- **Reviews**: `/api/reviews/*`
- **Roles**: `/api/roles/*`

## Features in Detail

### Responsive Design
- Mobile-first approach
- Responsive navigation
- Touch-friendly interface
- Optimized for all screen sizes

### State Management
- React Context for global state
- TanStack Query for server state
- Local state for component-specific data

### Error Handling
- Global error boundaries
- API error handling
- User-friendly error messages
- Loading states

### Security
- JWT token management
- Protected routes
- Role-based access control
- Input validation

## Customization

### Styling
The app uses Tailwind CSS with custom design tokens. You can customize the appearance by modifying:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Global styles and CSS variables

### Components
shadcn/ui components can be customized by modifying the component files in `src/components/ui/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.