# BrewHouse

BrewHouse is a Next.js café site backed by Neon PostgreSQL. Anyone can browse the menu. Customers can register, sign in, and sign out. Admins manage menu items at `/admin`.

## Local setup and migration order

1. Run `npm ci`.
2. In the Neon SQL Editor, select the branch you intend to use. For a fresh database, run the SQL below to create `menu_items`. An existing BrewHouse database can skip this step. The optional seed is for a fresh menu only.
3. Apply the migrations in order in the Neon SQL Editor:
   - [001_auth.sql](migrations/001_auth.sql) creates `accounts` and `sessions`. Skip this if you already applied Milestone 1.
   - [002_menu_settings.sql](migrations/002_menu_settings.sql) backfills existing category assignments, adds availability and image fields, and initializes bookings as disabled with 30-minute slots. Existing items start available with no image. Historical category names that differ only by case share one category, using the spelling of the oldest matching item.
   - [003_account_recovery.sql](migrations/003_account_recovery.sql) adds session versioning and the original recovery tables. Existing accounts and sessions are retained.
   - [004_security_questions.sql](migrations/004_security_questions.sql) adds security-question enrollment and uses the existing rate-limit table for recovery attempts.
4. Set `DATABASE_URL` in the project-root `.env.local` to the Neon connection string for that branch. Use [.env.example](.env.example) as a reference. Security-question recovery needs no additional environment variables.
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

- `GET /api/menu` is public and returns items newest first in `data`, with the database category list in `categories`.
- `POST /api/menu` adds an item. Send JSON with `name`, `price`, `description`, and `category_id` (or a category name in the legacy `category` field). Optional fields are `available` and `image_url`.
- `PATCH /api/menu` updates an item. Send the same fields plus a numeric `id`. Omitted image and availability fields preserve the existing values. Send `image_url: null` or an empty string to clear the image.
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

3. Register a customer using a mixed-case username and a security question with a digits-only answer. Confirm a weak password is rejected. With a valid password, register and then try to register the same username in lowercase. Expect a duplicate-username error. Sign in with a different capitalization. Confirm the homepage displays the lowercase username and **Log Out**.
4. As that customer, run the same DevTools block. Expect `GET 200` and 403 for all writes. Open `/admin` and confirm the access message appears without management controls. Try signing in on the admin login page with the customer credentials and confirm they are rejected. Log out and confirm the writes return 401 again.
5. Sign in through **Admin Login** with the first admin credentials. Run the DevTools block and expect `GET 200` and 400 for the invalid writes. In the panel, submit a name containing only spaces with the other fields valid. Confirm the server validation message appears.
6. Add a disposable item in the panel, edit its price or category, and refresh the public menu to confirm the changes persisted. Delete that item and refresh the public menu to confirm it is gone.
7. Click **Log Out** in the admin panel. Reopen `/admin` and confirm it redirects to the login page. Run the DevTools block on the homepage and expect `GET 200` and 401 for all writes.

Run code checks with `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

## Admin settings and images

In **Manage Menu**, use **Settings** to add or rename categories, remove empty categories, and set booking availability and slot duration (5–240 minutes). Move items to another category before deleting a category they use. The booking values are stored now for Milestone 3.

Each menu item has an **Available on the menu** checkbox and optional **Image URL**. Use an absolute HTTP or HTTPS image URL. The browser loads the image directly. Cards use their category icon if the image is absent or fails to load.

## Security-question recovery

1. New customers enroll a question during registration. Existing users can sign in and open **Account → Security Question** to set or change it.
2. Choose full date of birth (YYYYMMDD), mobile number, house number, or a private recovery PIN. Enter only the digits shown by your chosen format. Leading zeros are preserved. A private PIN is harder to guess than personal details.
3. For changes from **Account**, enter your current password and save. BrewHouse stores a salted hash of the answer.
4. If you forget your password, select **Forgot password?** on the login screen. Enter your username, select the same question, enter the exact digits you enrolled, and choose a new password.

A successful reset signs out all prior sessions. Recovery permits up to five attempts per username and 60 across the app in each 15-minute window. A question and answer must be enrolled before recovery can be used.

## Google sign-in

Deferred. The existing credential and session flow has no external identity binding. Enabling Google requires a Google OAuth web client and approved callback, a separately stored Google subject identifier, server-side OIDC token validation, and a customer-only account creation or explicit authenticated linking flow. Email matching alone must never sign someone into an existing account or grant admin access. No Google configuration is needed for this milestone. [Google OpenID Connect documentation](https://developers.google.com/identity/openid-connect/openid-connect)

## Milestone 2 smoke test

Use a separate Neon test branch before running these steps. Set that branch's `DATABASE_URL` in your local environment and apply the migrations in order. If it contains a copy of Milestone 1, apply 002, then 003, then 004. Note the existing item count and categories before migrating and compare them with the public menu afterward.

1. Sign in as admin. Add a disposable category named `Seasonal Test`. Try adding `seasonal test` and expect a duplicate-name message. Add a disposable menu item to the first category, then rename the category to `Seasonal Specials`. Refresh the homepage and verify the public filter and item's category both use the new name. Try deleting the category while it still has the item and expect an error. Move or delete the item before deleting the category.
2. Enable bookings, save a 45-minute slot, then reload the admin page. Check that both values persisted. Disable bookings and save again. Attempt an invalid slot by sending a `PATCH /api/admin/settings` JSON request with `{"action":"booking","enabled":true,"slot_minutes":4}` as admin. Expect 400.
3. Edit the disposable item. Clear **Available on the menu**, add a working HTTP(S) image URL, and check the preview. Save and refresh the public menu. Check the image and **Unavailable** label on desktop and a narrow viewport. Replace the URL with `https://example.com/missing-image.jpg` and confirm the category icon appears instead. Clear the URL using **Clear Image**, save, and confirm the fallback still appears. For a server validation check, send a menu write with `image_url: "javascript:alert(1)"` and otherwise valid fields. Expect 400.
4. As a guest, then as a test customer, run the following in browser DevTools. Expect 401 as a guest and 403 as a customer. Repeat the Milestone 1 write-access test for `/api/menu` as well.

```js
for (const method of ["GET", "PATCH"]) {
  const response = await fetch("/api/admin/settings", {
    method,
    ...(method === "PATCH" ? {
      headers: { "Content-Type": "application/json" },
      body: "{}",
    } : {}),
  });
  console.log(method, response.status);
}
```

5. Sign into the same test account in two browser profiles. In **Account**, try a username change with the wrong current password, then try another account's username with the correct password. Both should fail. Save an unused mixed-case username with the correct password and check it displays in lowercase. Change the password with the current password. Confirm the first profile prompts you to sign in again and the second profile also loses access to `/account` after reload. Sign in using the new password.
6. In **Account**, choose a security question. Confirm an answer with letters or spaces is rejected and that saving requires your current password. Enroll a private PIN starting with zero. Sign out, open **Forgot password?**, and try a wrong answer and a wrong username. Both should display the same error.
7. Sign in to the test account in another browser profile. Use the correct username, question, and exact digits to reset the password from the first profile. Confirm the second profile loses access to `/account` after reload and that only the new password works. In a fresh 15-minute window, submit five valid-format wrong answers and confirm the sixth attempt is rate-limited.
