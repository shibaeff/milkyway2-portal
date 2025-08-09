# Validator Dashboard

A React application showcasing a Polkadot validator dashboard with statistics, validator lists, and favorites functionality.

## Features

- **Validator Statistics**: Display total validators, active validators, and average commission
- **Validator List**: Browse all network validators with detailed information
- **Favorites**: Mark and manage favorite validators
- **Responsive Design**: Modern UI with clean, professional styling
- **Internationalization**: Support for multiple languages (currently English)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── contexts/           # React contexts for state management
│   ├── Api.tsx        # API context for network data
│   ├── EraStakers.tsx # Era stakers context
│   └── Validators/    # Validator-related contexts
├── library/           # Reusable UI components
│   ├── Card/         # Card wrapper components
│   ├── StatCards/    # Statistics display components
│   └── ...
├── ui-core/          # Core UI components
├── ui-graphs/        # Graph utilities
├── utils/            # Utility functions
├── Validators/       # Main validator components
│   ├── Stats/        # Statistics components
│   └── ...
└── App.tsx          # Main application component
```

## Components

### Validators
The main validator dashboard component with tabs for:
- **All Validators**: Browse all network validators
- **Favorites**: View and manage favorite validators

### Statistics
- **Total Validators**: Shows total vs maximum validators
- **Active Validators**: Displays active validator count
- **Average Commission**: Shows average commission rate

### Validator List
Displays validator information including:
- Rank
- Identity
- Address (truncated)
- Commission rate
- Active status
- Favorite toggle

## Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **react-i18next**: Internationalization
- **BigNumber.js**: Precise number handling
- **CSS-in-JS**: Inline styles for component styling

## Mock Data

The application uses mock data to simulate a real Polkadot network environment:
- 297 total validators (max 1000)
- 285 active validators
- 5.3% average commission
- Sample validator entries with realistic data

## Customization

You can customize the mock data by modifying the context providers in `src/contexts/`. The application is designed to be easily adaptable to real API endpoints.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder. 