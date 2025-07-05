# Project Car Marketplace – Product Requirements Document (Updated Roadmap)

This document outlines the requirements for a US-based marketplace web application for buying and selling project/modified cars. It is structured in three versions, reflecting a phased feature roadmap. Version 1 is the MVP focusing on core platform features. Version 2 adds analytics and historical pricing capabilities. Version 3 introduces AI-powered features and advanced seller tools. Each version section includes a brief summary of its scope and goals, followed by detailed user stories (with requirement IDs) and testable acceptance criteria. Later features build upon the MVP, showing a clear progression of functionality.

## Version 1 (MVP): core platform launch

### Summary

**Scope & Goals:** Version 1 delivers the essential features needed to launch the core marketplace platform. The goal is to enable users to register, list modified cars for sale, browse and search listings, communicate via messaging, and perform basic account and listing management. Anyone can explore listings, while actions like creating listings, favoriting, or messaging sellers require login. An admin interface is included for moderation of users and content. This MVP establishes the foundation that later versions will enhance with data insights and AI capabilities, focusing on a reliable and user-friendly experience for initial launch.

### User stories and acceptance criteria
#### V1-1: As a visitor, I want to sign up with an email and password so that I can create an account to buy or sell cars on the marketplace.

**Acceptance Criteria:**

- A user can navigate to a Sign Up page from the home or login screen. The sign-up form allows input of an email address and a password.  
- The email address must be in a valid format and unique (not already registered). The password must meet minimum security requirements (e.g., minimum length of 8 characters).  
- If the email is already in use or inputs are invalid (e.g., weak password, improper email format), an error message is displayed and the account is not created.  
- Upon submitting valid, unique credentials, a new user account is created. The user is either automatically logged in or prompted to log in, and they can now access member-only features (e.g. create listings, favorite listings, send messages).  

#### V1-2: As a registered user, I want to log in with my email and password so that I can access my account and use the platform’s features.

**Acceptance Criteria:**

- A Log In page is available where users enter their registered email and password.  
- If the credentials match an existing account, the user is logged into the site and gains access to their dashboard and authenticated features (e.g. listing management, messaging).  
- If the email does not exist or the password is incorrect, the login attempt fails. An error message is shown (e.g., “Invalid email or password”) and the user remains logged out.  
- Password input is handled securely (not visible as plain text, and transmitted/stored safely).  
- A logged-in user’s session remains active (with appropriate timeout for security), and they stay logged in across pages until they choose to log out.  

#### V1-3: As a logged-in user, I want to log out of my account so that I can ensure my account is secure on shared devices.

**Acceptance Criteria:**

- The interface provides a Log Out option (e.g., in the navigation menu or user profile dropdown) when the user is logged in.  
- Clicking the log-out option ends the user’s session and returns them to a public or login page.  
- After logging out, the user cannot access authenticated pages (e.g., creating listings, messaging) until they log in again. If they try, they are redirected to the login page.  

#### V1-4: As a seller (logged-in user), I want to create a listing for my project/modified car by manually entering the car’s details and modification tags, so that I can advertise it to potential buyers.

**Acceptance Criteria:**

- Only authenticated users can access the Create Listing page. If a guest tries to create a listing, they are prompted to log in or sign up.  
- The listing creation form allows the seller to input all essential car details, including: make, model, year, mileage, vehicle condition (e.g. project, good, excellent), asking price (USD), location (e.g. city and state or ZIP code), and a description of the car.  
- The form provides a way to specify modifications or upgrades on the car. The seller can enter modification tags or phrases (for example: “turbocharged”, “lift kit”, “engine swap”) to highlight custom features. These can be free-text tags or chosen from a suggested list of common mods.  
- The seller can upload one or multiple photos of the car. The system should allow uploading several images (with a reasonable size/format limit) to showcase the vehicle. The first photo will be used as the listing’s thumbnail in searches.  
- Form validation ensures all required fields (make, model, year, price, etc.) are provided. Year must be a valid number (e.g., within a reasonable range), price must be a positive number, etc.  
- Upon submitting the form with valid data, a new listing is created and saved in the system. The listing is associated with the seller’s account and is immediately available for browsing/search (unless an approval step is required by admin – not in MVP).  
- After creation, the seller can see the new listing on their account’s “My Listings” management page.  

