Control Finanzas - Backend (Spring Boot 3)

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
```
mvn spring-boot:run
```
La app corre en `http://localhost:8080`.

CORS
- Habilitado para `http://localhost:4200` bajo el path `/api/**`.

Endpoints iniciales
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
  - GET `/api/v1/savings/plans?monthKey=yyyy-MM`
  - POST `/api/v1/savings/plans`
  - PATCH `/api/v1/savings/plans/{id}`
  - DELETE `/api/v1/savings/plans/{id}`
  - GET `/api/v1/savings/moves?monthKey=yyyy-MM`
  - POST `/api/v1/savings/moves/schedule?monthKey=yyyy-MM&totalIncome=0`
  - POST `/api/v1/savings/moves/{id}/done`
- Settings
  - GET `/api/v1/settings`
  - PATCH `/api/v1/settings`

Swagger / OpenAPI
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/api/v1/openapi`
- Exportar al frontend: `npm run export:openapi` (backend arriba en 8080)

Migraciones (Flyway)
- `V1__init.sql` crea tablas base (accounts, categories, transactions, budget_categories, savings_plans, savings_moves, settings)
- `V2__account_type.sql` agrega `accounts.type`
- `V3__fixed_expenses.sql` agrega `fixed_expenses`

Siguientes pasos sugeridos
- Agregar `categories` y `transactions` con operaciones atómicas para “done” de ahorro (gasto en origen + ingreso en destino).
- Añadir `OpenAPI` autoexpuesto con Springdoc y alinear el contrato con `public/openapi.yaml` del frontend.
