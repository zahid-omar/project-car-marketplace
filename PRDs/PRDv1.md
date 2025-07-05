# Modified Car Marketplace MVP – Product Requirements Document

## Overview
This document outlines the Product Requirements for the **Modified Car Marketplace MVP**, a US-based web application for buying and selling project and modified cars. The platform will serve automotive enthusiasts by providing a dedicated marketplace to list custom or project vehicles and find unique modified cars nationwide. The MVP focuses on core features that enable users to post detailed car listings (including standard specifications and modification details), browse and filter listings, communicate between buyers and sellers, and perform basic account management. All features described are for the initial MVP release, with nationwide availability and email/password authentication.

## Goals and Objectives
- **Enthusiast Marketplace:** Provide a platform tailored to project and modified cars, allowing sellers to showcase custom builds (engine swaps, suspension upgrades, etc.) and buyers to easily find these unique vehicles.  
- **Comprehensive Listings:** Ensure each car listing contains detailed standard specs (make, model, year, engine, etc.) and modification-specific information so that buyers have full visibility into the vehicle’s build and history.  
- **Easy Discovery:** Implement powerful search and filtering (by make, model, year, engine, and modification tags, as well as location) to help users quickly find cars that meet their criteria.  
- **User Engagement:** Allow users to save favorite listings and communicate (send offers/messages) with sellers through the platform, driving engagement and facilitating sales.  
- **Seamless Transactions:** Support the sales process with features to mark listings as sold and remove listings when needed, keeping the marketplace up-to-date.  
- **Security and Trust:** Require user accounts (email/password) for posting ads and messaging, providing accountability. Maintain a basic admin interface for user management and ad moderation to uphold content quality and safety.  
- **Scalability & Future-Proofing:** Use a modern tech stack (Supabase, Next.js, Tailwind CSS) that is scalable, AI-friendly, and easily extendable to mobile platforms in the future.  

## Scope of MVP

### In-Scope Features (MVP)
- **User Registration & Authentication:** Email/password signup, login, and logout. (No social login in MVP.)  
- **User Profiles:** Basic profile management (update email/password; minimal personal info).  
- **Listing Creation & Management:** Authenticated users can create a car listing with all required details, upload photos, edit their listings, mark them as sold, or delete them.  
- **Listing Search & Browse:** All users (including guests) can browse listings. Search and filtering by standard specs (make, model, year, engine, etc.), modification tags, and location (e.g. by state or region) are supported.  
- **Listing Detail View:** A public page for each listing showing full details (vehicle specs, modification list, price, location, photos, seller info, etc.).  
- **Favorites (Saved Listings):** Authenticated users can save listings to a personal favorites list and remove them later.  
- **Messaging & Offers:** Authenticated users can send messages and purchase offers to listing owners through an internal messaging system. Sellers can view and reply to messages/offers from interested buyers.  
- **Admin Dashboard:** Basic administration features for platform moderators: view and manage all user accounts, view and moderate (remove or flag) listings.  
- **Nationwide Coverage:** The platform will be available across the US, with optional filters for location.  
- **Tech Stack Implementation:** Use Supabase (PostgreSQL DB, Auth, Storage, Edge Functions) for the backend and database, and Next.js (React) with Tailwind CSS for the frontend web application.  

### Out of Scope (MVP)
- **Social Logins:** OAuth sign-ins via Google, Facebook, etc. are not included in MVP.  
- **Payments & Transactions:** No built-in payment processing or escrow; any monetary transactions happen off-platform.  
- **Reviews/Ratings:** Users cannot rate or review buyers/sellers or listings in this version.  
- **Advanced Moderation Tools:** Automated content filtering, user reporting/flagging mechanisms (beyond admin manually moderating) are not included.  
- **Mobile App:** No native mobile app in MVP (however, the web app will be responsive for mobile browsers).  
- **Internationalization:** Only US region and English language are supported in MVP.  

## User Roles and Permissions
- **Guest (Unauthenticated User):** Can browse and search all listings, view listing details. Cannot post listings, favorite listings, or send messages/offers (will be prompted to log in or sign up for these actions).  
- **Registered User (Authenticated):** Can do everything a guest can, plus create/manage their own listings, save favorites, and initiate or respond to messages/offers. All standard buyers and sellers use the same account type (a user can be both a buyer and a seller).  
- **Administrator (Admin):** Has an admin role in addition to a regular user account. Can manage users and listings site-wide. Admins can remove or edit any listing, and deactivate or manage user accounts. Admin access is restricted to authorized personnel.  

---

## Functional Requirements