#### V1-5: As a seller, I want to edit or update the details of my car listing, so that I can correct information or adjust the price as needed.

**Acceptance Criteria:**

- The platform provides an Edit Listing option for listings that the user owns. This is accessible from the listing page or the seller’s “My Listings” dashboard.  
- Only the owner of the listing (or an admin) can edit a listing. If a user tries to edit a listing they do not own, the system will prevent it (the edit option is not shown or access is denied).  
- The edit form pre-fills with the listing’s current details (all the same fields as in creation). The seller can change any of the details such as price, description, photos, modification tags, etc. (with the same validation rules as on creation).  
- Upon saving changes with valid data, the listing is updated in the system. The updates reflect immediately in the listing details page and search results (e.g., new price, updated description or images).  
- If the seller cancels out of the edit form or navigates away, no changes are saved. There is a confirmation when leaving without saving to prevent accidental loss of edits.  

#### V1-6: As a seller, I want to mark my listing as “Sold” once I have sold the car, so that buyers are informed it’s no longer available and I can finalize that listing.

**Acceptance Criteria:**

- The seller (or an admin) can mark a listing as Sold via a clearly available action (e.g., a “Mark as Sold” button on the listing management view).  
- When marking as sold, the system updates the listing’s status to indicate it is sold. In the UI, the listing may show a “Sold” label or badge.  
- Sold listings are no longer shown in the active listings browse/search results for buyers. (They might be filtered out or appear only if specifically viewing sold items – by design, sold items are hidden in MVP’s public listing pages.)  
- Once a listing is marked sold, buyers cannot send new messages or offers on it (the contact seller option is disabled or removed).  
- The seller can see their sold listing in their “My Listings” history (marked as sold). They cannot edit the listing’s details anymore once it’s sold (except possibly to add a final note, not in MVP scope).  
- (In Version 1, the sale price is assumed to be the asking price or is not separately recorded. Note: The capability to record the actual sold price and use this data is introduced in Version 2.)  

#### V1-7: As a seller, I want to delete a listing that I no longer wish to display, so that it is removed from the marketplace.

**Acceptance Criteria:**

- The seller (or admin) can delete a listing they own via a Delete option on the listing management page. A confirmation prompt (“Are you sure you want to delete this listing?”) is shown to prevent accidental deletion.  
- Upon confirming deletion, the listing is removed from the active listings database. It no longer appears in any search or browse results.  
- Deleted listings are not visible to other users. (They may be soft-deleted in the backend for record-keeping, but they are inaccessible through the UI.)  
- The seller’s “My Listings” view no longer shows the deleted item. Buyers who might have saved the listing or have the link will see a message that the listing is no longer available if they try to access it.  
- Only the listing owner or an administrator can delete a listing. Users cannot delete listings they do not own.  

#### V1-8: As a user, I want to browse all car listings and search with filters (by make, model, year, price, location, and modification tags), so that I can easily find cars that match my interests.

**Acceptance Criteria:**

- The marketplace provides a Browse/Search Listings page where all active listings are displayed, with options to refine the results using search and filters. This page is accessible to all users, including guests (no login required to browse).  
- Users can use a search bar to keyword search listings. The search should look at relevant fields such as car make/model, listing title or description, and modification tags. For example, searching “Mustang supercharger” should return listings that have “Mustang” in make/model and “supercharger” in the mods or description.  
- Users can filter results by various criteria:  
  - **Make/Model:** a dropdown or list of car makes; selecting a make shows models, etc. Users can filter to one or multiple makes/models to narrow results.  
  - **Year range:** a slider or two inputs to specify a minimum and maximum year. Only cars within that production year range are shown.  
  - **Price range:** inputs or slider for minimum and maximum price in USD. Listings outside this price range are excluded.  
  - **Location:** the user can specify a location filter (e.g., select a state or enter a ZIP code with a mile radius). Listings that are not in the specified area are filtered out. (For MVP, a simple approach can be used, such as filtering by state or a fixed radius from a ZIP code.)  
  - **Modification tags:** a multi-select or checklist of common modification categories (e.g., “Engine mods”, “Suspension”, “Body kit”). Selecting tags filters to listings that have at least those tags. Users can also enter a custom tag in search to match listings containing that tag.  
