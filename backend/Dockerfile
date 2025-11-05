FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# 필요한 도구 설치
RUN apk add --no-cache wget unzip

# Gradle Wrapper 파일 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Gradle Wrapper JAR 다운로드 (없는 경우)
RUN chmod +x ./gradlew && \
    if [ ! -f gradle/wrapper/gradle-wrapper.jar ]; then \
        wget -O gradle/wrapper/gradle-wrapper.jar \
        https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar || \
        (mkdir -p gradle/wrapper && \
         wget -O /tmp/gradle-8.11.1-bin.zip https://services.gradle.org/distributions/gradle-8.11.1-bin.zip && \
         unzip -q /tmp/gradle-8.11.1-bin.zip -d /tmp && \
         cp /tmp/gradle-8.11.1/lib/plugins/gradle-wrapper-*.jar gradle/wrapper/gradle-wrapper.jar); \
    fi

# 소스 복사
COPY src src

# 빌드
RUN ./gradlew clean build -x test

# 런타임 이미지
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 로그 디렉토리 생성
RUN mkdir -p /app/logs

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