### 1. Authentication & User Account Management
This section covers user registration, login, and basic profile management using email/password credentials. Authentication will be handled via Supabase Auth.  

#### User Stories:
##### **US-01: User Registration –** *As a visitor, I want to create a new account with an email and password, so that I can become a registered user (buyer/seller) on the marketplace.*

**Acceptance Criteria:**
- The system allows a new user to sign up by providing a unique email address and a password.  
- Password must meet minimum strength requirements (e.g., at least 6 characters).  
- If the provided email is already in use, the registration is rejected with an appropriate error message.  
- A confirmation email is sent to the user’s email address for verification (optional for MVP, but if implemented, unverified accounts cannot post or message).  
- Upon successful signup (and verification if applicable), the user account is created in the database with a unique user ID, and the user is considered authenticated (logged in).  

##### **US-02: User Login –** *As a registered user, I want to log in with my email and password, so that I can access my account and features like posting or messaging.*

**Acceptance Criteria:**
- The system allows login with a valid email and password combination corresponding to an existing account.  
- If incorrect email or password is provided, an error message is shown (e.g., "Invalid credentials") and access is denied.  
- Passwords are securely verified (never stored in plain text; Supabase/DB handles hashing and verification).  
- After successful login, the user gains access to authenticated features (posting, favorites, messaging, etc.) and the session is maintained (via secure httpOnly cookies or access token) until logout or expiration.  

##### **US-03: Logout –** *As an authenticated user, I want to log out of my account, so that I can ensure my session is closed on shared devices.*

**Acceptance Criteria:**
- The user can trigger a logout action (e.g., clicking “Log out” in the UI).  
- Upon logout, the user’s session/token is invalidated on the client and server side.  
- After logging out, the user is redirected to a public page (e.g., homepage or login screen) and can no longer access authenticated features unless they log in again.  

##### **US-04: Password Reset –** *As a registered user, I want to reset my password if I forget it, so that I can regain access to my account.*

**Acceptance Criteria:**
- The system provides a “Forgot Password” option where the user can input their registered email.  
- If the email exists, an email with a secure password reset link is sent to the user (handled via Supabase’s password reset functionality or custom Edge Function).  
- Clicking the reset link allows the user to set a new password that meets the password policy.  
- After resetting, the user can log in with the new password. If the link is invalid or expired, an error is shown and the password remains unchanged.  

##### **US-05: Basic Profile Management –** *As an authenticated user, I want to view and update my profile details (like display name, password), so that my information is current.*

**Acceptance Criteria:**
- The user can view their account profile page which shows basic info such as display name (or username), email, and optionally other info (e.g., location, bio – minimal for MVP).  
- The user can update editable fields: e.g., change password, change display name.  
- Email change may not be allowed in MVP (or if allowed, might require re-verification). If out-of-scope, the email is view-only as the unique identifier.  
- Password change flow requires entering the old password for confirmation, and new password must meet the policy. On success, the password is updated in Auth, and the user might be asked to re-login for security (or tokens are refreshed).  
- Any changes show a success message. Invalid inputs (e.g., weak password) show relevant validation errors.  

##### **US-06: Access Control for Auth-Only Features –** *As a guest user (not logged in), if I attempt to access features that require authentication (posting an ad, messaging, saving favorites, etc.), I should be prompted to log in or sign up.*

**Acceptance Criteria:**
- The system protects all routes/actions that require login. For example, the “Post a Car” page or “Send Message” button are inaccessible to guests.  
- If a guest clicks an action (e.g., "Add to Favorites" or "Message Seller"), a modal or redirect prompts them to log in or create an account. The intended action does not proceed while not authenticated.  
- If a logged-out user tries to access an authenticated route via URL, they are redirected to the login page and after successful login, optionally redirected back to that page (nice-to-have).  
- Authenticated users have appropriate access: e.g., only the listing owner sees the "Edit" or "Mark as Sold" buttons on their listing.  

---

### 2. Car Listings Posting & Management (Sellers)
This section describes how users can create and manage their car listings. A “listing” (or “ad”) is a post for a vehicle being sold, including standard details and modifications. Only authenticated users can create listings.  

#### User Stories:
##### **US-07: Create New Listing (Post an Ad) –** *As a seller, I want to post a new car listing with detailed specs and modifications, so that I can advertise my project/modified car to potential buyers.*