- The interface updates the listing results dynamically based on the selected filters/search terms. Users can combine multiple filters (e.g., search within a price range and specific make).  
- By default, listings are sorted in a logical order (MVP default: newest listings first). The user may have options to sort by price, year, or other criteria if feasible.  
- If no listings match the search/filter criteria, the system displays a “No results found” message and suggests checking the filters or broadening the search.  
- The filtering and search are efficient and can handle a reasonable number of listings without significant performance issues.  

#### V1-9: As a user, I want to view the details of a specific car listing, so that I can see all information about the car and decide if I’m interested in pursuing it.

**Acceptance Criteria:**

- Clicking on a listing (from the home page, search results, or elsewhere) opens a Listing Details page for that vehicle. This page is accessible to anyone (login not required just to view a listing’s details).  
- The listing page displays all important information about the car provided by the seller, including: the make, model, year, mileage, condition, price, location (at least city/state or region), and the full description of the car and its modifications.  
- All photos uploaded for the listing are shown in a gallery or slideshow. Users can click through to see each image in a larger view.  
- The page shows the seller’s username (or display name) and a way to contact the seller (e.g., a “Contact Seller” button or messaging form – see messaging stories below). Direct personal contact details (email/phone) for the seller are not exposed to protect privacy; communication is done through the platform.  
- If the listing is still available, it shows an Available status (default). If the seller has marked it as Sold (or it’s deleted), the page clearly indicates that status (e.g., “This car has been sold” or “Listing not available”).  
- For available listings, the page may also show additional info like how long ago it was posted, the listing ID, and possibly a list of modification tags in a visual format (chips or badges) for quick reference.  
- A logged-in user viewing the listing has options to Save the listing to favorites or Contact the seller. If the user is not logged in, those action buttons prompt the user to log in or register.  

#### V1-10: As a buyer, I want to contact the seller of a listing through an internal messaging system, so that I can inquire about the car or negotiate a deal without exposing my personal contact information.

**Acceptance Criteria:**

- On the listing details page (for an active listing), a logged-in user can initiate contact by clicking a “Contact Seller” button or link. This opens a message compose box or directs to the messaging section where the user can send a message to the listing’s seller.  
- If a user who is not logged in tries to contact a seller, the system prompts them to log in or sign up before they can send a message.  
- The messaging interface allows the buyer to write a text message. (In MVP, only text messages are supported; no images or attachments via messaging.)  
- When the buyer sends the message, the system creates a conversation thread between that buyer and the seller, tied to the specific listing. The message appears in both the sender’s and recipient’s inboxes.  
- The seller receives a notification (in-app, and optionally an email alert) that they have a new message from a buyer. The buyer similarly can see the sent message in their outbox/sent items.  
- The content of the message and the identity of the participants remain private – only the buyer and seller (and platform admins, if needed for moderation) can view the conversation.  
- Both users can now send back-and-forth replies within this conversation. Messages are time-stamped and ordered from newest to oldest for easy reading.  
- The messaging system is monitored or logged on the backend so that admins can review communications if a dispute or report arises (basic moderation capability).  

#### V1-11: As a user (buyer or seller), I want to view and manage my messages on the platform, so that I can keep track of conversations about listings and respond in a timely manner.

**Acceptance Criteria:**

- Logged-in users have access to an Inbox or Messages section on the site, typically via a menu or icon. This section lists all conversation threads the user is involved in (as buyer or seller).  
- Each conversation is labeled in a meaningful way – for example, by the listing title and the other party’s name. (E.g., “Conversation about 2005 Subaru WRX – with User123”).  
- Unread messages are indicated clearly (e.g., bold text or an unread count badge). When a user receives a new message, an indicator in the UI (and optional email notification) lets them know they have a new/unread message.  
- The user can select a conversation to view the message history (all past messages in that thread) and can type a reply in a text input box.  
- Sending a reply appends the new message to the conversation for both participants. The other party will then similarly be notified of the new message.  
- The user can navigate between conversations, and if a listing has been marked sold or deleted, the conversation can still be viewed for reference, but it should indicate that the listing is no longer active.  
- (Optional for MVP) Users may delete or archive a conversation from their inbox for cleanliness, though the platform retains the messages in the database for record. Archiving a conversation hides it from the main inbox view but can be accessed in an “Archived” filter.  

#### V1-12: As a user, I want to save/favorite listings that interest me, so that I can easily find them later without searching again.

**Acceptance Criteria:**

