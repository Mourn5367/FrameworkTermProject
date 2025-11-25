package com.dnf.insight.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 설정
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - API Docs (JSON): http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("던파 인사이트 API")
                        .version("1.0.0")
                        .description("""
                                던전앤파이터 캐릭터 분석 및 경매장 시세 트래커 API

                                **주요 기능:**
                                - 캐릭터 검색 및 정보 조회
                                - 장비 수집 및 랭킹 시스템
                                - 주간 던전 현황 분석
                                - 접속 시간대 패턴 분석

                                **기술 스택:**
                                - Spring Boot 3.5.3
                                - MongoDB 7.0
                                - Redis 7
                                - 네오플 던파 API
                                """)
                        .contact(new Contact()
                                .name("DnF Insight Team")
                                .url("https://github.com/yourusername/dnf-insight"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("로컬 개발 서버"),
                        new Server()
                                .url("https://api.dnf-insight.com")
                                .description("프로덕션 서버 (예정)")
                ));
    }
}
