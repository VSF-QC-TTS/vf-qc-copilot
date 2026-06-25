# ============================================================
# Multi-stage build: Maven build -> Spring Boot runtime
# ============================================================

# -----------------------------------------------------------
# Stage 1: Build the JAR with Maven
# -----------------------------------------------------------
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build

COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml

RUN chmod +x mvnw \
    && ./mvnw dependency:go-offline -B -q

COPY src src

RUN ./mvnw package -DskipTests -B -q \
    && find target -maxdepth 1 -type f -name "*.jar" \
        ! -name "*sources.jar" \
        ! -name "*javadoc.jar" \
        -exec cp {} app.jar \; \
        -quit

# -----------------------------------------------------------
# Stage 2: Production runtime
# -----------------------------------------------------------
FROM eclipse-temurin:21-jre

LABEL maintainer="nghlong3004"
LABEL description="VinFast QC Copilot API"

WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=prod
ENV HOME=/app

RUN mkdir -p /app/logs /app/exports \
    && addgroup --system vat \
    && adduser --system --ingroup vat vat

COPY --chown=vat:vat --from=builder /build/app.jar /app/app.jar

USER vat

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