- For each active listing, a logged-in user can click a “Save” or “Add to Favorites” button (for example, a heart icon) to bookmark the listing.  
- If a user who is not logged in attempts to favorite a listing, the system will prompt them to log in or register, since favorites are tied to user accounts.  
- When a listing is favorited, it is added to the user’s personal Saved Listings list. The Save button may toggle to an “Saved” state (e.g., highlighted heart icon) to indicate it’s already in favorites.  
- The user can view all their saved listings in a Favorites section (accessible via their account dashboard or a menu). In that section, each saved item is shown (with at least title, photo, price, etc.), and clicking it navigates to the listing page.  
- The user can remove a listing from their favorites by clicking the Save/Unsave toggle again either on the listing page or in the favorites list. Removal updates the favorites list immediately.  
- If a listing that was saved gets marked as sold or is deleted by the seller, it should ideally still appear in the favorites list but indicated as unavailable (or it may be automatically removed from favorites – product decision). For MVP, a simple approach is to remove sold/deleted items from favorites to avoid clutter, though the user might wonder where it went, so showing it with a “sold” label could be helpful.  

#### V1-13: As an admin user, I want to access a dashboard that gives me an overview of users and listings, so that I can perform moderation and ensure the marketplace content is appropriate and users are behaving.

**Acceptance Criteria:**

- The system defines an Admin role. Admin users can log in through the normal login form but are recognized by the system as administrators (alternatively, a separate admin login page can be provided).  
- Upon logging in as an admin, the user can navigate to an Admin Dashboard section. This section is restricted to admin roles only (if a non-admin somehow accesses the URL, they are denied).  
- The Admin Dashboard provides an overview of key data: number of active listings, number of users, and recent activity (e.g., newest listings or sign-ups). This gives a quick health check of the platform.  
- There are management pages for Users and Listings: for example, a tab or menu for User Management and one for Listing Management.  
- In User Management, the admin can see a list of all registered users, including details like username, email, registration date, number of listings, status (active/banned). The admin can search or filter users (e.g., search by email or username).  
- The admin can select a user and perform actions such as deactivate/ban the user (preventing them from logging in or using the platform). If a user is banned, their listings might automatically be hidden as well. The admin can also reinstate previously banned users.  
- In Listing Management, the admin can view all listings on the platform. They can filter or search listings (e.g., by keyword, by user, or by status such as active/sold).  
- The admin can select a listing to view its details, and has the ability to remove or hide listings that violate policies. For example, an admin can delete a listing (which would function like the seller’s delete, removing it from view), or mark it as inappropriate.  
- The admin can also create or edit listings on behalf of users if needed (for support reasons), though this is a less common action. Primarily, they ensure no prohibited content is listed (e.g., non-car items or fraudulent posts).  
- Administrative actions are logged (e.g., if an admin deletes a listing or bans a user, the system logs which admin performed the action and when) for accountability.  

#### V1-14: As an admin, I want to moderate content and user activity to maintain a safe and trustworthy marketplace.

**Acceptance Criteria:**

- The platform allows users or the system to flag/report listings or messages (Note: an explicit “Report” feature for users is nice-to-have; if not in MVP, assume admins proactively monitor). If reporting is available, reported items are highlighted in the admin dashboard for review.  
- Admins can view reported listings or users and see the reason for report (if provided), then take appropriate action (removing content or warning/banning user).  
- Admins have access to view user messages if necessary for investigating abuse (though this is done carefully to respect privacy – typically only upon reports of harassment or fraud).  
- The admin dashboard provides tools to filter out spam or inappropriate content, such as viewing all listings containing certain keywords or recently posted listings for review.  
- All moderation actions (deleting a listing, banning a user, etc.) happen in near-real-time – e.g., if an admin deletes a listing, it disappears from the site immediately.  
- The goal is to ensure that only legitimate, appropriate listings and user interactions remain on the platform, improving overall trust for all users.  

(Version 1 establishes the fundamental buy/sell platform: users can register, create and browse listings with detailed car info and modifications, communicate through messaging, save favorites, and administrators can oversee content. This MVP serves as the foundation upon which analytics in V2 and AI enhancements in V3 will build.)

---

## Version 2: analytics and price trends

### Summary

