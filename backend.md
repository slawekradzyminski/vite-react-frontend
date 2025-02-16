================================================
File: pom.xml
================================================
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>murraco</groupId>
    <artifactId>jwt-auth-service</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>spring-boot-jwt</name>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>21</java.version>
        <start-class>com.awesome.testing.JwtAuthServiceApp</start-class>
    </properties>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.2</version>
        <relativePath/>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-artemis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.activemq</groupId>
            <artifactId>artemis-jms-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.activemq</groupId>
            <artifactId>artemis-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.activemq</groupId>
            <artifactId>artemis-jms-server</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>
        <dependency>
            <groupId>org.zalando</groupId>
            <artifactId>logbook-spring-boot-starter</artifactId>
            <version>3.10.0</version>
        </dependency>

        <!-- Jakarta EE -->
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
        </dependency>
        <dependency>
            <groupId>jakarta.persistence</groupId>
            <artifactId>jakarta.persistence-api</artifactId>
        </dependency>
        <dependency>
            <groupId>jakarta.validation</groupId>
            <artifactId>jakarta.validation-api</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>

        <!-- SpringDoc OpenAPI (replacing Swagger) -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.8.4</version>
        </dependency>

        <!-- H2 Database -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
        </dependency>

        <!-- PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- QR codes -->
        <dependency>
            <groupId>com.google.zxing</groupId>
            <artifactId>core</artifactId>
            <version>3.5.3</version>
        </dependency>
        <dependency>
            <groupId>com.google.zxing</groupId>
            <artifactId>javase</artifactId>
            <version>3.5.3</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>net.datafaker</groupId>
            <artifactId>datafaker</artifactId>
            <version>2.4.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>21</source>
                    <target>21</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.5.2</version>
            </plugin>
        </plugins>
    </build>

</project>


================================================
File: src/main/java/com/awesome/testing/JwtAuthServiceApp.java
================================================
package com.awesome.testing;

import com.awesome.testing.fakedata.SetupData;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JwtAuthServiceApp implements CommandLineRunner {

    @Autowired(required = false)
    private SetupData setupData;

    public static void main(String[] args) {
        SpringApplication.run(JwtAuthServiceApp.class, args);
    }

    @Override
    public void run(String... params) {
        if (setupData != null) {
            setupData.setupData();
        }
    }
}


================================================
File: src/main/java/com/awesome/testing/config/DockerisedConfig.java
================================================
package com.awesome.testing.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.transaction.ChainedTransactionManager;
import org.springframework.jms.connection.JmsTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.springframework.beans.factory.annotation.Value;

@SuppressWarnings("unused")
@Configuration
@Profile("!local")
public class DockerisedConfig {

    @Value("${spring.artemis.broker-url}")
    private String brokerUrl;

    @Value("${spring.artemis.user}")
    private String username;

    @Value("${spring.artemis.password}")
    private String password;

    @Bean
    public ActiveMQConnectionFactory connectionFactory() {
        ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory(brokerUrl);
        connectionFactory.setUser(username);
        connectionFactory.setPassword(password);
        return connectionFactory;
    }

    @Bean(name = "jpaTransactionManager")
    public PlatformTransactionManager jpaTransactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean(name = "jmsTransactionManager")
    public PlatformTransactionManager jmsTransactionManager() {
        return new JmsTransactionManager(connectionFactory());
    }

    @Primary
    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(
            EntityManagerFactory entityManagerFactory,
            ActiveMQConnectionFactory connectionFactory) {
        return new ChainedTransactionManager(
                jpaTransactionManager(entityManagerFactory),
                jmsTransactionManager()
        );
    }
} 

================================================
File: src/main/java/com/awesome/testing/config/LocalConfig.java
================================================
package com.awesome.testing.config;

import jakarta.persistence.EntityManagerFactory;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.activemq.artemis.api.core.TransportConfiguration;
import org.apache.activemq.artemis.core.config.impl.ConfigurationImpl;
import org.apache.activemq.artemis.core.remoting.impl.invm.InVMConnectorFactory;
import org.apache.activemq.artemis.core.server.embedded.EmbeddedActiveMQ;
import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.support.converter.MappingJackson2MessageConverter;
import org.springframework.jms.support.converter.MessageConverter;
import org.springframework.jms.support.converter.MessageType;
import org.springframework.jms.connection.CachingConnectionFactory;
import org.springframework.jms.connection.JmsTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.data.transaction.ChainedTransactionManager;
import org.springframework.orm.jpa.JpaTransactionManager;

@SuppressWarnings("unused")
@Slf4j
@Configuration
@Profile("local")
public class LocalConfig {

    @SneakyThrows
    @Bean(initMethod = "start", destroyMethod = "stop")
    public EmbeddedActiveMQ embeddedActiveMQ() {
        EmbeddedActiveMQ embeddedActiveMQ = new EmbeddedActiveMQ();
        ConfigurationImpl configuration = new ConfigurationImpl();
        configuration.setPersistenceEnabled(false);
        configuration.setSecurityEnabled(false);
        configuration.addAcceptorConfiguration("invm", "vm://0");
        configuration.addConnectorConfiguration("invm", new TransportConfiguration(InVMConnectorFactory.class.getName()));
        embeddedActiveMQ.setConfiguration(configuration);
        return embeddedActiveMQ;
    }

    @Bean
    public ActiveMQConnectionFactory connectionFactory(EmbeddedActiveMQ embeddedActiveMQ) {
        ActiveMQConnectionFactory factory = new ActiveMQConnectionFactory("vm://0");
        factory.setUser("admin");
        factory.setPassword("admin");
        return factory;
    }

    @Bean
    public CachingConnectionFactory cachingConnectionFactory(ActiveMQConnectionFactory connectionFactory) {
        CachingConnectionFactory cachingConnectionFactory = new CachingConnectionFactory();
        cachingConnectionFactory.setTargetConnectionFactory(connectionFactory);
        cachingConnectionFactory.setSessionCacheSize(10);
        cachingConnectionFactory.setCacheConsumers(false);
        cachingConnectionFactory.setCacheProducers(true);
        return cachingConnectionFactory;
    }

    @Bean
    public MessageConverter jacksonJmsMessageConverter() {
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setTargetType(MessageType.TEXT);
        converter.setTypeIdPropertyName("_awesome_");
        return converter;
    }

    @Bean
    public JmsTemplate jmsTemplate(CachingConnectionFactory cachingConnectionFactory, MessageConverter messageConverter) {
        JmsTemplate jmsTemplate = new JmsTemplate(cachingConnectionFactory);
        jmsTemplate.setMessageConverter(messageConverter);
        jmsTemplate.setSessionTransacted(true);
        jmsTemplate.setDefaultDestinationName("email");
        return jmsTemplate;
    }

    @Bean(name = "jpaTransactionManager")
    public PlatformTransactionManager jpaTransactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean(name = "jmsTransactionManager")
    public PlatformTransactionManager jmsTransactionManager(CachingConnectionFactory cachingConnectionFactory) {
        return new JmsTransactionManager(cachingConnectionFactory);
    }

    @Primary
    @Bean(name = "transactionManager")
    public PlatformTransactionManager transactionManager(
            EntityManagerFactory entityManagerFactory,
            CachingConnectionFactory cachingConnectionFactory) {
        return new ChainedTransactionManager(
                jpaTransactionManager(entityManagerFactory),
                jmsTransactionManager(cachingConnectionFactory)
        );
    }
} 

================================================
File: src/main/java/com/awesome/testing/config/LogbookConfig.java
================================================
package com.awesome.testing.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.zalando.logbook.HttpLogFormatter;

@SuppressWarnings("unused")
@Configuration
public class LogbookConfig {

    public ObjectMapper logbookObjectMapper() {
        return new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
    }

    @Bean
    public HttpLogFormatter httpLogFormatter(ObjectMapper logbookObjectMapper) {
        return new PrettyPrintingHttpLogFormatter(logbookObjectMapper);
    }
} 

================================================
File: src/main/java/com/awesome/testing/config/PrettyPrintingHttpLogFormatter.java
================================================
package com.awesome.testing.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.zalando.logbook.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
public class PrettyPrintingHttpLogFormatter implements HttpLogFormatter {
    private final ObjectMapper mapper;

    @Override
    @SuppressWarnings("all")
    public String format(Precorrelation precorrelation, HttpRequest request) throws JsonProcessingException {
        try {
            Map<String, Object> content = toJson(request, precorrelation);
            return formatWithPrettyBody(content);
        } catch (IOException e) {
            throw new JsonProcessingException(e) {};
        }
    }

    @Override
    @SuppressWarnings("all")
    public String format(Correlation correlation, HttpResponse response) throws JsonProcessingException {
        try {
            Map<String, Object> content = toJson(response, correlation);
            return formatWithPrettyBody(content);
        } catch (IOException e) {
            throw new JsonProcessingException(e) {};
        }
    }