**Acceptance Criteria:**
- Only authenticated users can access the “Post a New Listing” form. If a guest navigates there, they are prompted to log in (per US-06).  
- **The listing creation form will include the following fields (all required unless noted):**  
  - **Make:** The car’s make/brand (e.g., Toyota, Ford). (Input may be a dropdown of common makes or free text input for MVP.)  
  - **Model:** The car’s model (e.g., Supra, Mustang). (Dropdown filtered by Make selection or free text.)  
  - **Year:** The vehicle’s manufacture year. (Numeric input or dropdown; must be a reasonable year, e.g., 1886–present range validation.)  
  - **Engine:** The engine information. (Examples: “2.0L Turbo I4 (Stock)”, “5.7L LS1 V8 Swap” – user can specify current engine in the car.)  
  - **Transmission:** (optional) e.g., “Manual 6-speed” or “Automatic”.  
  - **Mileage:** (optional) Odometer reading of the car. (Numeric; if car is a non-runner project, mileage can be approximate or 0.)  
  - **Location:** The location of the vehicle. (City and State, or ZIP; used for location-based filtering.)  
  - **Price:** The asking price in USD. (Numeric; validation for positive integer or decimal, e.g., no less than $0.)  
  - **Title/Headline:** A short headline for the listing. (E.g., “1995 Mazda RX-7 – LS Swapped Track Build”. If not explicitly input by user, the system could auto-generate from Year/Make/Model and key mods.)  
  - **Description:** A detailed description of the car, its condition, and history. The user can elaborate on modifications, maintenance, issues, etc. (Multi-line text area, supports a few hundred words.)  
  - **Modifications:** Specific mod details. The user can add multiple mods or customizations.  
    - *If tags:* the user can input multiple modification tags (e.g., “Engine Swap”, “Turbo Upgrade”, “Coilover Suspension”, “Widebody Kit”). These tags will be saved and used for filtering/search.  
    - *If structured:* the user can add mod entries with a category and description (e.g., Category: Engine, Description: “Swapped to 6.2L LS3 V8”).  
  - **Photos:** The user can upload images of the car. Allow multiple photos (e.g., up to 5 or 10 images). The first photo will be the featured image in listings.  
    - Only common image formats are allowed (JPEG, PNG). Each image must be under a size limit (e.g., 5 MB each).  
    - Uploads should succeed reliably; if an upload fails, an error is shown and the user can retry.  
- **Validation:**  
  - Year must be a four-digit number within a plausible range (e.g., 1900–2025).  
  - Price must be a positive number (and optionally ≤ some upper bound like 10 million to catch typos).  
  - At least one photo must be uploaded (to ensure listings have visuals).  
  - At least one modification entry or tag can be required or optional (MVP decision: allow no mods listed if stock, but since target is modified cars, encourage at least one mod tag; not strictly required in case of “project car with no mods yet”).  
- On submitting the form with valid data, a new listing record is created in the database associated with the user’s account.  
- After creation, the user is redirected to the listing’s detail page or their profile’s listings list with a success message (“Your car has been listed!”).  
- The new listing becomes immediately available in the public marketplace (no admin pre-approval required in MVP).  

##### **US-08: Edit Listing –** *As a seller, I want to edit the details of my car listing after posting, so that I can correct mistakes or update information (price, description, etc.).*

**Acceptance Criteria:**
- Only the owner of a listing (the user who created it) or an admin can edit a listing’s details. Edit functionality is not visible or accessible to other users.  
- The owner can access an “Edit” option on their listing (e.g., a button on the listing page or in their profile listings list).  
- The edit form pre-populates with the listing’s current details, allowing the user to change any of the fields described in US-07 and add/remove photos or modification tags.  
- All the same validation rules from creating a listing apply to edits.  
- On saving changes, the listing is updated in the database. Users viewing the listing will see the updated information immediately.  
- If the user cancels or navigates away, changes are not saved.  

##### **US-09: Delete Listing –** *As a seller, I want to delete/remove my listing when it’s no longer available or I change my mind, so that it’s no longer visible to others.*

**Acceptance Criteria:**
- Only the listing owner or an admin can delete a listing.  
- The UI provides a “Delete” option for the owner, requiring confirmation.  
- Upon confirmation, the listing is removed from public view (preferably soft-deleted).  
- After deletion, the owner no longer sees the listing in their list. Buyers with a direct link should get a “Listing not found or removed” message.  
- Favorites/bookmarks referencing the listing should indicate removal or be cleared.  
- Any ongoing conversations remain accessible but should show that the listing is removed.  

##### **US-10: Mark Listing as Sold –** *As a seller, I want to mark my listing as sold once I have sold the vehicle, so that others know it’s no longer available without removing the details.*

**Acceptance Criteria:**
- Only the listing owner (or an admin) can mark a listing as sold.  
- Confirm action before changing status.  
- Sold listings remain visible but clearly badged as “Sold”.  
- Sold listings are excluded from default searches and contact forms are disabled.  
- The seller’s dashboard reflects the sold status, with option (if desired) to reopen.  
- Favorites list entries show the sold badge.  

