# 1. Aşama: Derleme (Build)
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY hayvantakip/pom.xml .
COPY hayvantakip/src ./src
RUN mvn clean package -DskipTests

# 2. Aşama: Çalıştırma (Run)
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]