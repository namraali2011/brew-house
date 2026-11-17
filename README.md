# BrewHouse — Dynamic Café Menu Website

A responsive, database-powered café website built using Next.js, TypeScript, Tailwind CSS, and NeonDB PostgreSQL.

BrewHouse allows users to view café menu items, add new products, and delete existing products. All menu data is retrieved from a PostgreSQL database rather than being hardcoded in the frontend.

This project was developed as a database-integrated web application assignment.

## Features

- **Dynamic menu:** Menu items are fetched from NeonDB PostgreSQL.
- **Add menu items:** Add products using a form with name, price, description, and category.
- **Delete menu items:** Remove products using a delete button and confirmation dialog.
- **Category filters:** Browse Coffee, Dessert, and Snacks.
- **Persistent storage:** Database changes remain saved after refreshing the page.
- **Responsive design:** The interface adapts to desktop and mobile screens.
- **Error handling:** Loading indicators, validation messages, and API error responses.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Frontend and backend framework |
| React | Components and state management |
| TypeScript | Type-safe application code |
| Tailwind CSS | Responsive styling |
| NeonDB PostgreSQL | Relational database |
| Neon Serverless Driver | Database queries |
| Lucide React | Interface icons |

## Project Structure

```text
brewhouse/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── menu/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       └── db.ts
├── screenshots/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

Next.js configuration files and other generated files are also included in the repository.

## Prerequisites

Before running the application, install or prepare:

- Node.js compatible with the Next.js version in `package.json`
- npm
- A NeonDB PostgreSQL project
- Git (optional, for version control)

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/brewhouse.git
cd brewhouse
```

Replace `YOUR_USERNAME` with the actual repository owner's GitHub username.

**2. Install dependencies**

```bash
npm install
```

**3. Create the database**

Open the Neon Console and select the SQL Editor.

Run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Coffee',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Optional Sample Data

Run the following SQL once to populate the initial menu:

```sql
INSERT INTO menu_items
(name, price, description, category)
VALUES
(
    'Classic Cappuccino',
    550.00,
    'Rich espresso topped with velvety steamed milk and a delicate foam finish.',
    'Coffee'
),
(
    'Caramel Latte',
    650.00,
    'Smooth espresso combined with steamed milk and sweet caramel.',
    'Coffee'
),
(
    'Iced Americano',
    450.00,
    'Bold espresso served over chilled water and ice.',
    'Coffee'
),
(
    'Spanish Latte',
    700.00,
    'Creamy espresso with sweet condensed milk and a silky finish.',
    'Coffee'
),
(
    'Chocolate Brownie',
    480.00,
    'A rich, fudgy chocolate brownie made for your sweet cravings.',
    'Dessert'
),
(
    'New York Cheesecake',
    750.00,
    'Smooth and creamy cheesecake with a buttery biscuit base.',
    'Dessert'
),
(
    'Chicken Sandwich',
    850.00,
    'Tender chicken layered with fresh vegetables and a creamy dressing.',
    'Snacks'
),
(
    'Butter Croissant',
    400.00,
    'A golden, flaky pastry with a soft and buttery center.',
    'Snacks'
);
```

**4. Configure environment variables**

Create a `.env.local` file in the project root.

Copy the variable name from `.env.example` and insert your own NeonDB connection string:

```dotenv
DATABASE_URL="YOUR_NEON_DATABASE_CONNECTION_STRING"
```

Obtain the connection string from the Neon Console.

Never commit `.env.local` or share the database password publicly.

**5. Run the application**

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## API Endpoints

All database operations use Next.js App Router API route handlers located at `src/app/api/menu/route.ts`.

### GET /api/menu

Retrieves all menu items from the database, ordered by newest first.

Example request:

```http
GET /api/menu
```

Example response structure:

```json
{
  "success": true,
  "message": "Menu items fetched successfully.",
  "data": []
}
```

The `data` array contains menu records when the database has items.

### POST /api/menu

Adds a new menu item to NeonDB.

Example request body:

```json
{
  "name": "Vanilla Latte",
  "price": 650,
  "description": "Smooth espresso with vanilla and steamed milk.",
  "category": "Coffee"
}
```

On success, the API returns HTTP status `201` with the saved menu item.

### DELETE /api/menu

Deletes a menu item using its database ID.

Example request body:

```json
{
  "id": 1
}
```

On success, the API returns a confirmation message.

The ID must identify an existing menu item.

## How the Application Works

1. The frontend loads and calls `GET /api/menu` using `fetch()`.
2. The API handler queries the `menu_items` PostgreSQL table.
3. The retrieved records are rendered as menu cards.
4. Submitting the add-item form sends a `POST` request.
5. The API validates the data and inserts the item into PostgreSQL.
6. Deleting an item sends a `DELETE` request with its ID.
7. The interface updates after successful API responses.
8. Refreshing the page fetches the latest saved database records.

The application uses React `useState()` and `useEffect()` for client-side state management.

## Database Schema

| Field | Data Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| name | VARCHAR(150) | Menu item name |
| price | NUMERIC(10,2) | Item price |
| description | TEXT | Item description |
| category | VARCHAR(50) | Menu category |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Testing

- [ ] Homepage loads without errors.
- [ ] Menu items load from NeonDB.
- [ ] Category filtering works.
- [ ] A menu item can be added.
- [ ] Newly added data remains after refreshing.
- [ ] A menu item can be deleted.
- [ ] Deleted data stays removed after refreshing.
- [ ] API returns appropriate success and error responses.
- [ ] `npm run build` completes successfully.

## Screenshots

The `screenshots/` directory contains evidence of the application.

## Security Notes

The NeonDB connection string is stored in `.env.local`, which is excluded from Git tracking.

Database operations run through Next.js server-side API handlers rather than directly in the browser.

The API uses parameterized SQL queries and server-side input validation.

**Important:** The application intentionally does not include authentication because it is a classroom project. The add and delete endpoints are not suitable for unrestricted public use without additional access controls.

## Assignment Requirements

| Requirement | Implementation |
|---|---|
| Dynamic menu | NeonDB GET endpoint |
| Add menu item | React form and POST endpoint |
| Delete menu item | DELETE endpoint |
| Persistent changes | PostgreSQL database |
| Next.js App Router | Implemented |
| Tailwind CSS | Implemented |
| Database connection | Neon Serverless Driver |
| Setup instructions | Included in this README |
| SQL table creation | Included in this README |

## Conclusion

BrewHouse demonstrates a simple full-stack web application using Next.js and NeonDB PostgreSQL.

It connects a responsive React frontend to server-side API routes and uses basic SQL operations to manage persistent menu data.

The project fulfills the core requirements of a database-powered restaurant website assignment.