##### **US-11: My Listings Dashboard –** *As a seller, I want to see a list of all the car listings I have posted, so that I can easily manage them (edit, mark sold, or delete).*

**Acceptance Criteria:**
- Authenticated users have a “My Listings” section listing all their listings with status indicators.  
- Each entry shows key info and actions appropriate to its status.  
- An empty state is shown if the user has no listings.  

---

### 3. Browse & Search Listings (Buyers)
All users (including guests) should be able to browse the marketplace and find listings that interest them.  

#### User Stories:
##### **US-12: Browse Listings Catalog –** *As a guest or potential buyer, I want to browse all available car listings, so that I can see what’s for sale.*

**Acceptance Criteria:**
- Listings page shows a feed/catalog of cars, defaulting to newest first.  
- Each listing card shows photo, title, price, location, etc., linking to detail page.  
- Pagination or infinite scroll handles many listings.  
- Sold/removed listings are excluded from default view.  
- Logged-in users see saved favorites indicated.  

##### **US-13: Search and Filter Listings –** *As a buyer, I want to search and filter the car listings by specific criteria, so that I can find cars that match what I’m looking for.*

**Acceptance Criteria:**
- Search bar and filter panel support:  
  - **Keyword Search** (title/description/make/model/mod tags).  
  - **Make/Model** filters.  
  - **Year Range** filter.  
  - **Engine/Drivetrain** filter (optional/keyword).  
  - **Modification Tags** filter.  
  - **Price Range** filter.  
  - **Location** filter (state or text).  
- Users can combine multiple filters.  
- Results update on apply; “No results” message when none found.  
- Handle invalid filter input gracefully.  
- Performance optimized with DB indexes.  

##### **US-14: View Listing Details –** *As a buyer or interested user, I want to view a detailed page for a specific car listing, so that I can see all the information and decide if I’m interested.*

**Acceptance Criteria:**
- Detail page displays all listing information:  
  - Title, price, location, photo gallery.  
  - Vehicle details, modifications, description.  
  - Seller info (display name), posted date.  
  - Status badge (Active/Sold).  
- Actions:  
  - **Contact Seller** / **Send Offer** (requires login).  
  - **Save to Favorites** (requires login).  
  - Owner sees **Edit/Mark Sold/Delete** buttons.  
- Unique, SEO-friendly URL.  
- Edge cases handled for sold/removed listings and missing data.  

---

### 4. Favorites (Saved Listings)
Authenticated users can save listings they are interested in.  

#### User Stories:
##### **US-15: Save Listing to Favorites –** *As a buyer, I want to save a car listing to my favorites list, so that I can easily find it later.*

**Acceptance Criteria:**
- Heart/Save button on listings (cards and detail).  
- Creates favorite record; duplicates prevented.  
- Guests prompted to log in.  

##### **US-16: View Favorites List –** *As a user, I want to view all my saved (favorite) listings, so that I can review or act on them later.*

**Acceptance Criteria:**
- Favorites page lists all saved listings with info and links.  
- Sold/removed listings remain but are badged.  
- Empty state when no favorites.  

##### **US-17: Remove from Favorites –** *As a user, I want to remove a listing from my favorites, so that I can keep my saved list relevant to me.*

**Acceptance Criteria:**
- Remove/Un-favorite action on favorites page and detail view.  
- Updates list immediately; duplicates and errors handled gracefully.  

---

### 5. Messaging & Offers (Buyer–Seller Communications)
An internal messaging system enables private communication without exposing personal contact info.  

#### User Stories:
##### **US-18: Initiate Message/Offer to Seller –** *As a buyer, I want to send a message or offer to the seller of a listing I’m interested in, so that I can ask questions or negotiate a purchase.*

**Acceptance Criteria:**
- Authenticated non-owner users can open a message/offer form on active listings.  
- Message box and optional offer price field.  
- Record stored in Messages table; seller notified.  
- Validation: cannot message own listing; offer price positive; listing must be active.  

##### **US-19: Messaging Conversation Thread –** *As a buyer or seller, I want to view the conversation (message thread) between me and the other party for a specific listing, so that I can read and respond to messages in context.*

**Acceptance Criteria:**
- Inbox lists conversations by listing/participant.  
- Thread view shows chronological messages with offer highlights.  
- Authorization ensures only participants access thread.  
- Conversations persist even if listing sold/removed, with status banner.  

##### **US-20: Reply to Message / Offer –** *As a seller, I want to respond to a buyer’s message or offer, so that I can answer questions or negotiate the sale.* (Buyers respond similarly.)

