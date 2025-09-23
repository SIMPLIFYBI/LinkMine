# MineLink Application

## Overview
MineLink is a web application designed to manage and track assets and their associated activities. It provides a user-friendly interface for managing vendors, assets, and locations, leveraging the power of Supabase for backend services.

## Project Structure
The project is organized into several key directories and files:

- **app/**: Contains the main application components and styles.
  - **assets/**: Includes components related to asset management.
  - **layout.jsx**: Defines the layout structure for the application.
  - **page.jsx**: Serves as the main entry point for the application.
  - **globals.css**: Contains global CSS styles.

- **components/**: Contains reusable UI components.
  - **icons/**: Includes icon components used throughout the application.
  - **ui/**: Contains UI elements like buttons and modals.

- **lib/**: Contains utility files for managing application state and database interactions.
  - **supabaseClient.js**: Initializes and interacts with the Supabase client.
  - **OrgContext.js**: Manages organization-related state.

- **styles/**: Contains stylesheets for the application.
  - **tailwind.css**: Imports Tailwind CSS styles.

- **public/**: Intended for static assets such as images and fonts.

## Installation
To get started with the MineLink application, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd MineLink
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to view the application.

## Features
- Manage assets, locations, and vendors.
- View asset history and activity types.
- Responsive design using Tailwind CSS.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.