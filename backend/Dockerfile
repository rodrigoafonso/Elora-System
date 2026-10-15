# Build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle gradle
RUN ./gradlew --no-daemon dependencies > /dev/null
COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# Runtime (imagem enxuta, usuário sem privilégios)
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 elora
WORKDIR /app
COPY --from=build /src/build/libs/*.jar app.jar
USER elora
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
