# Nestled — Home Inventory

Nestled is a full-stack learning project for cataloguing household items and finding them again through a clear hierarchy:

```text
Home → Room → Storage location → Item
Home → Bedroom → Wardrobe → Passport
```

It deliberately focuses on Spring Boot fundamentals. Authentication uses Google OpenID Connect with a server-side Spring Security session; Docker, Lombok, and mapping libraries have not been added.

## Technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, native `fetch`
- **Backend:** Java 21, Spring Boot, Maven, Spring Web, Spring Security, OpenID Connect, Spring Data JPA, Hibernate, Bean Validation
- **Database:** PostgreSQL
- **Tests:** JUnit 5, Mockito, Spring MockMvc

## What is included

- Dashboard totals for items, rooms, categories, and estimated value
- Room cards with item counts
- Item CRUD, detail view, global name search, room/location/category filters, bulk relocation, and hierarchical tree navigation
- Optional item photos with camera/file upload, thumbnails, replacement, and removal
- Room CRUD and storage-location CRUD
- Category CRUD with a display color
- Separate household inventories, household switching, and invitation-based sharing
- Validation and consistent JSON error responses
- DTO-only controller responses (JPA entities never become the API contract)
- Responsive React interface and one centralized API layer

## Folder structure and request layers

```text
home-inventory/
├── backend/
│   └── src/main/java/com/example/homeinventory/
│       ├── config/       # Cross-cutting web configuration (CORS)
│       ├── controller/   # HTTP endpoints; similar to Express routers/controllers
│       ├── dto/          # Safe request and response shapes
│       ├── entity/       # JPA objects mapped to PostgreSQL tables
│       ├── exception/    # Application errors and global error translation
│       ├── repository/   # Database access through Spring Data JPA
│       └── service/      # Business rules and entity/DTO mapping
└── frontend/
    └── src/
        ├── api/          # All fetch calls in one place
        ├── components/   # Reusable layout and state components
        └── pages/        # Route-level screens
```

The main dependency direction is:

```text
React → Controller → Service → Repository → Hibernate → PostgreSQL
          DTOs        Entities         SQL
```

| Spring Boot | Familiar Express idea |
|---|---|
| `@RestController` | Express router/controller |
| Service class | Business-logic module |
| `JpaRepository` | Database-access module/ORM model API |
| `@RequestBody` | `req.body` |
| `@PathVariable` | `req.params` |
| `@RequestParam` | `req.query` |
| Dependency injection | Passing preconfigured dependencies into a module |
| `@RestControllerAdvice` | Central Express error middleware |

## Build stages

### Stage 1 — Spring Boot project

`backend/pom.xml` describes the Maven project and dependencies. `HomeInventoryApplication` is the entry point. `@SpringBootApplication` enables component scanning, auto-configuration, and configuration support. Spring discovers annotated classes below the `com.example.homeinventory` package and creates the necessary objects (beans).

### Stage 2 — PostgreSQL configuration

Create a local database from `psql`:

```sql
CREATE DATABASE home_inventory;
```

Create your persistent local backend configuration once:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend/.env` and replace `DB_PASSWORD` (and any other value that differs on your machine). Spring Boot imports this file automatically when it is launched from `backend/`, so future terminals only need `mvn spring-boot:run`. The real `.env` is ignored by Git; `.env.example` documents the required keys without containing secrets.

Authentication also requires a Google OAuth 2.0 **Web application** client. In Google Cloud Console, add this authorized redirect URI:

```text
http://localhost:8080/login/oauth2/code/google
```

For a deployed backend, register the corresponding HTTPS URI, such as `https://api.example.com/login/oauth2/code/google`.