**Scope & Goals:** Version 2 builds upon the launched platform by introducing data analytics and historical pricing features. The main objectives are to start recording all vehicle sales on the platform and to leverage that data to provide users with historical price insights. Every time a car is sold (marked sold), the system will archive the details and final price. Using this growing dataset, the platform will begin generating and displaying trends such as average selling prices over time for various car models or categories. These features aim to empower users with market data – helping sellers set competitive prices and buyers make informed decisions. This version lays the groundwork for future price guidance tools (to be developed in later versions) by ensuring we have a robust collection of historical sales information.

### User stories and acceptance criteria
#### V2-1: As a seller, I want the platform to keep a record of my sold vehicle and its selling price, so that I have a sales history and the platform can use this data to analyze market trends.

**Acceptance Criteria:**

- When a listing is marked as Sold (by the seller or admin), the system prompts the seller to confirm the final selling price (if it differs from the asking price). This step is optional but encouraged, so accurate data can be collected. If the seller does not input a final price, the system can default to the last asking price as the sale price.  
- The system creates a sold record for that listing in a separate archive or database table. The record includes key details of the vehicle (make, model, year, etc.), the sale price, the sale date (when marked sold), and possibly the seller’s and buyer’s IDs (if a formal offer was involved).  
- The sold listing record is stored permanently for analytics purposes, even though the active listing is removed from public view. (The listing might be moved to an “Sold Listings” archive state rather than fully deleted.)  
- The seller can view a Sales History section in their account profile or dashboard. This section lists all of their vehicles that have been sold through the platform, including the final sold price and date for each. (This may also include any descriptive data like title or thumbnail for reference.)  
- The data captured will be used for generating pricing insights. (No user-facing price suggestions in this story; see next story for how users see trends.) The important part is that all sold vehicles and prices are systematically recorded to enable analysis.  
- This feature does not expose individual sale prices publicly per listing (unless decided otherwise). The data is primarily for the owner’s reference and aggregated analysis. Privacy of individual transactions is maintained, using only aggregated info for general user insights.  

#### V2-2: As a user, I want to see historical price data and trends for cars on the platform, so that I can understand market values and price my buys or sells accordingly.

**Acceptance Criteria:**

- The system aggregates the data from all archived sold listings to generate historical pricing statistics. For example, it can calculate average sale price, median price, and price range for particular car makes/models or categories, as well as track how prices change over time.  
- A new section of the site (or feature in the search interface) called “Price Trends” or “Market Insights” is introduced. Users (logged-in or even guests) can access this to view charts or summaries of pricing data.  
- The interface allows users to specify parameters for the data they want to see – for instance, select a make and model (e.g., “Honda Civic”), and optionally a year range or modification category, and then view the historical price trend.  
- Example: A user selects Ford Mustang (2005-2010) and sees that over the last 12 months, 20 such cars were sold on the platform with an average price of $15,000, a lowest price of $10,000, and highest of $20,000, perhaps displayed on a line graph or bar chart per month.  
- The system displays the historical price trend in a clear format: possibly a line chart showing average selling price over time, and/or summary statistics for the selected criteria. It should be easy to understand (with labeled axes, time periods, and currency).  
- Users can also browse a general insights page with highlights, such as “Overall Market Trends: The average price of modified cars has increased 5% in the last year” or “Most popular sold models this month”. (These are optional nice-to-haves; the core requirement is that at least specific queries for model/years can show a trend or average price.)  
- On each active listing page, the platform can optionally display a snippet of price insight relevant to that listing. For example: “Price Check: Similar 2010–2015 Subaru WRX vehicles have sold on this site for an average of $12,000.” This gives immediate context to the seller’s asking price. (If there is not enough data for that exact model or category, the system may show a message like “Limited sales data available for this type of car” or simply not show this section.)  
- The historical data and trends are updated continuously or on a regular schedule (e.g., nightly), incorporating new sales. This ensures that as more cars are sold on the platform, the insights become more accurate and up-to-date.  
- Data integrity: If a seller provided a false or dummy sold price, admins might need a way to clean the data. (For instance, an extreme outlier might be excluded from trend calculations if identified as invalid.) While not a direct user-facing requirement, the system should aim to keep the trend data realistic and useful.  
- This new analytics functionality is clearly marked as informational. (It is groundwork for future price guidance features – e.g., in the future, the platform might actively suggest a listing price based on this data – but in Version 2 it’s limited to historical data display, not proactive recommendations.)  

