Backend Architecture and Conventions

Overview
- Spring Boot 3, Java 17, Maven.
- PostgreSQL + JPA (Hibernate) + Flyway.
- Swagger/OpenAPI via Springdoc.

Packaging (feature-first)
- Domain packages (features):
  - com.finanzas.accounts
  - com.finanzas.categories
  - com.finanzas.transactions
  - com.finanzas.budgets (budgets + fixed-expenses)
  - com.finanzas.savings
- Cross-cutting:
  - com.finanzas.config (WebConfig, OpenAPI, GlobalExceptionHandler)
  - com.finanzas.common (shared exceptions)

Pattern per feature
- Entity: JPA @Entity and mapping
- Repository: Spring Data JpaRepository
- Service: business logic and validations
- Controller: HTTP endpoints delegating to services
- DTOs: request/response mapping and validations

Error handling
- Services throw domain exceptions:
  - NotFoundException → 404
  - ConflictException → 409
  - IllegalArgumentException → 400
- GlobalExceptionHandler converts exceptions to Problem JSON uniformly.

OpenAPI export
- Run the app on :8080
- Generate and copy spec to frontend public/:
  - mvn -P export-openapi verify

Database migrations
- Versioned SQL in src/main/resources/db/migration
- Keep migrations idempotent and descriptive (Vx__name.sql)

Contribution guidelines
- Keep controllers thin; place logic in services.
- Use DTOs with Bean Validation for inputs.
- Prefer package-private where possible within a feature for cohesion.
- Add tests for services where practical.

## Lombok Guidelines

- General
  - Use Lombok to reduce boilerplate where it’s safe and explicit.
  - Prefer targeted annotations (`@Getter`, `@Setter`, `@RequiredArgsConstructor`, `@Slf4j`) over broad macros like `@Data`.

- JPA Entities
  - Do not use `@Data`.
  - Use `@Getter`/`@Setter` and `@NoArgsConstructor(access = PROTECTED)` to satisfy JPA.
  - Avoid including LAZY relations in `toString` to prevent unintended loads: use `@ToString(exclude = { ... })`.
  - Do not generate `equals`/`hashCode` unless there is a clear, stable identity strategy; default Object identity is acceptable for this project.

- Services/Controllers
  - Prefer constructor injection with `@RequiredArgsConstructor`.
  - Use `@Slf4j` for logging.

- DTOs
  - Prefer Java 17 `record` for simple, immutable DTOs.
  - If mutability or builders are needed, use Lombok `@Value` or `@Builder` in DTOs (not in entities).

- Tooling
  - Ensure IDE annotation processing is enabled. CI uses Lombok as a `provided` scope dependency in Maven.