Then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`. Any Google account with a verified email can sign in. The account is persisted locally by its stable issuer and subject identifiers, while Spring Security keeps the browser signed in with an HTTP-only session cookie.

Every user receives a personal household that they own. Owners can open **Household** in the sidebar, rename the selected household, and invite another person's Google email. The invitee keeps their personal household and must explicitly accept or decline; accepting adds a membership and switches them to the shared household. The household selector in the sidebar lets a user move between every household they own or have joined. Rooms, locations, categories, items, dashboard totals, searches, bulk actions, and photos are all restricted to the selected household. Existing records are migrated into the original household, while existing member accounts also receive their own personal household.

Operating-system environment variables and command-line arguments can still override these local values, which is useful in deployment environments.

`application.properties` uses these environment variables and supplies local defaults. `spring.jpa.hibernate.ddl-auto=update` asks Hibernate to compare the JPA entity model to the current schema and add/update schema objects. It is convenient for this first learning version, but it does not provide a reviewed, repeatable history. A production app should normally use Flyway or Liquibase migrations and `ddl-auto=validate`.

Uploaded photos default to `backend/uploads/` when the backend is started from that directory. `PHOTO_STORAGE_LOCATION` can point at another writable directory. The backend accepts JPEG, PNG, WebP, and GIF images up to 5 MB, stores only generated filenames in PostgreSQL, and never uses a client filename as a disk path. This local filesystem setup is intended for local learning; a deployed multi-user version should add authentication and object storage.

### Stage 3 — Entities and relationships

Entities belong to the persistence layer:

- `@Entity` makes a Java class persistable by JPA.
- `@Id` marks its primary key.
- `@GeneratedValue(strategy = IDENTITY)` lets PostgreSQL generate numeric IDs.
- `@ManyToOne` stores a foreign key on the many side. Each item has one room and category; many items may share them.
- `@OneToMany(mappedBy = ...)` describes the inverse collection. `mappedBy` says the foreign key is owned by the other entity.
- `FetchType.LAZY` waits to load a related object until code uses it.
- `@Enumerated(EnumType.STRING)` stores `GOOD`, not a fragile numeric enum position.
- `@PrePersist` and `@PreUpdate` fill timestamps automatically.

The model is `Room 1 → many StorageLocation`, while an `Item` has required many-to-one links to `Room`, `Category`, and `StorageLocation`. Requiring a precise location keeps every item addressable in the home tree. The service verifies that an item's storage location belongs to its selected room.

### Stage 4 — Repositories

Repositories belong to the data-access layer. For example, `ItemRepository` extends `JpaRepository<Item, Long>`. Spring creates its implementation at runtime and supplies common persistence operations without handwritten SQL. Household-aware method names such as `findByIdAndHouseholdId` are parsed into tenant-scoped queries. `totalEstimatedValue(householdId)` demonstrates an explicit JPQL query with the same boundary.

### Stage 5 — DTOs

DTO means **Data Transfer Object**. Request DTOs say exactly what the frontend may send; response DTOs say exactly what clients receive. They are Java records because records are small immutable data carriers.

Entities are not returned from controllers because:

1. Entity relationships can recursively serialize (`room → items → room`).
2. Lazy relationships can trigger queries during JSON serialization or fail outside a transaction.
3. Database changes would silently change the public API.
4. Clients could receive persistence-only or future sensitive fields.

Mapping is manual in the services. On create/update, a service copies scalar request fields and resolves relationship IDs into managed entities. On response, it reads the entity and constructs an `ItemResponse` containing useful IDs and names. This is intentionally visible before introducing MapStruct.

### Stage 6 — Services

Services contain business operations. `ItemService`, for example, loads related rows, validates the room/location relationship, saves through the repository, and maps to `ItemResponse`. `@Service` registers the class as a Spring bean. `@Transactional` creates a database transaction; read-only methods use `@Transactional(readOnly = true)`.

Constructor injection makes dependencies explicit and easy to unit-test. Spring sees the constructor and provides each repository/service bean. No `new ItemRepository()` is needed—roughly like configuring modules once in Express and injecting them into route handlers.

### Stage 7 — Controllers and REST

Controllers translate HTTP into service calls. They stay small because business logic belongs in services. `@RequestMapping` sets the common route, while `@GetMapping`, `@PostMapping`, `@PutMapping`, and `@DeleteMapping` select HTTP methods. `@ResponseStatus(CREATED)` returns 201 after creation and `NO_CONTENT` returns 204 after deletion.

### Stage 8 — Validation

Request records use Bean Validation annotations: `@NotBlank`, `@NotNull`, `@Min(1)`, `@PositiveOrZero`, `@Size`, and `@Pattern`. A controller's `@Valid @RequestBody` asks Spring to validate JSON before calling the service. Frontend constraints improve the user experience, but backend validation remains authoritative because any HTTP client can call the API.

### Stage 9 — Exception handling

`GlobalExceptionHandler` uses `@RestControllerAdvice`, the Spring equivalent of central Express error middleware. It converts not-found, bad-request, validation, malformed JSON, and database-conflict failures into a stable shape:

```json
{
  "timestamp": "2026-08-26T12:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Item with id 5 was not found",
  "fieldErrors": {}
}
```

### Stage 10 — Test the API

Start PostgreSQL, then from `backend/` run:

```powershell
mvn test
mvn spring-boot:run
```

Example requests:

```bash
curl -X POST http://localhost:8080/api/rooms -H "Content-Type: application/json" -d '{"name":"Bedroom","description":"Main bedroom"}'
curl -X POST http://localhost:8080/api/categories -H "Content-Type: application/json" -d '{"name":"Documents","color":"#2563EB"}'
curl -X POST http://localhost:8080/api/storage-locations -H "Content-Type: application/json" -d '{"name":"Top drawer","roomId":1}'
curl -X POST http://localhost:8080/api/items -H "Content-Type: application/json" -d '{"name":"Passport","quantity":1,"categoryId":1,"roomId":1,"storageLocationId":1,"estimatedValue":0,"condition":"GOOD"}'
curl "http://localhost:8080/api/items/search?name=passport"
```

`ItemControllerTest` exercises request validation through MockMvc (a simulated HTTP layer). `ItemServiceTest` checks the cross-room storage-location business rule with Mockito dependencies.

### Stages 11–13 — React, connection, and CRUD UI

From `frontend/`:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Vite reads `VITE_API_URL` and `VITE_BACKEND_URL`; copy `.env.example` to `.env` only if the backend URL differs. Spring Security allows the configured `FRONTEND_URL` to make credentialed API calls. The React client obtains a CSRF token before unsafe requests and sends the session cookie with every API request.

The API layer prevents network details from spreading across UI components. A page asks `itemApi.create(payload)` to save an item; `itemApi` owns the URL, HTTP method, JSON encoding, and shared error behavior. This makes components easier to read, endpoints easier to change, and API functions easier to test.

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Return the signed-in local user |
| GET | `/api/auth/csrf` | Issue the CSRF token used by the React client |
| POST | `/api/auth/logout` | End the current server-side session |
| POST | `/api/auth/households/{id}/activate` | Switch to one of the signed-in user's households |
| POST | `/api/invitations/{id}/accept` | Accept an invitation addressed to the signed-in email |
| DELETE | `/api/invitations/{id}` | Decline an invitation addressed to the signed-in email |
| GET | `/api/dashboard` | Totals and room summaries |
| GET | `/api/items?roomId=&storageLocationId=&categoryId=` | List/filter items |
| GET | `/api/items/search?name=` | Search names, case-insensitive |
| POST | `/api/items/bulk-move` | Move multiple items to one room and storage location |
| GET/PUT/DELETE | `/api/items/{id}` | Read/update/delete an item |
| GET/PUT/DELETE | `/api/items/{id}/photo` | Read, upload/replace, or remove an item's photo |
| POST | `/api/items` | Create an item |
| GET/POST | `/api/rooms` | List/create rooms |
| GET/PUT/DELETE | `/api/rooms/{id}` | Read/update/delete a room |
| GET | `/api/rooms/{roomId}/storage-locations` | Locations in one room |
| GET/POST | `/api/categories` | List/create categories |
| GET/PUT/DELETE | `/api/categories/{id}` | Read/update/delete a category |
| GET/POST | `/api/storage-locations` | List/create locations |
| GET/PUT/DELETE | `/api/storage-locations/{id}` | Read/update/delete a location |

## Complete “Add Item” request flow

1. The user fills in `ItemFormPage` and clicks **Add item**.
2. React's submit handler turns controlled form state into an `ItemPayload`.
3. `itemApi.create` sends a `POST /api/items` request with JSON. This resembles calling a shared Express API-client helper.
4. `ItemController.create` receives the body. `@RequestBody` is like `req.body`; Jackson converts JSON into `CreateItemRequest`.
5. `@Valid` checks the DTO. Invalid input stops here and `GlobalExceptionHandler` returns HTTP 400 with field errors.
6. The controller calls `ItemService.create`. The controller knows HTTP; the service knows the use case.
7. The service manually copies allowed fields into a new `Item`, uses the other services/repositories to turn `roomId`, `categoryId`, and `storageLocationId` into JPA entities, and checks that room and location agree.
8. `ItemRepository.save(item)` hands the entity to Spring Data JPA.
9. Hibernate, the JPA implementation, creates and executes parameterized SQL inside the transaction.
10. PostgreSQL inserts the row and generates its ID. Hibernate updates the Java entity with that ID.
11. The service manually maps the saved entity to `ItemResponse`, including readable room/category/location names.
12. The controller returns that DTO. Spring/Jackson serializes it to JSON with HTTP 201.
13. `itemApi` parses the JSON. React navigates to the new item's detail page, which fetches and renders the saved record.

In short: **Controller → Service → Repository → database** separates transport, business rules, data access, and storage. An **entity** models persisted state and relationships; a **DTO** models a deliberate API message.

## Spring Boot Concepts I Learned

- **Dependency Injection:** Classes declare constructor dependencies; Spring builds and supplies them. This reduces coupling and makes unit tests simple.
- **Beans:** Objects managed by Spring's application context. `@Service`, `@RestController`, and `@Configuration` register bean definitions.
- **Controllers:** The HTTP boundary: routes, request parsing, validation trigger, status codes, and response DTOs.
- **Services:** Use-case logic and transaction boundaries. They coordinate repositories and mapping.
- **Repositories:** Interfaces through which the app queries and writes persistent data.
- **Entities:** Java objects whose fields and relationships map to database tables and foreign keys.
- **DTOs:** Purpose-built API input/output shapes that protect the entity model.
- **JPA:** The Java persistence specification: annotations and APIs for object-relational mapping.
- **Hibernate:** The implementation of JPA that tracks entities and generates SQL.
- **Validation:** Declarative input rules executed by `@Valid` before service work begins.
- **Exception Handling:** Central translation from Java exceptions into predictable HTTP errors.

## Ten practice exercises (solutions intentionally omitted)

1. Add an optional `brand` field to Item, both item request DTOs, `ItemResponse`, mapping code, and the React form/detail page.
2. Add `GET /api/items/count` and return only the current item count.
3. Add sorting to `GET /api/items` with a `sort` query parameter for name or estimated value.
4. Add an item-condition filter from repository through UI.
5. Reject a warranty expiration date earlier than the purchase date with a helpful message.
6. Add a `RoomDetailsPage` that shows its locations and items.
7. Add repository pagination with `Pageable`, then add Previous/Next controls in React.
8. Create `PATCH /api/items/{id}/quantity` with a small dedicated DTO.
9. Add a dashboard statistic for items whose warranty expires in the next 30 days.
10. Add service tests for not-found items and combined room/category filtering.

## Sensible future features

After the fundamentals are comfortable: email delivery for household invitations, Flyway migrations, pagination and sorting, Testcontainers integration tests, object-storage-backed photos, CSV export, and audit history.