    private Map<String, Object> toJson(HttpRequest request, Precorrelation precorrelation) throws IOException {
        String body = request.getBodyAsString();
        return Map.of(
                "origin", "remote",
                "type", "request",
                "correlation", precorrelation.getId(),
                "protocol", request.getProtocolVersion(),
                "method", request.getMethod(),
                "uri", request.getRequestUri(),
                "headers", request.getHeaders(),
                "body", body
        );
    }

    private Map<String, Object> toJson(HttpResponse response, Correlation correlation) throws IOException {
        String body = response.getBodyAsString();
        return Map.of(
                "origin", "local",
                "type", "response",
                "correlation", correlation.getId(),
                "duration", correlation.getDuration().toMillis(),
                "protocol", response.getProtocolVersion(),
                "status", response.getStatus(),
                "headers", response.getHeaders(),
                "body", body
        );
    }

    private String formatWithPrettyBody(Map<String, Object> content) throws JsonProcessingException {
        if (content.containsKey("body") && content.get("body") instanceof String) {
            try {
                Object body = mapper.readValue((String) content.get("body"), Object.class);
                Map<String, Object> mutableContent = new HashMap<>(content);
                mutableContent.put("body", body);
                content = mutableContent;
            } catch (JsonProcessingException ignored) {
                // If body is not JSON, leave it as is
            }
        }
        return mapper.writeValueAsString(content);
    }
} 

================================================
File: src/main/java/com/awesome/testing/config/SwaggerConfig.java
================================================
package com.awesome.testing.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .info(new Info()
                        .title("JWT Authentication API")
                        .version("1.0")
                        .description("This is a sample JWT authentication service.")
                        .termsOfService("http://swagger.io/terms/")
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")));
    }
}


================================================
File: src/main/java/com/awesome/testing/controller/EmailController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.email.EmailDto;
import com.awesome.testing.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email")
@Tag(name = "email", description = "Email sending endpoints")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class EmailController {

    private final EmailService emailService;

    @Value("${activemq.destination}")
    private String destination;

    @PostMapping
    @Operation(summary = "Send email")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid email data", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<Void> sendEmail(@RequestBody @Valid EmailDto emailDto) {
        emailService.sendEmail(emailDto, destination);
        return ResponseEntity.ok().build();
    }
}


================================================
File: src/main/java/com/awesome/testing/controller/OrderController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.order.AddressDto;
import com.awesome.testing.dto.order.OrderDto;
import com.awesome.testing.dto.order.PageDto;
import com.awesome.testing.dto.order.OrderStatus;
import com.awesome.testing.security.CustomPrincipal;
import com.awesome.testing.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create a new order from cart")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Order created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or empty cart", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<OrderDto> createOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @Valid @RequestBody AddressDto addressDto) {
        OrderDto order = orderService.createOrder(principal.getUsername(), addressDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    @Operation(summary = "Get user's orders")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<PageDto<OrderDto>> getUserOrders(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(PageDto.from(
                orderService.getUserOrders(principal.getUsername(), status, PageRequest.of(page, size))
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content)
    })
    public ResponseEntity<OrderDto> getOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(principal.getUsername(), id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Update order status (Admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status transition", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content)
    })
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel order")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order cancelled successfully"),
            @ApiResponse(responseCode = "400", description = "Order cannot be cancelled", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content)
    })
    public ResponseEntity<OrderDto> cancelOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, OrderStatus.CANCELLED));
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/ProductController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.product.ProductCreateDto;
import com.awesome.testing.dto.product.ProductDto;
import com.awesome.testing.dto.product.ProductUpdateDto;
import com.awesome.testing.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management endpoints")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Get all products", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved products"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved product"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "404", description = "Product not found", content = @Content)
    })
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Create new product", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Product created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires admin role", content = @Content)
    })
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductCreateDto productCreateDto) {
        ProductDto savedProduct = productService.createProduct(productCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Update existing product", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Product updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires admin role", content = @Content),
        @ApiResponse(responseCode = "404", description = "Product not found", content = @Content)
    })
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateDto productUpdateDto) {
        return productService.updateProduct(id, productUpdateDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Delete product", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Product deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires admin role", content = @Content),
            @ApiResponse(responseCode = "404", description = "Product not found", content = @Content)
    })
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productService.deleteProduct(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/QrController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.qr.CreateQrDto;
import com.awesome.testing.service.QrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/qr")
@Tag(name = "QR", description = "Endpoint for QR code generation")
@RequiredArgsConstructor
public class QrController {

    private final QrService qrService;

    @SneakyThrows
    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.IMAGE_PNG_VALUE)
    @Operation(summary = "Generator QR code", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully generated QR code"),
            @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public byte[] createQrCode(@RequestBody @Validated CreateQrDto createQrDto) {
        BufferedImage qrImage = qrService.generateQrCode(createQrDto.getText());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "png", baos);
        return baos.toByteArray();
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/cart/CartController.java
================================================
package com.awesome.testing.controller.cart;

import com.awesome.testing.dto.cart.CartDto;
import com.awesome.testing.security.CustomPrincipal;
import com.awesome.testing.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management endpoints")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved cart"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<CartDto> getCart(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal) {
        return ResponseEntity.ok(cartService.getCart(principal.toString()));
    }

    @DeleteMapping
    @Operation(summary = "Clear cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Cart cleared successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content)
    })
    public ResponseEntity<Void> clearCart(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal) {
        cartService.clearCart(principal.toString());
        return ResponseEntity.ok().build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/cart/CartItemsController.java
================================================
package com.awesome.testing.controller.cart;

import com.awesome.testing.dto.cart.CartDto;
import com.awesome.testing.dto.cart.CartItemDto;
import com.awesome.testing.dto.cart.UpdateCartItemDto;
import com.awesome.testing.security.CustomPrincipal;
import com.awesome.testing.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management endpoints")
public class CartItemsController {

    private final CartService cartService;

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item added successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "404", description = "Product not found", content = @Content)
    })
    public ResponseEntity<CartDto> addToCart(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @Valid @RequestBody CartItemDto cartItemDto) {
        return ResponseEntity.ok(cartService.addToCart(principal.toString(), cartItemDto));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update item quantity", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item quantity updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input", content = @Content),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "404", description = "Cart item not found", content = @Content)
    })
    public ResponseEntity<CartDto> updateCartItem(
            @Parameter(hidden = true)  @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemDto updateCartItemDto) {
        return ResponseEntity.ok(cartService.updateCartItem(principal.toString(), productId, updateCartItemDto));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item removed successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
        @ApiResponse(responseCode = "404", description = "Cart item not found", content = @Content)
    })
    public ResponseEntity<CartDto> removeFromCart(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeFromCart(principal.toString(), productId));
    }

}

================================================
File: src/main/java/com/awesome/testing/controller/exception/CartExceptionHandler.java
================================================
package com.awesome.testing.controller.exception;

import com.awesome.testing.controller.cart.CartItemsController;
import com.awesome.testing.dto.ErrorDto;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = {
        CartItemsController.class
})
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CartExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorDto handleProductNotFoundException(ProductNotFoundException ex) {
        return new ErrorDto(ex.getMessage());
    }

    @ExceptionHandler(CartItemNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorDto handleCartItemNotFoundException(CartItemNotFoundException ex) {
        return new ErrorDto(ex.getMessage());
    }
}

