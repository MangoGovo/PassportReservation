# Passport Reservation Backend

Spring Boot 3 backend for `PRD.md`.

## Stack

- Spring Boot 3.5.14
- MyBatis-Plus 3.5.15
- Sa-Token 1.44.0
- MySQL 8+
- Redis
- BCrypt, AES-GCM, SHA-256, HMAC-SHA256
- zxing QR code generation

## Local Config

Default database config in `src/main/resources/application.yml`:

```yaml
spring.datasource.url: jdbc:mysql://localhost:3306/passport_reservation
spring.datasource.username: root
spring.datasource.password: 123456
```

Use environment variables to override:

```bash
DB_URL=jdbc:mysql://localhost:3306/passport_reservation \
DB_USERNAME=root \
DB_PASSWORD=123456 \
APP_SENSITIVE_KEY=0123456789abcdef0123456789abcdef \
./mvnw spring-boot:run
```

## Database

Initialization scripts:

- `src/main/resources/db/schema.sql`
- `src/main/resources/db/data.sql`

Default admin account:

- Login name: `admin`
- Password: `Admin123!`

## Run

Start Redis before using login/session APIs because Sa-Token persists sessions in Redis.

```bash
./mvnw test
./mvnw spring-boot:run
```

Health check:

```bash
curl http://localhost:8080/actuator/health
```

API docs:

- Knife4j UI: `http://localhost:8080/doc.html`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

If Redis is not running during a local smoke test, the app can start but `/actuator/health` reports Redis as down. For a temporary web-layer check:

```bash
MANAGEMENT_HEALTH_REDIS_ENABLED=false ./mvnw spring-boot:run
```
