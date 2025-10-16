Control Finanzas – Backend (Spring Boot 3)

Requisitos
- Java 17
- Maven 3.9+
- PostgreSQL en localhost con base `finanzas`

Configuración
- Archivo: `src/main/resources/application.yml`
  - URL: `jdbc:postgresql://localhost:5432/finanzas`
  - Usuario: `postgres`
  - Password: `admin123`
  - Flyway habilitado (migraciones en `db/migration`)

Arranque
- Desde `server/`: `mvn spring-boot:run`
- La app corre en `http://localhost:8080`

Arquitectura (feature-first)
- Paquetes por dominio (feature):
  - `com.finanzas.accounts`
  - `com.finanzas.categories`
  - `com.finanzas.transactions`
  - `com.finanzas.budgets` (incluye budgets y fixed-expenses)
  - `com.finanzas.savings`
- Transversales:
  - `com.finanzas.config` (WebConfig, OpenAPI, GlobalExceptionHandler)
  - `com.finanzas.common` (excepciones comunes)
- Patrón por feature: Entidad · Repositorio · Servicio · Controlador · DTOs
- Errores: el `GlobalExceptionHandler` devuelve Problem JSON (404 NotFound, 409 Conflict, 400 Bad Request)

CORS
- Habilitado para `http://localhost:4200` bajo `/api/**` (ver `config/WebConfig`).

Endpoints (resumen)
- Accounts
  - GET `/api/v1/accounts`
  - POST `/api/v1/accounts`
  - PATCH `/api/v1/accounts/{id}`
  - DELETE `/api/v1/accounts/{id}`
- Categories
  - GET `/api/v1/categories`
  - POST `/api/v1/categories`
  - PATCH `/api/v1/categories/{id}`
  - DELETE `/api/v1/categories/{id}`
- Transactions
  - GET `/api/v1/transactions?monthKey=yyyy-MM`
  - POST `/api/v1/transactions`
  - DELETE `/api/v1/transactions/{id}`
- Budgets
  - GET `/api/v1/budgets/categories?monthKey=yyyy-MM`
  - PUT `/api/v1/budgets/categories/{categoryId}`
  - DELETE `/api/v1/budgets/categories/{id}`
- Fixed Expenses
  - GET `/api/v1/fixed-expenses`
  - POST `/api/v1/fixed-expenses`
  - PATCH `/api/v1/fixed-expenses/{id}`
  - DELETE `/api/v1/fixed-expenses/{id}`
- Savings
  - POST `/api/v1/savings/transfer`
- Settings
  - GET `/api/v1/settings`
  - PATCH `/api/v1/settings`

Swagger / OpenAPI
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/api/v1/openapi`
- Exportar a `public/openapi.yaml` (requiere backend arriba en 8080):
  - `mvn -P export-openapi verify`

Migraciones (Flyway)
- `V1__init.sql` crea tablas base (accounts, categories, transactions, budget_categories, savings_plans, savings_moves, settings)
- `V2__account_type.sql` agrega `accounts.type`
- `V3__fixed_expenses.sql` agrega `fixed_expenses`

Buenas prácticas
- Mantener estructura por feature (controller/service/repository/DTO/entity juntos).
- Validaciones en DTOs de request; lógica en services; controllers solo orquestan.
- Lanzar `NotFoundException`, `ConflictException` o `IllegalArgumentException`; el handler global formatea la respuesta.
- Migraciones idempotentes y versionadas en `db/migration`.
