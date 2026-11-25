# ☕ BrewHouse — Café Management & Online Ordering System

**A modern, full-stack café management website built with Next.js, React, Tailwind CSS, and NeonDB PostgreSQL.**

BrewHouse provides an interactive digital experience for café customers while giving administrators the tools to manage daily restaurant operations.

Customers can browse the café menu, create accounts, reserve tables, place orders, and manage their profiles. Administrators can manage menu items, monitor orders, handle reservations, and configure café settings through a dedicated dashboard.

### 🌐 Live Website

**[Visit BrewHouse — Live Demo](https://brew-house-ebon.vercel.app/)**

**[GitHub Repository](https://github.com/namraali2011/brew-house)**

---

## ✨ Key Features

### 1. Modern & Responsive Café Website

- Elegant café-inspired design with warm coffee colours.
- Fully responsive layout for desktop, tablet, and mobile devices.
- Interactive homepage with intuitive navigation.
- Dedicated buttons for table reservations and ordering.
- Dynamic navigation based on account type.
- Modern menu cards with product details and prices.
- Category-based menu filtering.
- Smooth hover effects and visual feedback.

### 2. Dynamic Digital Menu

BrewHouse features a database-powered menu that can be updated without modifying the website's source code.

- Display available food and beverage items.
- Browse products by category.
- View product names, descriptions, prices, and images where available.
- Display product availability.
- Reflect administrative changes automatically when menu data is refreshed.
- Preserve all menu modifications after page refresh.

### 3. Customer Registration & Authentication

Customers can create and manage their personal BrewHouse accounts.

- Customer registration and login.
- Case-insensitive usernames.
- Password complexity validation.
- Secure customer session management.
- Dedicated customer login interface.
- Logout functionality.
- Role-based access restrictions.
- Prevention of customer access to administrator operations.

Customer registration creates customer accounts only.

### 4. Customer Account Management

Registered customers can manage their account information through a dedicated profile page.

Available features include:

- Update username.
- Change account password.
- Configure a security question.
- Recover a forgotten password using the configured security question.
- Sign out of the account.

Password changes invalidate existing sessions to help protect account access.

### 5. Table Reservation System

Customers can reserve café tables through an interactive booking interface.

**Reservation features:**

- Select a table.
- Choose the number of guests.
- Select the preferred reservation date and time.
- Receive a booking confirmation.
- View active reservations.
- Associate reservations with the signed-in customer.
- Prevent overlapping reservations for the same table.
- Validate table capacity.
- Automatically expire reservations after their scheduled duration.
- Prevent expired or cancelled reservations from being used for new orders.

Reservation duration can be configured by administrators. The default configuration uses 30-minute slots.

### 6. Online Menu Selection & Order Placement

BrewHouse allows registered customers to place orders associated with their table reservations.

**Ordering features:**

- Browse available menu items.
- Select products and adjust quantities.
- Review the order summary.
- View calculated totals.
- Select an existing table reservation.
- Require a valid reservation before order placement.
- Submit an order.
- Receive an order confirmation with item details, total amount, and reservation information.
- Review active orders.

Product prices are verified on the server before an order is saved.

### 7. Five-Minute Order Editing

Customers can modify an order for a limited time after placement.

- Edit ordered items and quantities.
- Recalculate order totals.
- Save changes to existing orders.
- Restrict modifications to five minutes after creation.
- Prevent editing once the allowed period has expired.
- Prevent completed orders from being edited.

The editing deadline is enforced using server-side timestamps rather than the customer's device clock.

### 8. Order Confirmation & Status Management

The website provides confirmation messages and status information for customer activities.

- Confirmation after successful table reservation.
- Confirmation after successful order placement.
- Order identification number.
- Itemized order details.
- Total order amount.
- Associated table information.
- Order update confirmation.
- Visible feedback for invalid requests and failed operations.

Completed orders are removed from the customer's active order list while remaining available in administrator records.

---

## 🛡️ Administrator Dashboard

BrewHouse includes a dedicated administrative dashboard for managing café operations.

### 9. Administrator Authentication

- Dedicated administrator login interface.
- Role-based authorization.
- Restricted access to administrator pages.
- Protection of administrative operations.
- Administrator logout.
- Administrator account settings.

Customer credentials cannot be used to access the administrator dashboard, and administrator credentials are rejected by the customer login endpoint.

### 10. Menu Management

Administrators can:

- Add new menu items.
- Edit existing menu items.
- Delete menu items.
- Change item names and descriptions.
- Update product prices.
- Assign menu categories.
- Set product availability.
- Add optional product image URLs.

Menu changes are reflected on the public website.

### 11. Category & Café Settings

The administrative settings interface allows administrators to configure supported café options.

- Add new menu categories.
- Rename existing categories.
- Remove unused categories.
- Enable or disable table reservations.
- Configure booking slot durations.
- Manage account settings.

These settings can be updated through the administrator interface without manually editing application code.

### 12. Order Management

Administrators can review and process customer orders.

- View orders placed by customers.
- View customer usernames.
- Review ordered items and quantities.
- View order totals.
- Identify the associated table.
- Monitor pending orders.
- Mark orders as completed.
- View completed orders in administrative history.

When an order is marked as completed, it no longer appears in the customer's active order list.

### 13. Reservation Management

Administrators can manage customer table bookings.

- View customer reservations.
- See reserved table details.
- View the number of guests.
- Review reservation start and end times.
- Identify active, expired, and cancelled reservations.
- Cancel active table reservations.
- Release cancelled booking slots for future reservations.

Expired and cancelled reservations are excluded from active customer reservations.

---

## 🔐 Security & Validation

BrewHouse incorporates validation and authorization controls appropriate for its coursework scope.

- Server-side authorization for protected operations.
- Role validation for customers and administrators.
- Case-insensitive username handling.
- Password validation rules.
- Session-based authentication.
- Parameterized database queries.
- Form and API input validation.
- Duplicate username prevention.
- Duplicate and overlapping reservation protection.
- Server-side order totals.
- Server-controlled order editing deadlines.
- Reservation ownership verification.
- Restrictions on editing completed orders.
- Error handling and confirmation messages.

**Security note:** This is an academic project. Some simplified authentication provisions, including compatibility with manually configured administrator credentials, are intended for demonstration rather than unrestricted production use. Additional security hardening would be required for a commercial deployment.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Full-stack web framework |
| React | Interactive user interfaces |
| TypeScript | Type-safe application development |
| Tailwind CSS | Responsive styling and components |
| NeonDB PostgreSQL | Persistent application data |
| Next.js Route Handlers | Server-side application operations |
| Lucide React | Interface icons |
| Vercel | Cloud deployment |
| GitHub | Source control and project hosting |

---

## 🚀 Running the Project Locally

### Prerequisites

- Node.js and npm
- Visual Studio Code or another code editor
- Access to the application's configured NeonDB environment

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/namraali2011/brew-house.git
```

**2. Open the project**

```bash
cd brew-house
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure the environment**

Set the required NeonDB connection environment variable in your local development environment.

Keep connection credentials private and do not commit them to GitHub.

**5. Start the development server**

```bash
npm run dev
```

**6. Open the website**

Visit:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## 👥 User Roles & Permissions

| Feature | Guest | Customer | Administrator |
|---|---|---|---|
| Browse café menu | Yes | Yes | Yes |
| Register customer account | Yes | — | — |
| Customer login | — | Yes | No |
| Manage own account | No | Yes | Yes |
| Reserve tables | No | Yes | No |
| Place orders | No | Yes | No |
| Edit own eligible orders | No | Yes | No |
| Manage menu items | No | No | Yes |
| Manage categories | No | No | Yes |
| Complete customer orders | No | No | Yes |
| Cancel reservations | No | No | Yes |
| Configure café settings | No | No | Yes |

---

## 🔄 How BrewHouse Works

### Customer Journey

1. Visit the BrewHouse homepage.
2. Browse the dynamic café menu.
3. Register or sign in with a customer account.
4. Select **Book a Table**.
5. Choose a table, number of guests, and reservation time.
6. Confirm the reservation.
7. Select **Order Now**.
8. Choose menu products and quantities.
9. Select the confirmed table reservation.
10. Review the order summary and place the order.
11. Receive order confirmation.
12. Modify the order within five minutes if necessary.
13. View the order until it is completed by an administrator.

### Administrator Journey

1. Open the dedicated administrator login.
2. Sign in using an administrator account.
3. Access the administrative dashboard.
4. Manage café menu products and categories.
5. Review customer reservations.
6. Cancel bookings when necessary.
7. View new customer orders.
8. Mark fulfilled orders as completed.
9. Update supported café settings.
10. Manage administrator account preferences.

---

## 📸 Application Screenshots

The repository includes screenshots demonstrating the BrewHouse interface and core menu-management functionality.

Screenshots cover:

- Café menu displayed from persistent storage.
- Available menu items.
- Menu item deletion confirmation.
- Successful menu item deletion.
- Adding a new menu item.
- Successful menu item creation.

Additional screenshots can document the newer reservation, ordering, and administrator management features.

---

## 🎓 Academic Project Objectives

BrewHouse was developed to demonstrate the implementation of a full-stack website using modern web technologies.

The project addresses the following learning objectives:

- Building responsive interfaces using React and Tailwind CSS.
- Developing applications with Next.js App Router.
- Connecting frontend components to server-side operations.
- Implementing persistent application storage.
- Applying CRUD functionality to dynamic website content.
- Managing authentication and role-based authorization.
- Implementing forms with input validation.
- Preventing duplicate and conflicting reservations.
- Building interactive customer and administrator workflows.
- Implementing time-restricted order modifications.
- Deploying a full-stack project using Vercel.

---

## 📌 Project Scope

BrewHouse is a functional educational demonstration of a café management and ordering system.

The current implementation focuses on menu management, customer accounts, table reservations, order placement, and administrative operations.

The project does not process real payments or include a payment gateway. Google Sign-In and email-based account recovery are not included.

## 🌐 Deployment

**Live Application:** https://brew-house-ebon.vercel.app/

**Source Code:** https://github.com/namraali2011/brew-house

**Deployment Platform:** Vercel

---

## ✅ Conclusion

BrewHouse demonstrates how a modern full-stack application can combine customer-facing functionality with administrative control.

Its integrated menu, account management, reservations, ordering workflow, and administrative dashboard provide a practical example of applying Next.js, React, Tailwind CSS, and PostgreSQL to a real-world business scenario.

The result is a responsive café management application that brings key restaurant operations together in one website.
