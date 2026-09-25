FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /build/target/home-inventory-0.0.1-SNAPSHOT.jar app.jar

RUN useradd --system --uid 10001 appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-10000} --server.address=0.0.0.0"]