**Acceptance Criteria:**
- Participants can send replies within thread.  
- Notifications for new messages.  
- Validation similar to initial message.  
- Thread remains open after sale for coordination.  

---

### 6. Admin Features and Moderation
Basic admin tools for managing users and listings.  

#### User Stories (Admin):
##### **US-21: Admin Login & Access –** *As an administrator, I want to log into the site and access admin functionalities, so that I can moderate content.*

**Acceptance Criteria:**
- Admins log in via normal flow; role flag grants admin UI access.  
- Admin pages protected; unauthorized users blocked.  

##### **US-22: View All Listings (Admin) –** *As an admin, I want to view and search all listings on the marketplace (including sold or removed ones), so that I have full visibility into the content.*

**Acceptance Criteria:**
- Listings Management page lists all listings with filters and status indicators.  
- Admin can view details of any listing, including removed/sold.  

##### **US-23: Remove or Hide a Listing (Admin Moderation) –** *As an admin, I want to take down listings that violate policies or are inappropriate, so that the marketplace content remains trustworthy.*

**Acceptance Criteria:**
- Remove/Restore controls on admin listing view.  
- Removal hides listing from users, flags reason, notifies seller (optional).  
- Restore reverses removal.  

##### **US-24: User Management (Admin) –** *As an admin, I want to view and manage user accounts, so that I can support users or ban bad actors if needed.*

**Acceptance Criteria:**
- User Management page lists users with search.  
- Actions: View profile/activity, Deactivate/Ban, (optional) reset password, adjust roles.  
- Banning disables login and hides user listings.  
- Confirmation prompts; self-ban prevented.  

##### **US-25: Moderate Messages (optional) –** *As an admin, I want the ability to view or delete abusive messages between users, so that I can handle reports of misconduct.*  
*(Optional for MVP; may be deferred.)*

---

## 7. Non-Functional Requirements
- **Usability & UI/UX:** Intuitive, responsive Tailwind UI; accessibility best practices.  
- **Performance:** Fast SSR pages (Next.js), optimized queries and image delivery.  
- **Scalability:** Supabase and Next.js on scalable hosts (e.g., Vercel).  
- **Security:** HTTPS, Supabase Auth, RLS, input sanitization, secure file uploads.  
- **Privacy:** Emails/private data hidden; internal messaging preserves privacy.  
- **Reliability:** Stable core flows with error handling; transactional operations as needed.  
- **Maintainability & Extensibility:** Modular Next.js/React codebase; AI-friendly stack.  
- **SEO:** SSR listing pages with meta tags and friendly URLs.  
- **Analytics & Logging:** (Optional) Basic view counts, error logs, audit trails.  

---

## Technology Stack and Architecture
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).  
- **Frontend:** Next.js (React) with Tailwind CSS; Supabase JS client.  
- **Deployment:** Frontend on Vercel; backend on Supabase.  
- **Mobile Consideration:** Responsive web app; future React Native or PWA possible.  
- **Testing Approach:** Functional and unit tests; manual verification of user stories.  

---

## User Stories Summary and Traceability
| ID  | User Story |
| --- | ---------- |
| US-01 | User Registration (Email/Password Signup) |
| US-02 | User Login (Email/Password Login) |
| US-03 | Logout |
| US-04 | Password Reset |
| US-05 | Basic Profile Management |
| US-06 | Access Control: prompt login for auth-only actions |
| US-07 | Create New Listing |
| US-08 | Edit Listing |
| US-09 | Delete Listing |
| US-10 | Mark Listing as Sold |
| US-11 | “My Listings” dashboard for sellers |
| US-12 | Browse Listings |
| US-13 | Search/Filter Listings |
| US-14 | View Listing Details Page |
| US-15 | Save Listing to Favorites |
| US-16 | View Favorites List |
| US-17 | Remove from Favorites |
| US-18 | Send Message/Offer to Seller |
| US-19 | View Messaging Conversation Thread |
| US-20 | Reply in Conversation |
| US-21 | Admin Access & Panel |
| US-22 | Admin View All Listings |
| US-23 | Admin Remove/Restore Listing |
| US-24 | Admin User Management |
| US-25 | (Optional) Admin View/Delete Messages |

Each user story above is associated with testable acceptance criteria ensuring that the MVP implementation meets the expected behavior and handles relevant edge cases. This PRD serves as the foundational blueprint for development, testing, and future iterations of the Modified Car Marketplace. The focus remains on delivering a functional, user-friendly MVP that addresses the core needs of enthusiasts buying and selling modified cars, with a clear path for future enhancements post-MVP.