(Version 2 enhances the platform with valuable insights derived from actual transactions. By tracking sold listings and analyzing prices, it empowers users with market knowledge. It also sets the stage for intelligent pricing guidance and other data-driven features in subsequent versions, as the platform now collects and leverages historical sales information.)

---

## Version 3: AI-powered features and advanced seller tools

### Summary

**Scope & Goals:** Version 3 introduces cutting-edge enhancements that leverage AI and further streamline the user experience, particularly for sellers, while also adding more sophisticated buyer tools. The focus is on automation and intelligence: helping sellers list cars faster and more accurately with features like VIN decoding and AI-driven photo analysis, improving search through natural language queries, and giving sellers control over offers via an auto-reject mechanism for low offers. These features build upon the solid foundation of versions 1 and 2 – for example, the VIN decoder and photo AI make the listing process (from V1) more efficient, the AI-assisted search makes finding cars (V1 functionality) more intuitive, and the auto-reject ties into the negotiation process (extending messaging/offers from V1 and V2). Overall, Version 3 aims to make the marketplace smarter, more user-friendly, and more efficient by incorporating advanced technology.

### User stories and acceptance criteria
#### V3-1: As a seller, I want to auto-fill my car’s details by entering its VIN, so that creating a listing is faster and less error-prone.

**Acceptance Criteria:**

- On the Create Listing form (from V1), a new field for VIN (Vehicle Identification Number) is added. The seller can enter the car’s 17-character VIN as an optional way to fetch vehicle details.  
- The VIN input is validated for correct format (17 characters consisting of digits and capital letters, with the exception of I/O/Q which are not used in VINs). If the format is wrong, the user is alerted (e.g., “Please enter a valid 17-character VIN”).  
- If a valid VIN is provided, the system attempts to decode the VIN by consulting a VIN database or API. Upon successful lookup, the system automatically populates the relevant fields in the listing form with the standard specs retrieved. This typically includes: make, model, year, engine, trim, and possibly other details like body style. For example, entering a VIN might auto-fill “2015 Subaru WRX STi, 2.5L H4 Turbo engine, AWD, Sedan”.  
- The seller can review and edit any auto-filled information. All fields remain editable in case the VIN data has slight variations or the seller wants to clarify something (e.g., VIN might not reflect aftermarket modifications, which the seller will still add via modification tags or description).  
- If the VIN decode fails (e.g., VIN not found or the external service is down), the system displays a message like “Unable to retrieve vehicle details. Please enter details manually.” The seller can still manually fill out the form as in V1. A failure to decode does not prevent listing creation; it only means the seller has to input specs manually.  
- The VIN decoder greatly speeds up the process for common vehicles and reduces data entry errors (like typos in model name or year). It does not automatically list the car; the seller still reviews all info and submits the form to create the listing.  
- Security/Privacy: The platform does not expose the full VIN to buyers on the listing page (since VIN can be sensitive). If needed, maybe only the last 5 digits or something could be shown or the VIN can be hidden entirely. The VIN is mainly used internally for decoding and potentially for vehicle history reports (a potential future feature). In Version 3, VIN usage is only for autofill.  

#### V3-2: As a seller, I want the system to use AI to analyze my car photos and details to help prefill the listing (e.g., suggest a good description and identify modifications), so that creating a listing is easier and the information is more accurate.

**Acceptance Criteria:**

