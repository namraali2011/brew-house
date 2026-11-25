# BrewHouse

BrewHouse is a Next.js café site backed by Neon PostgreSQL. Anyone can browse the menu. Customers can register, sign in, and sign out. Admins manage menu items at `/admin`.

## Local setup and migration order

1. Run `npm ci`.
2. In the Neon SQL Editor, select the branch you intend to use. For a fresh database, run the SQL below to create `menu_items`. An existing BrewHouse database can skip this step. The optional seed is for a fresh menu only.
3. Run [migrations/001_auth.sql](migrations/001_auth.sql) on that same branch. It creates `accounts` and `sessions` and leaves the existing menu data in place.
4. Set `DATABASE_URL` in the project-root `.env.local` to the Neon connection string for that branch. Keep the value in the local file. Authentication needs no additional environment variables.
5. Run `npm run dev` and open [BrewHouse locally](http://localhost:3000).

### Menu schema for a fresh database

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

<details>
<summary>Optional sample menu SQL</summary>

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

</details>

### Create an admin in Neon

After applying the auth migration, use the Neon SQL Editor on the branch configured in `.env.local`:

```sql
INSERT INTO accounts (username, password_hash, role)
VALUES ('your_admin_username', 'your_local_admin_password', 'admin')
RETURNING id, username, role;
```

Use an unused lowercase username with 3–32 letters, digits, or underscores. The `password_hash` column accepts plaintext for manually created admin accounts in this local setup. Use a password dedicated to this project. Public registration creates customers and stores salted password hashes.

Open **Admin Login** on the homepage and sign in with the username and password you entered in Neon.

Sessions expire after seven days. Logging out deletes the current session from the database.

## Menu API

- `GET /api/menu` is public and returns items newest first.
- `POST /api/menu` adds an item. Send JSON with `name`, `price`, `description`, and `category`.
- `PATCH /api/menu` updates an item. Send the same fields plus a numeric `id`.
- `DELETE /api/menu` deletes an item. Send JSON with a numeric `id`.

All writes require an admin session. The API returns 401 for guests, 403 for customers, 400 for invalid menu input, and 404 for updates or deletes targeting missing items.

## Local smoke test

Use a separate Neon test branch if available. Point `.env.local` at that branch, restart the dev server, and use a disposable menu item for the write checks.

1. In a private browser window, open the homepage. Confirm the menu loads and has no add, edit, or delete controls. Open `/admin` and confirm it redirects to `/admin/login`.
2. On the homepage, run the block below in DevTools. Expect `GET 200` and 401 for each write. The empty write payload ensures this check never changes a menu item even if authorization is misconfigured.

```js
for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
  const response = await fetch("/api/menu", {
    method,
    ...(method === "GET" ? {} : {
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
  });
  console.log(method, response.status);
}
```

3. Register a customer using a mixed-case username. Confirm a weak password is rejected. With a valid password, register and then try to register the same username in lowercase. Expect a duplicate-username error. Sign in with a different capitalization. Confirm the homepage displays the lowercase username and **Log Out**.
4. As that customer, run the same DevTools block. Expect `GET 200` and 403 for all writes. Open `/admin` and confirm the access message appears without management controls. Try signing in on the admin login page with the customer credentials and confirm they are rejected. Log out and confirm the writes return 401 again.
5. Sign in through **Admin Login** with the first admin credentials. Run the DevTools block and expect `GET 200` and 400 for the invalid writes. In the panel, submit a name containing only spaces with the other fields valid. Confirm the server validation message appears.
6. Add a disposable item in the panel, edit its price or category, and refresh the public menu to confirm the changes persisted. Delete that item and refresh the public menu to confirm it is gone.
7. Click **Log Out** in the admin panel. Reopen `/admin` and confirm it redirects to the login page. Run the DevTools block on the homepage and expect `GET 200` and 401 for all writes.

Run code checks with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