================================================
File: src/main/java/com/awesome/testing/controller/exception/CartItemNotFoundException.java
================================================
package com.awesome.testing.controller.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class CartItemNotFoundException extends RuntimeException {
    public CartItemNotFoundException(String message) {
        super(message);
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/exception/CustomException.java
================================================
package com.awesome.testing.controller.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
@Getter
public class CustomException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    final String message;
    final HttpStatus httpStatus;

}


================================================
File: src/main/java/com/awesome/testing/controller/exception/GlobalExceptionHandlerController.java
================================================
package com.awesome.testing.controller.exception;

import java.util.Map;
import java.util.HashMap;

import com.awesome.testing.dto.ErrorDto;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.servlet.error.DefaultErrorAttributes;
import org.springframework.web.context.request.WebRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandlerController extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
        Map<String, Object> errorAttributes = super.getErrorAttributes(webRequest, options);
        errorAttributes.remove("trace");
        return errorAttributes;
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorDto> handleCustomException(CustomException ex) {
        return ResponseEntity
                .status(ex.getHttpStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDto(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity
                .badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(errors);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("error", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(errors);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDto> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDto("Access denied"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDto> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDto("Invalid username/password supplied"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorDto> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDto("Unauthorized"));
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/exception/ProductNotFoundException.java
================================================
package com.awesome.testing.controller.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String message) {
        super(message);
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/exception/UserExceptionHandler.java
================================================
package com.awesome.testing.controller.exception;

import com.awesome.testing.controller.users.*;
import com.awesome.testing.dto.ErrorDto;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@RestControllerAdvice(assignableTypes = {
        UserDeleteController.class,
        UserEditController.class,
        UserGetSingleUserController.class,
})
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorDto handleUserNotFoundException(UserNotFoundException ex) {
        return new ErrorDto(ex.getMessage());
    }
}

================================================
File: src/main/java/com/awesome/testing/controller/exception/UserNotFoundException.java
================================================
package com.awesome.testing.controller.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/users/UserDeleteController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserDeleteController {

    private final UserService userService;

    @DeleteMapping(value = "/{username}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Delete user", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "User was deleted"),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden – Insufficient permissions", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Parameter(description = "Username") @PathVariable String username) {
        userService.delete(username);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserEditController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.UserEditDto;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserEditController {

    private final UserService userService;

    @PutMapping("/{username}")
    @PreAuthorize("@userService.exists(#username) and (hasRole('ROLE_ADMIN') or #username == authentication.principal.username)")
    @Operation(summary = "Update user", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User was updated"),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden – Insufficient permissions", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    public UserEntity edit(
            @Parameter(description = "Username") @PathVariable String username,
            @Parameter(description = "User details") @Valid @RequestBody UserEditDto userDto) {
        return userService.edit(username, userDto);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserGetSingleUserController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.UserResponseDto;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserGetSingleUserController {

    private final UserService userService;

    @GetMapping("/{username}")
    @Operation(summary = "Get user by username", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User details",
                    content = @Content(schema = @Schema(implementation = UserResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    public UserResponseDto getByUsername(@Parameter(description = "Username") @PathVariable String username) {
        UserEntity user = userService.search(username);
        return UserResponseDto.from(user);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserGetUsersController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.UserResponseDto;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserGetUsersController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all users", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of users",
                    content = @Content(schema = @Schema(implementation = UserResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content)
    })
    public List<UserResponseDto> getAll() {
        return userService.getAll().stream()
                .map(UserResponseDto::from)
                .toList();
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserMeController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.UserResponseDto;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserMeController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user information", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current user details",
                    content = @Content(schema = @Schema(implementation = UserResponseDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content)
    })
    public UserResponseDto whoAmI(HttpServletRequest req) {
        UserEntity user = userService.whoAmI(req);
        return UserResponseDto.from(user);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserRefreshController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserRefreshController {

    private final UserService userService;

    @GetMapping("/refresh")
    @Operation(summary = "Refresh JWT token", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "New JWT token",
                    content = @Content(schema = @Schema(type = "string", example = "eyJhbGciOiJIUzI1NiJ9..."))),
            @ApiResponse(responseCode = "401", description = "Unauthorized – Missing or invalid token", content = @Content)
    })
    public String refresh(HttpServletRequest req) {
        return userService.refresh(userService.whoAmI(req).getUsername());
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserSignInController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.LoginDto;
import com.awesome.testing.dto.user.LoginResponseDto;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserSignInController {

    private final UserService userService;

    @PostMapping("/signin")
    @Operation(summary = "Authenticate user and return JWT token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully authenticated",
                    content = @Content(schema = @Schema(implementation = LoginResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "Field validation failed", content = @Content),
            @ApiResponse(responseCode = "422", description = "Invalid username/password supplied", content = @Content)
    })
    public LoginResponseDto login(
            @Parameter(description = "Login details") @Valid @RequestBody LoginDto loginDetails) {
        String token = userService.signIn(loginDetails.getUsername(), loginDetails.getPassword());
        UserEntity user = userService.search(loginDetails.getUsername());

        return LoginResponseDto.from(token, user);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/users/UserSignUpController.java
================================================
package com.awesome.testing.controller.users;

import com.awesome.testing.dto.user.UserRegisterDto;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
@Validated
public class UserSignUpController {

    private final UserService userService;

    @PostMapping("/signup")
    @Operation(summary = "Create a new user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User was successfully created"),
            @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
    public void signup(@Parameter(description = "Signup User") @Valid @RequestBody UserRegisterDto userDto) {
        userService.signup(userDto);
    }

}


================================================
File: src/main/java/com/awesome/testing/dto/ErrorDto.java
================================================
package com.awesome.testing.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorDto {

    @Schema(description = "Error message", example = "Error message")
    private String message;

}


================================================
File: src/main/java/com/awesome/testing/dto/cart/CartDto.java
================================================
package com.awesome.testing.dto.cart;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {
    @Schema(description = "Cart owner", example = "admin")

    private String username;

    private List<CartItemDto> items;

    @Schema(description = "Total Cart price", example = "199.56")
    private BigDecimal totalPrice;

    @Schema(description = "Total number of items", example = "7")
    private int totalItems;
} 

================================================
File: src/main/java/com/awesome/testing/dto/cart/CartItemDto.java
================================================
package com.awesome.testing.dto.cart;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {

    @Schema(description = "Product id", example = "13")
    @NotNull
    private Long productId;

    @Schema(description = "Product quantity", example = "1")
    @NotNull
    @Min(1)
    private Integer quantity;

}

================================================
File: src/main/java/com/awesome/testing/dto/cart/UpdateCartItemDto.java
================================================
package com.awesome.testing.dto.cart;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartItemDto {

    @Schema(description = "Product quantity", example = "1")
    @NotNull
    @Min(1)
    private Integer quantity;

}

================================================
File: src/main/java/com/awesome/testing/dto/email/EmailDto.java
================================================
package com.awesome.testing.dto.email;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailDto {

    @Schema(description = "Email recipient", example = "user@example.com")
    @Email(message = "Invalid email format")
    private String to;
    
    @Schema(description = "Email subject", example = "Important message")
    @NotBlank(message = "Email subject is required")
    private String subject;
    
    @Schema(description = "Email content", example = "Please read this message carefully")
    @NotBlank(message = "Email content is required")
    private String message;
}


================================================
File: src/main/java/com/awesome/testing/dto/order/AddressDto.java
================================================
package com.awesome.testing.dto.order;

import com.awesome.testing.entity.AddressEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Address data transfer object")
public class AddressDto {
    @NotBlank(message = "Street is required")
    @Schema(description = "Street address", example = "123 Main St")
    private String street;

    @NotBlank(message = "City is required")
    @Schema(description = "City", example = "New York")
    private String city;

    @NotBlank(message = "State is required")
    @Schema(description = "State", example = "NY")
    private String state;

    @NotBlank(message = "Zip code is required")
    @Pattern(regexp = "^[0-9]{2}(-[0-9]{3})?|[0-9]{5}(-[0-9]{4})?$", message = "Invalid postal/zip code format")
    @Schema(description = "Postal/ZIP code", example = "35-119")
    private String zipCode;

    @NotBlank(message = "Country is required")
    @Schema(description = "Country", example = "Poland")
    private String country;

    public static AddressDto from(AddressEntity address) {
        return AddressDto.builder()
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .zipCode(address.getZipCode())
                .country(address.getCountry())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/dto/order/OrderDto.java
================================================
package com.awesome.testing.dto.order;

import com.awesome.testing.entity.OrderEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Order data transfer object")
public class OrderDto {
    @Schema(description = "Order ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "john.doe")
    private String username;

    @Builder.Default
    @Valid
    @Schema(description = "Order items")
    private List<OrderItemDto> items = new ArrayList<>();

    @Schema(description = "Total amount", example = "1999.98")
    private BigDecimal totalAmount;

    @Schema(description = "Order status", example = "PENDING")
    private OrderStatus status;

    @Valid
    @NotNull(message = "Shipping address is required")
    @Schema(description = "Shipping address")
    private AddressDto shippingAddress;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    public static OrderDto from(OrderEntity order) {
        return OrderDto.builder()
                .id(order.getId())
                .username(order.getUsername())
                .items(order.getItems().stream().map(OrderItemDto::from).toList())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(AddressDto.from(order.getShippingAddress()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/dto/order/OrderItemDto.java
================================================
package com.awesome.testing.dto.order;

import com.awesome.testing.entity.OrderItemEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Order item data transfer object")
public class OrderItemDto {
    @Schema(description = "Order item ID", example = "1")
    private Long id;

    @NotNull(message = "Product ID is required")
    @Schema(description = "Product ID", example = "1")
    private Long productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Schema(description = "Quantity", example = "2")
    private Integer quantity;

    @Schema(description = "Product name", example = "iPhone 13 Pro")
    private String productName;

    @Schema(description = "Unit price", example = "999.99")
    private BigDecimal unitPrice;

    @Schema(description = "Total price", example = "1999.98")
    private BigDecimal totalPrice;

    public static OrderItemDto from(OrderItemEntity item) {
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getPrice())
                .totalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/dto/order/OrderStatus.java
================================================
package com.awesome.testing.dto.order;

public enum OrderStatus {
    PENDING,
    PAID,
    SHIPPED,
    DELIVERED,
    CANCELLED
} 

================================================
File: src/main/java/com/awesome/testing/dto/order/PageDto.java
================================================
package com.awesome.testing.dto.order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageDto<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    public static <T> PageDto<T> from(Page<T> page) {
        return new PageDto<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
} 

================================================
File: src/main/java/com/awesome/testing/dto/product/ProductCreateDto.java
================================================
package com.awesome.testing.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Create product data transfer object")
public class ProductCreateDto {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    @Schema(description = "Product name", example = "iPhone 13")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    @Schema(description = "Product description", example = "Latest iPhone model with A15 Bionic chip")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 digits and 2 decimals")
    @Schema(description = "Product price", example = "999.99")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    @Schema(description = "Available stock quantity", example = "100")
    private Integer stockQuantity;

    @NotBlank(message = "Category is required")
    @Schema(description = "Product category", example = "Electronics")
    private String category;

    @Pattern(regexp = "^(https?://.*|)$", message = "Image URL must be a valid URL or empty")
    @Schema(description = "Product image URL", example = "https://example.com/iphone13.jpg")
    private String imageUrl;

}

================================================
File: src/main/java/com/awesome/testing/dto/product/ProductDto.java
================================================
package com.awesome.testing.dto.product;

import com.awesome.testing.entity.ProductEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String category;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductDto from(ProductEntity productEntity) {
        return ProductDto.builder()
                .id(productEntity.getId())
                .name(productEntity.getName())
                .description(productEntity.getDescription())
                .price(productEntity.getPrice())
                .stockQuantity(productEntity.getStockQuantity())
                .category(productEntity.getCategory())
                .imageUrl(productEntity.getImageUrl())
                .createdAt(productEntity.getCreatedAt())
                .updatedAt(productEntity.getUpdatedAt())
                .build();
    }

} 

================================================
File: src/main/java/com/awesome/testing/dto/product/ProductUpdateDto.java
================================================
package com.awesome.testing.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Update product data transfer object")
public class ProductUpdateDto {

    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    @Schema(description = "Product name", example = "iPhone 13")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    @Schema(description = "Product description", example = "Latest iPhone model with A15 Bionic chip")
    private String description;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 digits and 2 decimals")
    @Schema(description = "Product price", example = "999.99")
    private BigDecimal price;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    @Schema(description = "Available stock quantity", example = "100")
    private Integer stockQuantity;

    @Schema(description = "Product category", example = "Electronics")
    private String category;

    @Pattern(regexp = "^(https?://.*|)$", message = "Image URL must be a valid URL or empty")
    @Schema(description = "Product image URL", example = "https://example.com/iphone13.jpg")
    private String imageUrl;

}

================================================
File: src/main/java/com/awesome/testing/dto/qr/CreateQrDto.java
================================================
package com.awesome.testing.dto.qr;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "QR link")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateQrDto {

    @NotBlank(message = "Text is required")
    @Schema(description = "Text to use in QR code", example = "https://awesome-testing.com")
    private String text;

}


================================================
File: src/main/java/com/awesome/testing/dto/user/LoginDto.java
================================================
package com.awesome.testing.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginDto {

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "admin")
    private String username;

    @Size(min = 4, max = 255, message = "Minimum password length: 4 characters")
    @Schema(description = "Password", example = "admin")
    private String password;

}


================================================
File: src/main/java/com/awesome/testing/dto/user/LoginResponseDto.java
================================================
package com.awesome.testing.dto.user;

import com.awesome.testing.entity.UserEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class LoginResponseDto {

    @Schema(description = "JWT token", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    String token;

    @Schema(description = "Username", example = "johndoe")
    String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    String email;

    @Schema(description = "First name", example = "John")
    String firstName;

    @Schema(description = "Last name", example = "Doe")
    String lastName;

    @Schema(description = "User roles", example = "[\"ROLE_CLIENT\"]")
    List<Role> roles;

    public static LoginResponseDto from(String token, UserEntity user) {
        return LoginResponseDto.builder()
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .token(token)
                .email(user.getEmail())
                .build();
    }

}


================================================
File: src/main/java/com/awesome/testing/dto/user/Role.java
================================================
package com.awesome.testing.dto.user;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ROLE_ADMIN, ROLE_CLIENT;

    public String getAuthority() {
        return name();
    }

}


================================================
File: src/main/java/com/awesome/testing/dto/user/UserEditDto.java
================================================
package com.awesome.testing.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@Builder
public class UserEditDto {

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "johndoe")
    private String username;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Size(min = 4, max = 255, message = "Minimum firstName length: 4 characters")
    @Schema(description = "First name", example = "John")
    private String firstName;

    @Size(min = 4, max = 255, message = "Minimum lastName length: 4 characters")
    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "User roles", example = "[\"ROLE_CLIENT\"]")
    private List<Role> roles;

}


================================================
File: src/main/java/com/awesome/testing/dto/user/UserRegisterDto.java
================================================
package com.awesome.testing.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
public class UserRegisterDto {

    @NotNull(message = "Username is required")
    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "johndoe")
    private String username;

    @NotNull(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @NotNull(message = "Password is required")
    @Size(min = 8, max = 255, message = "Minimum password length: 8 characters")
    @Schema(description = "Password", example = "password123")
    private String password;

    @NotNull(message = "firstName is required")
    @Size(min = 4, max = 255, message = "Minimum firstName length: 4 characters")
    @Schema(description = "First name", example = "John")
    private String firstName;

    @NotNull(message = "lastName is required")
    @Size(min = 4, max = 255, message = "Minimum lastName length: 4 characters")
    @Schema(description = "Last name", example = "Boyd")
    private String lastName;

    @NotEmpty(message = "At least one role must be specified")
    @Schema(description = "User roles", example = "[\"ROLE_CLIENT\"]")
    private List<Role> roles;

}


================================================
File: src/main/java/com/awesome/testing/dto/user/UserResponseDto.java
================================================
package com.awesome.testing.dto.user;

import com.awesome.testing.entity.UserEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    @Schema(description = "User ID", example = "1")
    Integer id;

    @Schema(description = "Username", example = "johndoe")
    String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    String email;

    @Schema(description = "User roles", example = "[\"ROLE_CLIENT\"]")
    List<Role> roles;

    @Schema(description = "First name", example = "John")
    String firstName;

    @Schema(description = "Last name", example = "Boyd")
    String lastName;

    public static UserResponseDto from(UserEntity user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

}


================================================
File: src/main/java/com/awesome/testing/entity/AddressEntity.java
================================================
package com.awesome.testing.entity;

import com.awesome.testing.dto.order.AddressDto;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressEntity {
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    public static AddressEntity from(AddressDto dto) {
        return AddressEntity.builder()
                .street(dto.getStreet())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .country(dto.getCountry())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/entity/CartItemEntity.java
================================================
package com.awesome.testing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "cart_items", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"username", "product_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // price at the time of adding to cart

    @Version
    private Long version; // for optimistic locking
} 

================================================
File: src/main/java/com/awesome/testing/entity/OrderEntity.java
================================================
package com.awesome.testing.entity;

import com.awesome.testing.dto.order.OrderStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItemEntity> items = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Embedded
    private AddressEntity shippingAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void addItem(OrderItemEntity item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItemEntity item) {
        items.remove(item);
        item.setOrder(null);
    }
} 

================================================
File: src/main/java/com/awesome/testing/entity/OrderItemEntity.java
================================================
package com.awesome.testing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // price at the time of order

    public static OrderItemEntity from(CartItemEntity cartItem) {
        return OrderItemEntity.builder()
                .product(cartItem.getProduct())
                .quantity(cartItem.getQuantity())
                .price(cartItem.getPrice())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/entity/ProductEntity.java
================================================
package com.awesome.testing.entity;

import com.awesome.testing.dto.product.ProductCreateDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stockQuantity;

    @Column(nullable = false)
    private String category;

    private String imageUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public static ProductEntity from(ProductCreateDto productCreateDto) {
        return ProductEntity.builder()
                .name(productCreateDto.getName())
                .description(productCreateDto.getDescription())
                .price(productCreateDto.getPrice())
                .stockQuantity(productCreateDto.getStockQuantity())
                .category(productCreateDto.getCategory())
                .imageUrl(productCreateDto.getImageUrl())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/entity/UserEntity.java
================================================
package com.awesome.testing.entity;

import com.awesome.testing.dto.user.Role;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@RequiredArgsConstructor
@Table(name = "app_user")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Column(unique = true, nullable = false)
    @NonNull
    private String username;

    @Column(unique = true, nullable = false)
    @NonNull
    private String email;

    @Size(min = 8, message = "Minimum password length: 8 characters")
    @NonNull
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    List<Role> roles;

    @Size(max = 255)
    @Column(name = "first_name")
    private String firstName;

    @Size(max = 255)
    @Column(name = "last_name")
    private String lastName;

    @JsonIgnore
    public String getPassword() {
        return password;
    }

}


================================================
File: src/main/java/com/awesome/testing/fakedata/SetupData.java
================================================
package com.awesome.testing.fakedata;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Component
@Transactional
@RequiredArgsConstructor
@Profile("!test") // Active in all profiles except test
public class SetupData {

    private final SetupUsers setupUsers;
    private final SetupProducts setupProducts;
    private final SetupOrders setupOrders;

    @Transactional
    public void setupData() {
        setupUsers.createUsers();
        setupProducts.createProducts();
        setupOrders.createOrdersAndCart();
    }

}


================================================
File: src/main/java/com/awesome/testing/fakedata/SetupOrders.java
================================================
package com.awesome.testing.fakedata;

import com.awesome.testing.dto.order.OrderStatus;
import com.awesome.testing.entity.*;
import com.awesome.testing.repository.CartItemRepository;
import com.awesome.testing.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SetupOrders {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final SetupUsers setupUsers;
    private final SetupProducts setupProducts;

    @Transactional
    public void createOrdersAndCart() {
        if (orderRepository.count() > 0) {
            return;
        }

        UserEntity client = setupUsers.getClientUser();
        UserEntity client2 = setupUsers.getClient2User();

        ProductEntity iphone = setupProducts.getIPhone();
        ProductEntity macbook = setupProducts.getMacBook();
        ProductEntity ps5 = setupProducts.getPlayStation();
        ProductEntity watch = setupProducts.getAppleWatch();
        ProductEntity headphones = setupProducts.getSonyHeadphones();

        // Create orders for client1 in different statuses
        createOrder(client, iphone, 1, OrderStatus.DELIVERED, LocalDateTime.now().minusDays(7));
        createOrder(client, macbook, 1, OrderStatus.SHIPPED, LocalDateTime.now().minusDays(2));
        createOrder(client, ps5, 1, OrderStatus.PENDING, LocalDateTime.now().minusHours(2));

        // Create one order for client2
        createOrder(client2, iphone, 1, OrderStatus.PAID, LocalDateTime.now().minusDays(1));

        // Add items to client2's cart
        createCartItem(client2, watch, 1);
        createCartItem(client2, headphones, 2);
    }

    private void createOrder(UserEntity user, ProductEntity product, int quantity, OrderStatus status, LocalDateTime createdAt) {
        BigDecimal totalPrice = product.getPrice().multiply(BigDecimal.valueOf(quantity));
        
        OrderItemEntity orderItem = new OrderItemEntity();
        orderItem.setProduct(product);
        orderItem.setQuantity(quantity);
        orderItem.setPrice(product.getPrice());

        OrderEntity order = new OrderEntity();
        order.setUsername(user.getUsername());
        order.setItems(List.of(orderItem));
        order.setTotalAmount(totalPrice);
        order.setStatus(status);
        order.setShippingAddress(createAddress());
        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);

        orderItem.setOrder(order);
        orderRepository.save(order);
    }

    private void createCartItem(UserEntity user, ProductEntity product, int quantity) {
        CartItemEntity cartItem = new CartItemEntity();
        cartItem.setUsername(user.getUsername());
        cartItem.setProduct(product);
        cartItem.setQuantity(quantity);
        cartItem.setPrice(product.getPrice());
        cartItem.setVersion(0L);

        cartItemRepository.save(cartItem);
    }

    private AddressEntity createAddress() {
        return AddressEntity.builder()
                .street("123 Main St")
                .city("New York")
                .state("NY")
                .zipCode("10001")
                .country("USA")
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/fakedata/SetupProducts.java
================================================
package com.awesome.testing.fakedata;

import com.awesome.testing.entity.ProductEntity;
import com.awesome.testing.repository.ProductRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class SetupProducts {

    private final ProductRepository productRepository;

    @Getter private ProductEntity iPhone;
    @Getter private ProductEntity galaxyS21;
    @Getter private ProductEntity macBook;
    @Getter private ProductEntity playStation;
    @Getter private ProductEntity ninjaFoodi;
    @Getter private ProductEntity cleanCode;
    @Getter private ProductEntity appleWatch;
    @Getter private ProductEntity sonyHeadphones;

    @Transactional
    public void createProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        // Electronics
        iPhone = createProduct(
            "iPhone 13 Pro",
            "Latest iPhone model with A15 Bionic chip, Pro camera system, and Super Retina XDR display",
            new BigDecimal("999.99"),
            50,
            "Electronics",
            "https://example.com/iphone13pro.jpg"
        );

        galaxyS21 = createProduct(
            "Samsung Galaxy S21",
            "5G smartphone with 8K video, all-day battery, and powerful performance",
            new BigDecimal("799.99"),
            75,
            "Electronics",
            "https://example.com/galaxys21.jpg"
        );

        // Computers
        macBook = createProduct(
            "MacBook Pro 14\"",
            "Apple M1 Pro chip, 16GB RAM, 512GB SSD, Liquid Retina XDR display",
            new BigDecimal("1999.99"),
            25,
            "Computers",
            "https://example.com/macbookpro.jpg"
        );

        // Gaming
        playStation = createProduct(
            "PlayStation 5",
            "Next-gen gaming console with 4K graphics, ray tracing, and ultra-high speed SSD",
            new BigDecimal("499.99"),
            30,
            "Gaming",
            "https://example.com/ps5.jpg"
        );

        // Home & Kitchen
        ninjaFoodi = createProduct(
            "Ninja Foodi 9-in-1",
            "Deluxe XL pressure cooker and air fryer with multiple cooking functions",
            new BigDecimal("249.99"),
            100,
            "Home & Kitchen",
            "https://example.com/ninjafoodi.jpg"
        );

        // Books
        cleanCode = createProduct(
            "Clean Code",
            "A Handbook of Agile Software Craftsmanship by Robert C. Martin",
            new BigDecimal("44.99"),
            200,
            "Books",
            "https://example.com/cleancode.jpg"
        );

        // Wearables
        appleWatch = createProduct(
            "Apple Watch Series 7",
            "Always-On Retina display, health monitoring, and fitness tracking",
            new BigDecimal("399.99"),
            60,
            "Wearables",
            "https://example.com/applewatch.jpg"
        );

        // Audio
        sonyHeadphones = createProduct(
            "Sony WH-1000XM4",
            "Industry-leading noise canceling wireless headphones with exceptional sound",
            new BigDecimal("349.99"),
            85,
            "Audio",
            "https://example.com/sonywh1000xm4.jpg"
        );
    }

    private ProductEntity createProduct(String name, String description, BigDecimal price, int quantity, String category, String imageUrl) {
        ProductEntity product = ProductEntity.builder()
            .name(name)
            .description(description)
            .price(price)
            .stockQuantity(quantity)
            .category(category)
            .imageUrl(imageUrl)
            .build();
        return productRepository.save(product);
    }
} 

================================================
File: src/main/java/com/awesome/testing/fakedata/SetupUsers.java
================================================
package com.awesome.testing.fakedata;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.awesome.testing.dto.user.Role;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.repository.UserRepository;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Component
@Transactional
@RequiredArgsConstructor
public class SetupUsers {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Getter private UserEntity adminUser;
    @Getter private UserEntity admin2User;
    @Getter private UserEntity clientUser;
    @Getter private UserEntity client2User;
    @Getter private UserEntity client3User;

    @Transactional
    public void createUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        adminUser = createAdminUser(
                "admin",
                "admin",
                "awesome@testing.com",
                "Slawomir",
                "Radzyminski"
        );
        userRepository.save(adminUser);

        admin2User = createAdminUser(
                "admin2",
                "admin2",
                "john.doe@company.com",
                "John",
                "Doe"
        );
        userRepository.save(admin2User);

        clientUser = createClientUser(
                "client",
                "client",
                "alice.smith@yahoo.com",
                "Alice",
                "Smith"
        );
        userRepository.save(clientUser);

        client2User = createClientUser(
                "client2",
                "client2",
                "bob.johnson@google.com",
                "Bob",
                "Johnson"
        );
        userRepository.save(client2User);

        client3User = createClientUser(
                "client3",
                "client3",
                "charlie.brown@example.com",
                "Charlie",
                "Brown"
        );
        userRepository.save(client3User);
    }

    private UserEntity createAdminUser(String username, String password, String email, String firstName, String lastName) {
        UserEntity admin = new UserEntity();
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setEmail(email);
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setRoles(List.of(Role.ROLE_ADMIN));
        return admin;
    }

    private UserEntity createClientUser(String username, String password, String email, String firstName, String lastName) {
        UserEntity client = new UserEntity();
        client.setUsername(username);
        client.setPassword(passwordEncoder.encode(password));
        client.setEmail(email);
        client.setFirstName(firstName);
        client.setLastName(lastName);
        client.setRoles(List.of(Role.ROLE_CLIENT));
        return client;
    }
}

================================================
File: src/main/java/com/awesome/testing/jms/EmailConfig.java
================================================
package com.awesome.testing.jms;

import jakarta.jms.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.support.converter.MappingJackson2MessageConverter;
import org.springframework.jms.support.converter.MessageConverter;
import org.springframework.jms.support.converter.MessageType;
import org.springframework.jms.annotation.EnableJms;

@SuppressWarnings("unused")
@Configuration
@EnableJms
@Profile("!local")
public class EmailConfig {

    @Bean
    public JmsTemplate jmsTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        JmsTemplate jmsTemplate = new JmsTemplate(connectionFactory);
        jmsTemplate.setMessageConverter(messageConverter);
        jmsTemplate.setSessionTransacted(true);
        return jmsTemplate;
    }

    @Bean
    public MappingJackson2MessageConverter jacksonJmsMessageConverter() {
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setTargetType(MessageType.TEXT);
        converter.setTypeIdPropertyName("_awesome_");
        return converter;
    }

}


================================================
File: src/main/java/com/awesome/testing/qr/QrGenerator.java
================================================
package com.awesome.testing.qr;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
@Component
public class QrGenerator {

    @SneakyThrows
    public static BufferedImage generateQRCodeImage(String barcodeText) {
        QRCodeWriter barcodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix =
                barcodeWriter.encode(barcodeText, BarcodeFormat.QR_CODE, 400, 400);

        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }

    @SneakyThrows
    public static void saveImage(BufferedImage bufferedImage, File qrCodeFile) {
        ImageIO.write(bufferedImage, "png", qrCodeFile);
    }

    @SneakyThrows
    public static String readQRCode(File file) {
        BinaryBitmap binaryBitmap = new BinaryBitmap(new HybridBinarizer(
                new BufferedImageLuminanceSource(ImageIO.read(file))));
        return new MultiFormatReader().decode(binaryBitmap).getText();
    }

}


================================================
File: src/main/java/com/awesome/testing/repository/CartItemRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.entity.CartItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    @Query("SELECT ci FROM CartItemEntity ci JOIN FETCH ci.product WHERE ci.username = :username")
    List<CartItemEntity> findByUsername(@Param("username") String username);

    @Query("SELECT ci FROM CartItemEntity ci JOIN FETCH ci.product WHERE ci.username = :username AND ci.product.id = :productId")
    Optional<CartItemEntity> findByUsernameAndProductId(@Param("username") String username, @Param("productId") Long productId);

    void deleteByUsername(String username);

    void deleteByUsernameAndProductId(String username, Long productId);
} 

================================================
File: src/main/java/com/awesome/testing/repository/OrderRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.entity.OrderEntity;
import com.awesome.testing.dto.order.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.items WHERE o.username = :username")
    Page<OrderEntity> findByUsername(@Param("username") String username, Pageable pageable);

    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.items WHERE o.username = :username AND o.status = :status")
    Page<OrderEntity> findByUsernameAndStatus(@Param("username") String username, @Param("status") OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.items WHERE o.id = :id AND o.username = :username")
    Optional<OrderEntity> findByIdAndUsername(@Param("id") Long id, @Param("username") String username);
} 

================================================
File: src/main/java/com/awesome/testing/repository/ProductRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository extends JpaRepository<ProductEntity, Long>, JpaSpecificationExecutor<ProductEntity> {
    // JpaSpecificationExecutor allows for dynamic querying (filtering by category, price range, etc.)
} 

================================================
File: src/main/java/com/awesome/testing/repository/UserRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.transaction.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {

    Optional<UserEntity> findByUsername(String username);

    @Transactional
    void deleteByUsername(String username);

}


================================================
File: src/main/java/com/awesome/testing/security/AuthenticationHandler.java
================================================
package com.awesome.testing.security;

import com.awesome.testing.controller.exception.CustomException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class AuthenticationHandler {

    private final AuthenticationManager authenticationManager;

    public void authUser(String username, String password) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException e) {
            throw new CustomException("Invalid username/password supplied", HttpStatus.UNPROCESSABLE_ENTITY);
        } catch (AuthenticationException e) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }
    }

}


================================================
File: src/main/java/com/awesome/testing/security/CustomPrincipal.java
================================================
package com.awesome.testing.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
@AllArgsConstructor
public class CustomPrincipal {
    private final String username;
    private final UserDetails userDetails;

    @Override
    public String toString() {
        return username;
    }
} 

================================================
File: src/main/java/com/awesome/testing/security/JwtTokenFilter.java
================================================
package com.awesome.testing.security;

import com.awesome.testing.controller.exception.CustomException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import static com.awesome.testing.utils.ErrorResponseDefinition.sendErrorResponse;

@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws IOException {
        String token = jwtTokenProvider.extractTokenFromRequest(request);
        try {
            if (token == null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtTokenProvider.validateToken(token)) {
                Authentication auth = jwtTokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(auth);
                filterChain.doFilter(request, response);
                return;
            }
            SecurityContextHolder.clearContext();
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Invalid or expired token");

        } catch (CustomException ex) {
            SecurityContextHolder.clearContext();
            sendErrorResponse(response, ex.getHttpStatus(), ex.getMessage());

        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            sendErrorResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }

}


================================================
File: src/main/java/com/awesome/testing/security/JwtTokenProvider.java
================================================
package com.awesome.testing.security;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

import com.awesome.testing.controller.exception.CustomException;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import com.awesome.testing.dto.user.Role;

import javax.crypto.SecretKey;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${security.jwt.token.secret-key:secret-key}")
    private String secretKey;

    @Value("${security.jwt.token.expire-length:3600000}")
    private long validityInMilliseconds; // 1h

    private final MyUserDetails myUserDetails;
    private SecretKey key;

    @SuppressWarnings("unused")
    @PostConstruct
    protected void init() {
        String longSecretKey = secretKey + secretKey + secretKey + secretKey; // Repeat 4 times to ensure length
        key = Keys.hmacShaKeyFor(longSecretKey.getBytes());
    }

    public String createToken(String username, List<Role> roles) {
        Claims claims = Jwts.claims()
                .subject(username)
                .add("auth", getRoles(roles))
                .build();

        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        return Jwts.builder()
                .claims(claims)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public Authentication getAuthentication(String token) {
        String username = getUsername(token);
        UserDetails userDetails = myUserDetails.loadUserByUsername(username);
        CustomPrincipal principal = new CustomPrincipal(username, userDetails);
        return new UsernamePasswordAuthenticationToken(principal, "", userDetails.getAuthorities());
    }

    public String getUsername(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String extractTokenFromRequest(HttpServletRequest req) {
        return Optional.ofNullable(req.getHeader("Authorization"))
                .filter(token -> token.startsWith("Bearer "))
                .map(token -> token.substring(7))
                .orElse(null);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            throw new CustomException("Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }

    private List<SimpleGrantedAuthority> getRoles(List<Role> roles) {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.getAuthority()))
                .toList();
    }
}


================================================
File: src/main/java/com/awesome/testing/security/MyUserDetails.java
================================================
package com.awesome.testing.security;

import com.awesome.testing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.awesome.testing.entity.UserEntity;

import java.text.MessageFormat;

import static org.springframework.security.core.userdetails.User.*;

@Service
@RequiredArgsConstructor
public class MyUserDetails implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .map(user -> toUserDetails(username, user))
                .orElseThrow(() -> notFound(username));
    }

    private UserDetails toUserDetails(String username, UserEntity user) {
        return withUsername(username)
                .password(user.getPassword())
                .authorities(user.getRoles())
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

    private UsernameNotFoundException notFound(String username) {
        return new UsernameNotFoundException(
                MessageFormat.format("User ''{0}'' not found", username));
    }

}


================================================
File: src/main/java/com/awesome/testing/security/WebSecurityConfig.java
================================================
package com.awesome.testing.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

import static com.awesome.testing.utils.ErrorResponseDefinition.sendErrorResponse;

@SuppressWarnings("unused")
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

    private static final List<String> ALLOWED_ENDPOINTS = List.of(
            "/users/signin",
            "/users/signup",
            "/h2-console/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-resources/**",
            "/webjars/**",
            "/actuator/**"
    );

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Disable CSRF as we use JWT
        http.csrf(AbstractHttpConfigurer::disable);

        // Enable CORS
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // No session will be created or used by Spring Security
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Define authorization rules
        http.authorizeHttpRequests(auth -> {
            ALLOWED_ENDPOINTS.forEach(endpoint -> auth.requestMatchers(new AntPathRequestMatcher(endpoint)).permitAll());
            auth.anyRequest().authenticated();
        });

        // Handle authentication and authorization errors
        http.exceptionHandling(ex -> ex
                .accessDeniedHandler(this::handleAccessDenied)
                .authenticationEntryPoint(this::handleUnauthorized)
        );

        // Apply JWT security filter
        http.addFilterBefore(new JwtTokenFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void handleAccessDenied(HttpServletRequest request,
                                    HttpServletResponse response,
                                    AccessDeniedException ex) throws IOException {
        sendErrorResponse(response, HttpStatus.FORBIDDEN, "Access denied");
    }

    private void handleUnauthorized(HttpServletRequest request,
                                    HttpServletResponse response,
                                    AuthenticationException ex) throws IOException {
        sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:8081"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}


================================================
File: src/main/java/com/awesome/testing/service/CartService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.controller.exception.CartItemNotFoundException;
import com.awesome.testing.controller.exception.ProductNotFoundException;
import com.awesome.testing.dto.cart.CartDto;
import com.awesome.testing.dto.cart.CartItemDto;
import com.awesome.testing.dto.cart.UpdateCartItemDto;
import com.awesome.testing.entity.CartItemEntity;
import com.awesome.testing.entity.ProductEntity;
import com.awesome.testing.repository.CartItemRepository;
import com.awesome.testing.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public CartDto getCart(String username) {
        return getCartDto(username);
    }

    @Transactional
    public CartDto addToCart(String username, CartItemDto cartItemDto) {
        ProductEntity product = productRepository.findById(cartItemDto.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Product not found"));

        CartItemEntity cartItem = cartItemRepository.findByUsernameAndProductId(username, cartItemDto.getProductId())
                .map(existingItem -> updateItem(cartItemDto, existingItem, product))
                .orElseGet(() -> createItem(username, cartItemDto, product));

        cartItemRepository.save(cartItem);
        return getCartDto(username);
    }

    @Transactional
    public CartDto updateCartItem(String username, Long productId, UpdateCartItemDto updateCartItemDto) {
        CartItemEntity cartItem = getCartItemEntity(username, productId);

        cartItem.setQuantity(updateCartItemDto.getQuantity());
        cartItem.setPrice(cartItem.getProduct().getPrice());
        cartItemRepository.save(cartItem);

        return getCartDto(username);
    }

    @Transactional
    public CartDto removeFromCart(String username, Long productId) {
        getCartItemEntity(username, productId);

        cartItemRepository.deleteByUsernameAndProductId(username, productId);
        return getCartDto(username);
    }

    @Transactional
    public void clearCart(String username) {
        cartItemRepository.deleteByUsername(username);
    }

    private CartDto getCartDto(String username) {
        List<CartItemEntity> cartItems = cartItemRepository.findByUsername(username);
        return createCartDto(username, cartItems);
    }

    private CartItemEntity getCartItemEntity(String username, Long productId) {
        return cartItemRepository.findByUsernameAndProductId(username, productId)
                .orElseThrow(() -> new CartItemNotFoundException("Cart item not found"));
    }

    private CartDto createCartDto(String username, List<CartItemEntity> cartItems) {
        return CartDto.builder()
                .username(username)
                .items(getItems(cartItems))
                .totalPrice(calculateTotalPrice(cartItems))
                .totalItems(calculateTotalItems(cartItems))
                .build();
    }

    private CartItemEntity createItem(String username, CartItemDto cartItemDto, ProductEntity product) {
        return CartItemEntity.builder()
                .username(username)
                .product(product)
                .quantity(cartItemDto.getQuantity())
                .price(product.getPrice())
                .version(0L)
                .build();
    }

    private CartItemEntity updateItem(CartItemDto cartItemDto, CartItemEntity existingItem, ProductEntity product) {
        existingItem.setQuantity(existingItem.getQuantity() + cartItemDto.getQuantity());
        existingItem.setPrice(product.getPrice());
        return existingItem;
    }

    private List<CartItemDto> getItems(List<CartItemEntity> cartItems) {
        return cartItems.stream()
                .map(this::convertToCartItemDto)
                .toList();
    }

    private CartItemDto convertToCartItemDto(CartItemEntity item) {
        return CartItemDto.builder()
                .productId(item.getProduct().getId())
                .quantity(item.getQuantity())
                .build();
    }

    private int calculateTotalItems(List<CartItemEntity> cartItems) {
        return cartItems.stream()
                .mapToInt(CartItemEntity::getQuantity)
                .sum();
    }

    private BigDecimal calculateTotalPrice(List<CartItemEntity> cartItems) {
        return cartItems.stream()
                .map(this::multiplyByQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal multiplyByQuantity(CartItemEntity item) {
        return item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }
} 

================================================
File: src/main/java/com/awesome/testing/service/EmailService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.email.EmailDto;
import com.awesome.testing.service.delay.DelayGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JmsTemplate jmsTemplate;
    private final DelayGenerator delayGenerator;

    public void sendEmail(EmailDto emailDto, String destination) {
        Thread.ofVirtual().start(() -> {
            try {
                long delay = delayGenerator.getDelayMillis();
                logDelay(delay);
                Thread.sleep(delay);
                jmsTemplate.convertAndSend(destination, emailDto);
                log.info("Email sent to {}", emailDto.getTo());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Email sending was interrupted", e);
            }
        });
    }

    private void logDelay(long delay) {
        long minutes = delay / 60000;
        long seconds = (delay % 60000) / 1000;
        log.info("Delaying email send by {} minutes and {} seconds", minutes, seconds);
    }
}

================================================
File: src/main/java/com/awesome/testing/service/OrderService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.order.AddressDto;
import com.awesome.testing.dto.order.OrderDto;
import com.awesome.testing.controller.exception.CustomException;
import com.awesome.testing.dto.order.OrderStatus;
import com.awesome.testing.entity.*;
import com.awesome.testing.repository.CartItemRepository;
import com.awesome.testing.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional
    public OrderDto createOrder(String username, AddressDto addressDto) {
        List<CartItemEntity> cartItems = cartItemRepository.findByUsername(username);
        if (cartItems.isEmpty()) {
            throw new CustomException("Cart is empty", HttpStatus.BAD_REQUEST);
        }

        OrderEntity order = getInitialEmptyOrder(username, addressDto);
        cartItems.forEach(cartItem -> updateOrder(cartItem, order));
        OrderEntity savedOrder = orderRepository.save(order);
        cartItemRepository.deleteByUsername(username);

        return OrderDto.from(savedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getUserOrders(String username, OrderStatus status, Pageable pageable) {
        Page<OrderEntity> orders = status == null ?
                orderRepository.findByUsername(username, pageable) :
                orderRepository.findByUsernameAndStatus(username, status, pageable);
        return orders.map(OrderDto::from);
    }

    @Transactional(readOnly = true)
    public OrderDto getOrder(String username, Long orderId) {
        return orderRepository.findByIdAndUsername(orderId, username)
                .map(OrderDto::from)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));

        if (newStatus == OrderStatus.CANCELLED && !canBeCancelled(order.getStatus())) {
            throw new CustomException("Order cannot be cancelled in current status", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(newStatus);
        return OrderDto.from(orderRepository.save(order));
    }

    private OrderEntity getInitialEmptyOrder(String username, AddressDto addressDto) {
        return OrderEntity.builder()
                .username(username)
                .status(OrderStatus.PENDING)
                .shippingAddress(AddressEntity.from(addressDto))
                .totalAmount(BigDecimal.ZERO)
                .build();
    }

    private void updateOrder(CartItemEntity cartItem, OrderEntity order) {
        OrderItemEntity orderItem = OrderItemEntity.from(cartItem);
        order.addItem(orderItem);
        order.setTotalAmount(order.getTotalAmount().add(
                cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
        ));
    }

    private boolean canBeCancelled(OrderStatus status) {
        return status == OrderStatus.PENDING || status == OrderStatus.PAID;
    }

}

================================================
File: src/main/java/com/awesome/testing/service/ProductService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.product.ProductCreateDto;
import com.awesome.testing.dto.product.ProductDto;
import com.awesome.testing.dto.product.ProductUpdateDto;
import com.awesome.testing.entity.ProductEntity;
import com.awesome.testing.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static com.awesome.testing.utils.EntityUpdater.updateIfNotNull;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(ProductDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<ProductDto> getProductById(Long id) {
        return productRepository.findById(id)
                .map(ProductDto::from);
    }

    @Transactional
    public ProductDto createProduct(ProductCreateDto productCreateDto) {
        ProductEntity product = ProductEntity.from(productCreateDto);
        productRepository.save(product);
        return ProductDto.from(product);
    }

    @Transactional
    public Optional<ProductDto> updateProduct(Long id, ProductUpdateDto productUpdateDto) {
        return productRepository.findById(id)
                .map(product -> {
                    toUpdatedProduct(productUpdateDto, product);
                    productRepository.save(product);
                    return ProductDto.from(product);
                });
    }

    @Transactional
    public boolean deleteProduct(Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    productRepository.delete(product);
                    return true;
                })
                .orElse(false);
    }

    private void toUpdatedProduct(ProductUpdateDto productUpdateDto, ProductEntity product) {
        updateIfNotNull(productUpdateDto.getName(), ProductEntity::setName, product);
        updateIfNotNull(productUpdateDto.getDescription(), ProductEntity::setDescription, product);
        updateIfNotNull(productUpdateDto.getPrice(), ProductEntity::setPrice, product);
        updateIfNotNull(productUpdateDto.getStockQuantity(), ProductEntity::setStockQuantity, product);
        updateIfNotNull(productUpdateDto.getCategory(), ProductEntity::setCategory, product);
        updateIfNotNull(productUpdateDto.getImageUrl(), ProductEntity::setImageUrl, product);
    }

}

================================================
File: src/main/java/com/awesome/testing/service/QrService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.qr.QrGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;

@Service
@RequiredArgsConstructor
public class QrService {

    public BufferedImage generateQrCode(String text) {
        return QrGenerator.generateQRCodeImage(text);
    }
}


================================================
File: src/main/java/com/awesome/testing/service/UserService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.user.UserEditDto;
import com.awesome.testing.dto.user.UserRegisterDto;
import com.awesome.testing.controller.exception.CustomException;
import com.awesome.testing.controller.exception.UserNotFoundException;
import com.awesome.testing.security.AuthenticationHandler;
import jakarta.servlet.http.HttpServletRequest;
import com.awesome.testing.entity.UserEntity;
import com.awesome.testing.repository.UserRepository;
import com.awesome.testing.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.awesome.testing.utils.EntityUpdater.updateIfNotNull;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationHandler authenticationHandler;

    public String signIn(String username, String password) {
        authenticationHandler.authUser(username, password);
        UserEntity user = getUser(username);
        return jwtTokenProvider.createToken(username, user.getRoles());
    }

    @Transactional
    public void signup(UserRegisterDto userRegisterDto) {
        userRepository.findByUsername(userRegisterDto.getUsername())
                .ifPresentOrElse(
                        it -> returnBadRequest(),
                        () -> userRepository.save(getUser(userRegisterDto))
                );
    }

    public void delete(String username) {
        getUser(username);
        userRepository.deleteByUsername(username);
    }

    public UserEntity search(String username) {
        return getUser(username);
    }

    public UserEntity whoAmI(HttpServletRequest req) {
        String username = jwtTokenProvider.getUsername(jwtTokenProvider.extractTokenFromRequest(req));
        return getUser(username);
    }

    public String refresh(String username) {
        UserEntity user = getUser(username);
        return jwtTokenProvider.createToken(username, user.getRoles());
    }

    public List<UserEntity> getAll() {
        return userRepository.findAll();
    }

    public UserEntity edit(String username, UserEditDto userDto) {
        UserEntity existingUser = getUser(username);

        updateIfNotNull(userDto.getEmail(), UserEntity::setEmail, existingUser);
        updateIfNotNull(userDto.getFirstName(), UserEntity::setFirstName, existingUser);
        updateIfNotNull(userDto.getLastName(), UserEntity::setLastName, existingUser);
        updateIfNotNull(userDto.getRoles(), UserEntity::setRoles, existingUser);

        return userRepository.save(existingUser);
    }

    @SuppressWarnings("unused")
    public boolean exists(String username) {
        getUser(username);
        return true;
    }

    private UserEntity getUser(UserRegisterDto userRegisterDto) {
        UserEntity user = new UserEntity();
        user.setUsername(userRegisterDto.getUsername());
        user.setFirstName(userRegisterDto.getFirstName());
        user.setLastName(userRegisterDto.getLastName());
        user.setRoles(userRegisterDto.getRoles());
        user.setEmail(userRegisterDto.getEmail());
        user.setPassword(passwordEncoder.encode(userRegisterDto.getPassword()));
        return user;
    }

    private void returnBadRequest() {
        throw new CustomException("Username is already in use", HttpStatus.BAD_REQUEST);
    }

    private UserEntity getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("The user doesn't exist"));
    }

}


================================================
File: src/main/java/com/awesome/testing/service/delay/DelayGenerator.java
================================================
package com.awesome.testing.service.delay;

public interface DelayGenerator {
    long getDelayMillis();
} 

================================================
File: src/main/java/com/awesome/testing/service/delay/RandomDelayGenerator.java
================================================
package com.awesome.testing.service.delay;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Component
@Profile("!test")
public class RandomDelayGenerator implements DelayGenerator {
    private static final long MIN_DELAY = TimeUnit.SECONDS.toMillis(10);
    private static final long MAX_DELAY = TimeUnit.MINUTES.toMillis(10);
    private final Random random = new Random();

    @Override
    public long getDelayMillis() {
        return MIN_DELAY + (long) (random.nextDouble() * (MAX_DELAY - MIN_DELAY));
    }
} 

================================================
File: src/main/java/com/awesome/testing/utils/EntityUpdater.java
================================================
package com.awesome.testing.utils;

import lombok.experimental.UtilityClass;

import java.util.function.BiConsumer;

@UtilityClass
public class EntityUpdater {

    public static <T, V> void updateIfNotNull(V value, BiConsumer<T, V> setter, T entity) {
        if (value != null) {
            setter.accept(entity, value);
        }
    }

}


================================================
File: src/main/java/com/awesome/testing/utils/ErrorResponseDefinition.java
================================================
package com.awesome.testing.utils;

import jakarta.servlet.http.HttpServletResponse;
import lombok.experimental.UtilityClass;
import org.springframework.http.HttpStatus;

import java.io.IOException;

@UtilityClass
public class ErrorResponseDefinition {

    public static void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(status.value());
        response.getWriter().write("""
            {
                "message": "%s"
            }
            """.formatted(message));
    }

}


================================================
File: src/main/resources/application-docker.yml
================================================
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/testdb
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        id:
          new_generator_mappings: false
  artemis:
    mode: native
    broker-url: tcp://activemq:61616
    user: admin
    password: admin
    pool:
      enabled: true
      max-connections: 10
    packages:
      trust-all: true
  jackson:
    serialization:
      indent-output: true

activemq:
  destination: email

server:
  port: 4001
  error:
    include-message: always
    include-binding-errors: always

security:
  jwt:
    token:
      secret-key: secret-key
      expire-length: 300000

management:
  endpoints:
    web:
      exposure:
        include: "*"

logging:
  level:
    root: INFO
    org.zalando.logbook: TRACE
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n" 

================================================
File: src/main/resources/application-local.yml
================================================
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    username: sa
    password: sa
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
        format_sql: true
        id:
          new_generator_mappings: false
  h2:
    console:
      enabled: true
      path: /h2-console
  artemis:
    mode: embedded
    embedded:
      enabled: true
      queues: email
      persistent: false
    broker-url: vm://0
    user: admin
    password: admin
  jms:
    pub-sub-domain: false
    template:
      default-destination: email
      receive-timeout: 2000
  jackson:
    serialization:
      indent-output: true

activemq:
  destination: email

server:
  port: 4001
  error:
    include-message: always
    include-binding-errors: always

security:
  jwt:
    token:
      secret-key: secret-key
      expire-length: 300000

management:
  endpoints:
    web:
      exposure:
        include: "*"

logging:
  level:
    root: INFO
    org.zalando.logbook: TRACE
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n" 

================================================
File: src/main/resources/application.yml
================================================
spring:
  profiles:
    active: docker
  main:
    allow-bean-definition-overriding: true

server:
  servlet:
    encoding:
      charset: UTF-8
      enabled: true
      force: true

logbook:
  include: "/**"
  exclude: 
    - "/swagger-ui/**"
    - "/v3/api-docs"
    - "/v3/api-docs/**"
    - "/actuator/**"
    - "/favicon.ico"
  format:
    style: json
  write:
    chunk-size: 1000
  filter.enabled: true
  obfuscate:
    headers:
      - x-secret
      - cookie

UserController:
  signin: Authenticates user and returns its JWT token.
  signup: Creates user and returns its JWT token
  delete: Deletes specific user by username
  search: Returns specific user by username
  me: Returns current user's data
  refresh: Refreshes token for logged in user
  getAll: Get all users
  edit: Edits user details

JmsSender:
  sendEmail: Sending email to Active MQ