- When creating or editing a listing, after the seller uploads one or more photos of the car, the platform utilizes an AI image recognition service to analyze the images.  
- The AI analysis can identify visual details such as the car’s make and model (if the car is common and externally recognizable) and notable modifications or features visible in the pictures. For example, the AI might detect “aftermarket wheels”, “custom paint color (blue)”, “lifted suspension”, or textual cues from stickers/badges.  
- Using the image analysis (and any data the seller input like VIN or tags), the system generates a suggested listing description. This AI-generated description might include: a brief overview of the car (year/make/model), mention of its condition, and highlight the modifications/upgrades the AI detected. For example: “This is a 2015 Subaru WRX STi in World Rally Blue with extensive modifications including aftermarket alloy wheels, a performance exhaust, and an ECU tune. The car is in great condition with 50k miles. It’s been carefully maintained and tuned for track-day performance.”  
- The seller is presented with this draft description in the description text area (or a preview). They can edit, refine, or replace it entirely before publishing the listing. The AI’s suggestion is meant to assist, not to finalize without seller review.  
- If the AI cannot confidently generate a description (for instance, if the photos are unclear or it’s an uncommon car/mod), it will either not suggest anything or provide a minimal template. The seller will then write the description manually as usual. The system should handle this gracefully (e.g., “No description suggestions available” message, leaving the field blank for the user to fill).  
- In addition to the description, the AI might suggest relevant modification tags. For example, if the photos clearly show a roll cage and racing seats, the system could suggest tags like “roll cage” or “race-prepped interior”. The seller can choose to add these with one click if correct.  
- The AI does not auto-publish any information without user confirmation. The seller remains in control to ensure accuracy (there could be false positives in AI recognition). For instance, if the AI mistakenly identifies a stock part as aftermarket, the seller can remove that from the description.  
- This feature improves listing quality (especially for less experienced sellers who might not know how to write a good description) and saves time. However, it’s clearly marked as a suggestion. Perhaps a note like “AI-generated draft based on your photos – please review before posting” is shown, so the seller knows to check it.  

#### V3-3: As a buyer, I want to find cars using natural language search (for example, typing “looking for a red turbo Miata under 10k in Georgia”), so that I can locate relevant listings without needing to use exact filters.

**Acceptance Criteria:**

- The platform offers an AI-assisted search bar or mode. This could be an enhanced search bar on the listings page where the user can type a free-form query in plain English describing what they want.  
- When the user submits a natural language query, the system uses a combination of natural language processing (NLP) and the existing search/filter capabilities to interpret the query.  
- For example, the query “red turbo Miata under 10k in GA” would be parsed such that: make/model = Mazda Miata (MX-5), color = red, has modification = turbo (likely turbocharged engine), price range = under $10,000, location = Georgia.  
- Another example: “project car needs work cheap” might be interpreted as condition = project, price = low budget. The system might not find a specific model but will look for listings tagged as project cars within a lower price range.  
- The system then performs a search against the listings database using the derived criteria. It may also use a semantic search approach (vector similarity) to find listings whose descriptions or titles closely match the query even if specific keywords differ.  
- Results: The user is presented with search results ranked by relevance to their query. In the Miata example, it would show red Mazda Miata listings (with turbos, if mentioned in their description/mods) priced below $10k in Georgia as top results. If exact matches are few, it might show the closest alternatives (e.g., a blue turbo Miata under $10k, or a red one slightly above $10k) with slightly lower relevance ranking.  
- If the query is too broad or unclear (e.g., “looking for a car”), the system may either return a broad set of results or prompt the user to refine their query. It could also fall back to showing general search filters (“Please specify make/model or other details for more accurate results”).  
- The AI search understands common synonyms and automotive jargon. For instance, if someone says “Evo” it knows to search for Mitsubishi Lancer Evolution, or “Vette” for Corvette. If they say “stick shift”, it might filter for manual transmission if such data is available in listings. (Some of these data points like transmission aren’t explicitly captured in V1, but might be implied or could be added as structured data by V3 if needed.)  
- The natural language search runs in a reasonable time (the system might pre-index some data or use a fast AI service) so that the user experience remains smooth.  
- The user can still use the traditional filtered search from V1 if they prefer precision. The AI search is an added convenience. We ensure that whatever results the AI search finds are actually coming from our database of listings and adhere to the same permissions (no sold/deleted cars unless the user specifically asks for historical data, which likely they wouldn’t in a normal query).  
- Over time, the search AI could learn from user click behavior to improve relevance (not a direct requirement to implement learning in V3, but the architecture allows future improvement). For now, it should handle a wide range of phrasing accurately based on its initial NLP capability.  

#### V3-4: As a seller, I want to automatically reject lowball offers on my listings (e.g., anything 20% or more below asking price), so that I don’t have to manually deal with unacceptable offers.

**Acceptance Criteria:**

- The platform’s messaging/offer system is extended to support formal purchase offers from buyers (if not already implemented). A buyer interested in a car can submit an offer price through a “Make Offer” functionality on the listing (instead of or in addition to just sending a text message).  
- For each listing, the seller has the option to enable Auto-Reject for low offers. This option can be set per listing when creating or editing the listing (default is off). The standard threshold is a percentage of the asking price. By default, it is 20% below asking (meaning any offer below 80% of asking price will be auto-rejected). The seller can adjust this threshold value if desired (or it could be fixed at 20% in this version).  
- If a buyer submits an offer price that is below the seller’s auto-reject threshold, the system will immediately reject the offer: the buyer is instantly notified (e.g., “Your offer of $8,000 was automatically declined as it is below the seller’s minimum acceptable price.”). The seller may also get a notification that an offer was received and auto-rejected, for their records.  
- Auto-rejected offers do not require any action from the seller and do not appear as pending in the seller’s interface, except perhaps in a log of auto-rejections. This saves the seller time, as they only see offers that meet their threshold.  
- If a buyer submits an offer at or above the threshold (closer to the asking price), the offer goes through to the seller for manual review. The seller will see these offers in their inbox or a dedicated Offers section, where they can choose to accept or reject (or counter, if a future enhancement allows counter-offers).  
- The Make Offer feature for buyers includes guidance if auto-reject is enabled (if known to the system). For example, the UI might warn “Offers below $10,000 will be auto-rejected” (calculating 80% of asking in this case) so buyers have an idea. This can reduce frustration from rejected offers and encourage serious offers only.  
- When an offer is auto-rejected, the buyer cannot simply repeat the same offer; they would need to increase it to be considered. They can submit a new offer above the threshold if they are still interested.  
- All accepted offers, whether manual or automatically processed, continue to follow the flow established: if a seller accepts an offer, the listing is marked as sold (as per V1/V2 functionality) and both parties are notified to proceed with payment/delivery offline. If a seller rejects an offer manually, the buyer is notified of the rejection. Auto-reject simply automates this decision for low offers.  
- The auto-reject setting is optional. If a seller prefers to see all offers, they can leave it disabled. In that case, all buyer offers will come through for manual response as usual.  
- This feature improves seller experience by filtering out “lowball” offers (commonly a pain point in marketplaces) and thus encourages more reasonable negotiations. It’s a step towards giving sellers more control over the selling process on the platform.  

#### V3-5: As a buyer, I want to be able to make a price offer on a car listing within the platform, so that I can negotiate a deal without having to go outside the system.

**Acceptance Criteria:**

- For any active listing, a logged-in buyer can click a “Make Offer” button (in addition to the existing messaging option). This brings up a form to enter a proposed price for the vehicle.  
- The offer amount must be a positive number. Optionally, the UI may enforce that it’s within a reasonable range (for example, it might prevent offers more than 50% below asking to discourage extremely low offers, though auto-reject will handle many cases – this validation is more a UX choice).  
- When the buyer submits an offer, the system records the offer and sends a notification to the seller about the pending offer. The offer includes the offered price and the identity of the buyer.  
- The seller can review the offer in a dedicated Offers view (or within the message thread associated with that listing and buyer). From there, the seller can choose to Accept or Decline the offer. (Counter-offer functionality is not included in V3 scope, so negotiation would be either through messaging or iterative offers made by the buyer.)  
- If the seller accepts the offer, the system marks the listing as Sold (at the accepted price) and notifies both parties that the offer was accepted. The details of the accepted offer (price and who the buyer is) are stored, and this triggers the same flow as marking sold in V2 (recording the sale in the archive with that price).  
- If the seller declines the offer (and hasn’t enabled auto-reject or the offer was above the auto-reject threshold), the buyer is notified that their offer was not accepted. The buyer could then decide to send a higher offer or abandon the attempt.  
- Offers have an expiration (for instance, an offer might be valid for a certain time like 48 hours by default). If the seller does not respond within that time, the offer could expire, notifying the buyer that it wasn’t acted upon. This prevents stale offers from lingering indefinitely.  
- All active and past offers made by the buyer can be seen in a My Offers section on the buyer’s side, showing status (pending, accepted, rejected, expired). Similarly, sellers see incoming offers for their listings in their Offers view.  
- The introduction of the formal offer system works alongside messaging: buyers and sellers can still chat about details in messages, but the actual acceptance of a price is formalized through the offer mechanism. For version 3, payments are still handled off-platform (e.g., in person or via third-party) after an offer is accepted; this feature simply streamlines the agreement on price.  
- This user story underpins the Auto-Reject Lowball Offers feature by providing the mechanism of offers. It ensures the platform supports negotiating price in a structured way, which enhances the overall buying/selling experience and provides more data points (final offer prices) for the platform’s analytics.  
