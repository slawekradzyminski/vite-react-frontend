================================================
File: README.md
================================================
# Secure Backend API with E-commerce Features

A secure backend API built with Spring Boot that provides user authentication, authorization, email functionality, and e-commerce features.

## Features

- User authentication with JWT tokens
- Role-based authorization (ADMIN and CLIENT roles)
- User management (signup, signin, edit, delete)
- Email sending functionality via ActiveMQ
- Product management
- Shopping cart functionality
- Order management
- Swagger/OpenAPI documentation
- Comprehensive test coverage

## Technologies

- Java 17
- Spring Boot 3.x
- Spring Security with JWT
- Spring Data JPA
- ActiveMQ for email queue
- H2 Database (for development)
- JUnit 5 for testing
- Swagger/OpenAPI for documentation

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.x
- ActiveMQ (for email functionality)

### Running the Application

1. Clone the repository
2. Configure ActiveMQ connection in `application.yml`
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

The application will start on `http://localhost:8080`

### Running Tests

```bash
mvn test
```

## API Documentation

Once the application is running, you can access the Swagger UI at:
`http://localhost:4001/swagger-ui/index.html`

## API Endpoints

### Authentication
- POST `/users/signin` - Authenticate user and get JWT token
- POST `/users/signup` - Register a new user
- GET `/users/refresh` - Refresh JWT token

### User Management
- GET `/users/me` - Get current user information
- GET `/users` - Get all users (ADMIN only)
- GET `/users/{username}` - Get user by username
- PUT `/users/{username}` - Update user
- DELETE `/users/{username}` - Delete user (ADMIN only)

### Products
- GET `/api/products` - Get all products (authenticated)
- GET `/api/products/{id}` - Get product by ID (authenticated)
- POST `/api/products` - Create new product (ADMIN only)
- PUT `/api/products/{id}` - Update product (ADMIN only)
- DELETE `/api/products/{id}` - Delete product (ADMIN only)

### Shopping Cart
- GET `/api/cart` - Get current user's cart
- POST `/api/cart/items` - Add item to cart
- PUT `/api/cart/items/{productId}` - Update item quantity
- DELETE `/api/cart/items/{productId}` - Remove item from cart
- DELETE `/api/cart` - Clear cart

### Orders
- POST `/api/orders` - Create a new order
- GET `/api/orders` - Get user's orders
- GET `/api/orders/{id}` - Get order by ID
- PUT `/api/orders/{id}/status` - Update order status (ADMIN only)
- POST `/api/orders/{id}/cancel` - Cancel order

### Email
- POST `/email` - Send an email (authenticated users only)

## Security

- JWT tokens for authentication
- Password encryption using BCrypt
- Role-based access control
- Cross-Origin Resource Sharing (CORS) configured for localhost:8081

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

## Development

### Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/awesome/testing/
│   │       ├── controller/    # REST controllers
│   │       ├── dto/          # Data Transfer Objects
│   │       ├── model/        # Domain models
│   │       ├── repository/   # Data access layer
│   │       ├── security/     # Security configuration
│   │       └── service/      # Business logic
│   └── resources/
│       └── application.yml   # Application configuration
└── test/
    └── java/
        └── com/awesome/testing/
            └── endpoints/     # Integration tests
```

### AI Debugging Tips

When working with AI assistants, keep in mind:

1. Test failures may be caused by recent changes since git HEAD is kept stable. To see the changes use:
   ```bash
   git --no-pager diff
   ```

2. To run a single test and save the output to the testlogs folder, use JUnit notation:
   ```bash
   mvn test -Dtest=TestClassName#testMethodName > ./testlogs/test-output.log
   ```
   This helps in analyzing test failures by providing detailed logs.

3. The test logs can be read and analyzed by AI to help diagnose issues.

4. When making changes, always verify that all tests pass using:
   ```bash
   mvn test
   ```


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
        <version>3.4.1</version>
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
            <groupId>org.zalando</groupId>
            <artifactId>logbook-spring-boot-starter</artifactId>
            <version>3.7.2</version>
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
            <version>2.8.1</version>
        </dependency>

        <!-- H2 Database -->
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- ModelMapper -->
        <dependency>
            <groupId>org.modelmapper</groupId>
            <artifactId>modelmapper</artifactId>
            <version>3.2.0</version>
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

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class JwtAuthServiceApp implements CommandLineRunner {

    @Autowired
    private SetupData setupData;

    public static void main(String[] args) {
        SpringApplication.run(JwtAuthServiceApp.class, args);
    }

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE)
                .setSkipNullEnabled(true)
                .setPropertyCondition(context -> context.getSource() != null);
        return modelMapper;
    }

    @Override
    public void run(String... params) {
        setupData.setupData();
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
        Map<String, Object> content = Map.of(
                "origin", "remote",
                "type", "request",
                "correlation", precorrelation.getId(),
                "protocol", request.getProtocolVersion(),
                "method", request.getMethod(),
                "uri", request.getRequestUri(),
                "headers", request.getHeaders(),
                "body", body
        );
        return content;
    }

    private Map<String, Object> toJson(HttpResponse response, Correlation correlation) throws IOException {
        String body = response.getBodyAsString();
        Map<String, Object> content = Map.of(
                "origin", "local",
                "type", "response",
                "correlation", correlation.getId(),
                "duration", correlation.getDuration().toMillis(),
                "protocol", response.getProtocolVersion(),
                "status", response.getStatus(),
                "headers", response.getHeaders(),
                "body", body
        );
        return content;
    }

    private String formatWithPrettyBody(Map<String, Object> content) throws JsonProcessingException {
        if (content.containsKey("body") && content.get("body") instanceof String) {
            try {
                Object body = mapper.readValue((String) content.get("body"), Object.class);
                Map<String, Object> mutableContent = new java.util.HashMap<>(content);
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
File: src/main/java/com/awesome/testing/configuration/SwaggerConfig.java
================================================
package com.awesome.testing.configuration;

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
File: src/main/java/com/awesome/testing/controller/CartController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.CartDTO;
import com.awesome.testing.dto.CartItemDTO;
import com.awesome.testing.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
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
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved cart"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<CartDTO> getCart(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(cartService.getCart(principal.toString()));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item added successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<CartDTO> addToCart(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody CartItemDTO cartItemDTO) {
        return ResponseEntity.ok(cartService.addToCart(principal.toString(), cartItemDTO));
    }

    @PutMapping("/items/{productId}")
    @Operation(summary = "Update item quantity", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item quantity updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Cart item not found")
    })
    public ResponseEntity<CartDTO> updateCartItem(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long productId,
            @Valid @RequestBody CartItemDTO cartItemDTO) {
        return ResponseEntity.ok(cartService.updateCartItem(principal.toString(), productId, cartItemDTO));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Item removed successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Cart item not found")
    })
    public ResponseEntity<CartDTO> removeFromCart(
            @AuthenticationPrincipal Object principal,
            @PathVariable Long productId) {
        return ResponseEntity.ok(cartService.removeFromCart(principal.toString(), productId));
    }

    @DeleteMapping
    @Operation(summary = "Clear cart", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Cart cleared successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal Object principal) {
        cartService.clearCart(principal.toString());
        return ResponseEntity.ok().build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/EmailController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.EmailDTO;
import com.awesome.testing.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/email")
@Tag(name = "email", description = "Email sending endpoints")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping
    @Operation(summary = "Send an email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content),
            @ApiResponse(responseCode = "500", description = "Error sending email", content = @Content)
    })
    public ResponseEntity<Void> sendEmail(
            @Parameter(description = "Email details") @Valid @RequestBody EmailDTO emailDTO) {
        emailService.sendEmail(emailDTO);
        return ResponseEntity.ok().build();
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/OrderController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.AddressDTO;
import com.awesome.testing.dto.OrderDTO;
import com.awesome.testing.dto.PageDTO;
import com.awesome.testing.model.OrderStatus;
import com.awesome.testing.security.CustomPrincipal;
import com.awesome.testing.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
            @ApiResponse(responseCode = "400", description = "Invalid input or empty cart"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<OrderDTO> createOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @Valid @RequestBody AddressDTO addressDTO) {
        OrderDTO order = orderService.createOrder(principal.getUsername(), addressDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    @Operation(summary = "Get user's orders")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PageDTO<OrderDTO>> getUserOrders(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(PageDTO.from(
                orderService.getUserOrders(principal.getUsername(), status, PageRequest.of(page, size))
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderDTO> getOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(principal.getUsername(), id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Update order status (Admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status transition"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel order")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order cancelled successfully"),
            @ApiResponse(responseCode = "400", description = "Order cannot be cancelled"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderDTO> cancelOrder(
            @Parameter(hidden = true) @AuthenticationPrincipal CustomPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, OrderStatus.CANCELLED));
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/ProductController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.ProductDTO;
import com.awesome.testing.model.Product;
import com.awesome.testing.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
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
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved product"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Create new product", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Product created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires admin role")
    })
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        Product savedProduct = productService.createProduct(productDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Update existing product", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Product updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - requires admin role"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {
        return productService.updateProduct(id, productDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Delete product", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productService.deleteProduct(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/controller/UserDeleteController.java
================================================
package com.awesome.testing.controller;

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
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@Parameter(description = "Username") @PathVariable String username) {
        userService.delete(username);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/UserEditController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.UserEditDTO;
import com.awesome.testing.model.User;
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
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    public User edit(
            @Parameter(description = "Username") @PathVariable String username,
            @Parameter(description = "User details") @Valid @RequestBody UserEditDTO userDto) {
        return userService.edit(username, userDto);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/UserGetController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.UserResponseDTO;
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
import org.modelmapper.ModelMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserGetController {

    private final UserService userService;
    private final ModelMapper modelMapper;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_CLIENT')")
    @Operation(summary = "Get all users", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of users",
                    content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "Users not found", content = @Content)
    })
    public List<UserResponseDTO> getAll() {
        return userService.getAll().stream()
                .map(user -> modelMapper.map(user, UserResponseDTO.class))
                .collect(Collectors.toList());
    }

    @GetMapping("/{username}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Get user by username", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User details",
                    content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content),
            @ApiResponse(responseCode = "404", description = "The user doesn't exist", content = @Content)
    })
    public UserResponseDTO getByUsername(@Parameter(description = "Username") @PathVariable String username) {
        return modelMapper.map(userService.search(username), UserResponseDTO.class);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/UserMeController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.UserResponseDTO;
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
import org.modelmapper.ModelMapper;
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
    private final ModelMapper modelMapper;

    @GetMapping("/me")
    @Operation(summary = "Get current user information", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current user details",
                    content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content)
    })
    public UserResponseDTO whoami(HttpServletRequest req) {
        return modelMapper.map(userService.whoami(req), UserResponseDTO.class);
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/UserRefreshController.java
================================================
package com.awesome.testing.controller;

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
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content)
    })
    public String refresh(HttpServletRequest req) {
        return userService.refresh(userService.whoami(req).getUsername());
    }

}


================================================
File: src/main/java/com/awesome/testing/controller/UserSignInController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.LoginDTO;
import com.awesome.testing.dto.LoginResponseDTO;
import com.awesome.testing.model.User;
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
                    content = @Content(schema = @Schema(implementation = LoginResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Field validation failed", content = @Content),
            @ApiResponse(responseCode = "422", description = "Invalid username/password supplied", content = @Content),
            @ApiResponse(responseCode = "500", description = "Something went wrong", content = @Content)
    })
    public LoginResponseDTO login(
            @Parameter(description = "Login details") @Valid @RequestBody LoginDTO loginDetails) {
        String token = userService.signIn(loginDetails.getUsername(), loginDetails.getPassword());
        User user = userService.search(loginDetails.getUsername());

        return LoginResponseDTO.builder()
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
File: src/main/java/com/awesome/testing/controller/UserSignUpController.java
================================================
package com.awesome.testing.controller;

import com.awesome.testing.dto.UserRegisterDTO;
import com.awesome.testing.model.User;
import com.awesome.testing.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@CrossOrigin(origins = "http://localhost:8081", maxAge = 3600)
@RestController
@RequestMapping("/users")
@Tag(name = "users", description = "User management endpoints")
@RequiredArgsConstructor
public class UserSignUpController {

    private final UserService userService;
    private final ModelMapper modelMapper;

    @PostMapping("/signup")
    @Operation(summary = "Create a new user account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User was successfully created",
                    content = @Content(schema = @Schema(type = "string", example = "eyJhbGciOiJIUzI1NiJ9..."))),
            @ApiResponse(responseCode = "400", description = "Something went wrong", content = @Content),
            @ApiResponse(responseCode = "422", description = "Username is already in use", content = @Content),
            @ApiResponse(responseCode = "500", description = "Something went wrong", content = @Content)
    })
    @ResponseStatus(HttpStatus.CREATED)
    public void signup(
            @Parameter(description = "Signup User") @Valid @RequestBody UserRegisterDTO user) {
        userService.signup(modelMapper.map(user, User.class));
    }

}


================================================
File: src/main/java/com/awesome/testing/dto/AddressDTO.java
================================================
package com.awesome.testing.dto;

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
public class AddressDTO {
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
} 

================================================
File: src/main/java/com/awesome/testing/dto/CartDTO.java
================================================
package com.awesome.testing.dto;

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
public class CartDTO {
    private String username;
    private List<CartItemDTO> items;
    private BigDecimal totalPrice;
    private int totalItems;
} 

================================================
File: src/main/java/com/awesome/testing/dto/CartItemDTO.java
================================================
package com.awesome.testing.dto;

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
public class CartItemDTO {
    @NotNull
    private Long productId;

    @NotNull
    @Min(1)
    private Integer quantity;

    private String productName;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
} 

================================================
File: src/main/java/com/awesome/testing/dto/EmailDTO.java
================================================
package com.awesome.testing.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailDTO {
    @Schema(description = "Email recipient", example = "user@example.com")
    private String recipient;
    
    @Schema(description = "Email subject", example = "Important message")
    private String subject;
    
    @Schema(description = "Email content", example = "Please read this message carefully")
    private String content;
}


================================================
File: src/main/java/com/awesome/testing/dto/ErrorDTO.java
================================================
package com.awesome.testing.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorDTO {
    @Schema(description = "Error message", example = "Something went wrong")
    private String message;
}


================================================
File: src/main/java/com/awesome/testing/dto/LoginDTO.java
================================================
package com.awesome.testing.dto;

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
public class LoginDTO {

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "admin")
    private String username;

    @Size(min = 4, max = 255, message = "Minimum password length: 4 characters")
    @Schema(description = "Password", example = "admin")
    private String password;

}


================================================
File: src/main/java/com/awesome/testing/dto/LoginResponseDTO.java
================================================
package com.awesome.testing.dto;

import com.awesome.testing.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class LoginResponseDTO {

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

    @Schema(description = "User roles", example = "[\"ROLE_USER\"]")
    List<Role> roles;

}


================================================
File: src/main/java/com/awesome/testing/dto/OrderDTO.java
================================================
package com.awesome.testing.dto;

import com.awesome.testing.model.OrderStatus;
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
public class OrderDTO {
    @Schema(description = "Order ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "john.doe")
    private String username;

    @Builder.Default
    @Valid
    @Schema(description = "Order items")
    private List<OrderItemDTO> items = new ArrayList<>();

    @Schema(description = "Total amount", example = "1999.98")
    private BigDecimal totalAmount;

    @Schema(description = "Order status", example = "PENDING")
    private OrderStatus status;

    @Valid
    @NotNull(message = "Shipping address is required")
    @Schema(description = "Shipping address")
    private AddressDTO shippingAddress;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
} 

================================================
File: src/main/java/com/awesome/testing/dto/OrderItemDTO.java
================================================
package com.awesome.testing.dto;

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
public class OrderItemDTO {
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
} 

================================================
File: src/main/java/com/awesome/testing/dto/PageDTO.java
================================================
package com.awesome.testing.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageDTO<T> {
    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    public static <T> PageDTO<T> from(Page<T> page) {
        return new PageDTO<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
} 

================================================
File: src/main/java/com/awesome/testing/dto/ProductDTO.java
================================================
package com.awesome.testing.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
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
@Schema(description = "Product data transfer object")
public class ProductDTO {
    private Long id;

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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 

================================================
File: src/main/java/com/awesome/testing/dto/UserEditDTO.java
================================================
package com.awesome.testing.dto;

import com.awesome.testing.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@Builder
public class UserEditDTO {

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "johndoe")
    private String username;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Size(min = 8, message = "Minimum password length: 8 characters")
    @Schema(description = "Password", example = "password123")
    private String password;

    @Size(max = 255)
    @Schema(description = "First name", example = "John")
    private String firstName;

    @Size(max = 255)
    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "User roles", example = "[\"ROLE_USER\"]")
    private List<Role> roles;

}


================================================
File: src/main/java/com/awesome/testing/dto/UserRegisterDTO.java
================================================
package com.awesome.testing.dto;

import com.awesome.testing.model.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
public class UserRegisterDTO {

    @Size(min = 4, max = 255, message = "Minimum username length: 4 characters")
    @Schema(description = "Username", example = "johndoe")
    private String username;

    @Email(message = "Email should be valid")
    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Size(min = 4, message = "Minimum password length: 4 characters")
    @Schema(description = "Password", example = "password123")
    private String password;

    @Size(max = 255)
    @Schema(description = "First name", example = "John")
    private String firstName;

    @Size(max = 255)
    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "User roles", example = "[\"ROLE_USER\"]")
    @NotEmpty(message = "User must have at least one role")
    private List<Role> roles;

}


================================================
File: src/main/java/com/awesome/testing/dto/UserRegisterResponseDTO.java
================================================
package com.awesome.testing.dto;

import lombok.*;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class UserRegisterResponseDTO {

    String token;

}


================================================
File: src/main/java/com/awesome/testing/dto/UserResponseDTO.java
================================================
package com.awesome.testing.dto;

import com.awesome.testing.model.Role;
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
public class UserResponseDTO {

    @Schema(description = "User ID", example = "1")
    Integer id;

    @Schema(description = "Username", example = "johndoe")
    String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    String email;

    @Schema(description = "User roles", example = "[\"ROLE_USER\"]")
    List<Role> roles;

    @Schema(description = "First name", example = "John")
    String firstName;

    @Schema(description = "Last name", example = "Doe")
    String lastName;

}


================================================
File: src/main/java/com/awesome/testing/exception/CustomException.java
================================================
package com.awesome.testing.exception;

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
File: src/main/java/com/awesome/testing/exception/GlobalExceptionHandlerController.java
================================================
package com.awesome.testing.exception;

import java.util.Map;
import java.util.HashMap;

import com.awesome.testing.dto.ErrorDTO;
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
import org.springframework.web.bind.annotation.ResponseStatus;

@RestControllerAdvice
public class GlobalExceptionHandlerController extends DefaultErrorAttributes {

    @Override
    public Map<String, Object> getErrorAttributes(WebRequest webRequest, ErrorAttributeOptions options) {
        Map<String, Object> errorAttributes = super.getErrorAttributes(webRequest, options);
        errorAttributes.remove("trace");
        return errorAttributes;
    }

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorDTO> handleCustomException(CustomException ex) {
        return ResponseEntity
                .status(ex.getHttpStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDTO(ex.getMessage()));
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

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDTO> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDTO("Access denied"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDTO> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDTO("Invalid username/password supplied"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorDTO> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDTO("Unauthorized"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> handleException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ErrorDTO("Internal server error"));
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorDTO handleUserNotFoundException(UserNotFoundException ex) {
        return new ErrorDTO(ex.getMessage());
    }
}


================================================
File: src/main/java/com/awesome/testing/exception/UserNotFoundException.java
================================================
package com.awesome.testing.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
} 

================================================
File: src/main/java/com/awesome/testing/fakedata/SetupData.java
================================================
package com.awesome.testing.fakedata;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SetupData {

    private final SetupUsers setupUsers;
    private final SetupProducts setupProducts;

    public void setupData() {
        setupUsers.createUsers();
        setupProducts.createProducts();
    }

}


================================================
File: src/main/java/com/awesome/testing/fakedata/SetupProducts.java
================================================
package com.awesome.testing.fakedata;

import com.awesome.testing.dto.ProductDTO;
import com.awesome.testing.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class SetupProducts {

    private final ProductService productService;

    public void createProducts() {
        // Electronics
        createProduct(
            "iPhone 13 Pro",
            "Latest iPhone model with A15 Bionic chip, Pro camera system, and Super Retina XDR display",
            new BigDecimal("999.99"),
            50,
            "Electronics",
            "https://example.com/iphone13pro.jpg"
        );

        createProduct(
            "Samsung Galaxy S21",
            "5G smartphone with 8K video, all-day battery, and powerful performance",
            new BigDecimal("799.99"),
            75,
            "Electronics",
            "https://example.com/galaxys21.jpg"
        );

        // Computers
        createProduct(
            "MacBook Pro 14\"",
            "Apple M1 Pro chip, 16GB RAM, 512GB SSD, Liquid Retina XDR display",
            new BigDecimal("1999.99"),
            25,
            "Computers",
            "https://example.com/macbookpro.jpg"
        );

        // Gaming
        createProduct(
            "PlayStation 5",
            "Next-gen gaming console with 4K graphics, ray tracing, and ultra-high speed SSD",
            new BigDecimal("499.99"),
            30,
            "Gaming",
            "https://example.com/ps5.jpg"
        );

        // Home & Kitchen
        createProduct(
            "Ninja Foodi 9-in-1",
            "Deluxe XL pressure cooker and air fryer with multiple cooking functions",
            new BigDecimal("249.99"),
            100,
            "Home & Kitchen",
            "https://example.com/ninjafoodi.jpg"
        );

        // Books
        createProduct(
            "Clean Code",
            "A Handbook of Agile Software Craftsmanship by Robert C. Martin",
            new BigDecimal("44.99"),
            200,
            "Books",
            "https://example.com/cleancode.jpg"
        );

        // Wearables
        createProduct(
            "Apple Watch Series 7",
            "Always-On Retina display, health monitoring, and fitness tracking",
            new BigDecimal("399.99"),
            60,
            "Wearables",
            "https://example.com/applewatch.jpg"
        );

        // Audio
        createProduct(
            "Sony WH-1000XM4",
            "Industry-leading noise canceling wireless headphones with exceptional sound",
            new BigDecimal("349.99"),
            85,
            "Audio",
            "https://example.com/sonywh1000xm4.jpg"
        );
    }

    private void createProduct(String name, String description, BigDecimal price, 
                             Integer stockQuantity, String category, String imageUrl) {
        ProductDTO product = ProductDTO.builder()
                .name(name)
                .description(description)
                .price(price)
                .stockQuantity(stockQuantity)
                .category(category)
                .imageUrl(imageUrl)
                .build();
        
        productService.createProduct(product);
    }
} 

================================================
File: src/main/java/com/awesome/testing/fakedata/SetupUsers.java
================================================
package com.awesome.testing.fakedata;

import java.util.List;

import org.springframework.stereotype.Component;

import com.awesome.testing.model.Role;
import com.awesome.testing.model.User;
import com.awesome.testing.service.UserService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SetupUsers {

    private final UserService userService;

    public void createUsers() {
        User admin = SetupUsers.createAdminUser(
                "admin",
                "admin",
                "awesome@testing.com",
                "Slawomir",
                "Radzyminski"
        );
        userService.signup(admin);

        User admin2 = SetupUsers.createAdminUser(
                "admin2",
                "admin2",
                "john.doe@company.com",
                "John",
                "Doe"
        );
        userService.signup(admin2);

        User client1 = SetupUsers.createClientUser(
                "client",
                "client",
                "alice.smith@yahoo.com",
                "Alice",
                "Smith"
        );
        userService.signup(client1);

        User client2 = SetupUsers.createClientUser(
                "client2",
                "client2",
                "bob.johnson@google.com",
                "Bob",
                "Johnson"
        );
        userService.signup(client2);

        User client3 = SetupUsers.createClientUser(
                "client3",
                "client3",
                "charlie.brown@example.com",
                "Charlie",
                "Brown"
        );
        userService.signup(client3);
    }

    public static User createAdminUser(String username, String password, String email, String firstName, String lastName) {
        User admin = new User();
        admin.setUsername(username);
        admin.setPassword(password);
        admin.setEmail(email);
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setRoles(List.of(Role.ROLE_ADMIN));
        return admin;
    }

    public static User createClientUser(String username, String password, String email, String firstName, String lastName) {
        User client = new User();
        client.setUsername(username);
        client.setPassword(password);
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

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.support.converter.MappingJackson2MessageConverter;
import org.springframework.jms.support.converter.MessageConverter;
import org.springframework.jms.support.converter.MessageType;

@SuppressWarnings("unused")
@Configuration
public class EmailConfig {

    @Bean
    public MessageConverter jacksonJmsMessageConverter() {
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setTargetType(MessageType.TEXT);
        converter.setTypeIdPropertyName("_awesome_");
        return converter;
    }

}


================================================
File: src/main/java/com/awesome/testing/jms/JmsSender.java
================================================
package com.awesome.testing.jms;

import com.awesome.testing.dto.EmailDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JmsSender {

    @Autowired
    private JmsTemplate jmsTemplate;

    @Async
    public void asyncSendTo(String destination, EmailDTO email) {
        jmsTemplate.convertAndSend(destination, email);
        log.info("Message {} sent successfully", email);
    }

}


================================================
File: src/main/java/com/awesome/testing/model/Address.java
================================================
package com.awesome.testing.model;

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
public class Address {
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
} 

================================================
File: src/main/java/com/awesome/testing/model/CartItem.java
================================================
package com.awesome.testing.model;

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
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // price at the time of adding to cart

    @Version
    private Long version; // for optimistic locking
} 

================================================
File: src/main/java/com/awesome/testing/model/Order.java
================================================
package com.awesome.testing.model;

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
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Embedded
    private Address shippingAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
} 

================================================
File: src/main/java/com/awesome/testing/model/OrderItem.java
================================================
package com.awesome.testing.model;

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
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // price at the time of order
} 

================================================
File: src/main/java/com/awesome/testing/model/OrderStatus.java
================================================
package com.awesome.testing.model;

public enum OrderStatus {
    PENDING,
    PAID,
    SHIPPED,
    DELIVERED,
    CANCELLED
} 

================================================
File: src/main/java/com/awesome/testing/model/Product.java
================================================
package com.awesome.testing.model;

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
public class Product {
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
} 

================================================
File: src/main/java/com/awesome/testing/model/Role.java
================================================
package com.awesome.testing.model;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    ROLE_ADMIN, ROLE_CLIENT;

    public String getAuthority() {
        return name();
    }

}


================================================
File: src/main/java/com/awesome/testing/model/User.java
================================================
package com.awesome.testing.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@RequiredArgsConstructor
@Table(name = "app_user")
public class User {

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
File: src/main/java/com/awesome/testing/repository/CartItemRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product WHERE ci.username = :username")
    List<CartItem> findByUsername(@Param("username") String username);

    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product WHERE ci.username = :username AND ci.product.id = :productId")
    Optional<CartItem> findByUsernameAndProductId(@Param("username") String username, @Param("productId") Long productId);

    void deleteByUsername(String username);

    void deleteByUsernameAndProductId(String username, Long productId);
} 

================================================
File: src/main/java/com/awesome/testing/repository/OrderRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.model.Order;
import com.awesome.testing.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.username = :username")
    Page<Order> findByUsername(@Param("username") String username, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.username = :username AND o.status = :status")
    Page<Order> findByUsernameAndStatus(@Param("username") String username, @Param("status") OrderStatus status, Pageable pageable);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id = :id AND o.username = :username")
    Optional<Order> findByIdAndUsername(@Param("id") Long id, @Param("username") String username);
} 

================================================
File: src/main/java/com/awesome/testing/repository/ProductRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    // JpaSpecificationExecutor allows for dynamic querying (filtering by category, price range, etc.)
} 

================================================
File: src/main/java/com/awesome/testing/repository/UserRepository.java
================================================
package com.awesome.testing.repository;

import com.awesome.testing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.transaction.Transactional;

public interface UserRepository extends JpaRepository<User, Integer> {

    boolean existsByUsername(String username);

    User findByUsername(String username);

    @Transactional
    void deleteByUsername(String username);

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

import com.awesome.testing.exception.CustomException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
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
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"message\":\"Invalid or expired token\"}");
        } catch (CustomException ex) {
            SecurityContextHolder.clearContext();
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(ex.getHttpStatus().value());
            response.getWriter().write("{\"message\":\"" + ex.getMessage() + "\"}");
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"message\":\"Internal server error\"}");
        }
    }

}


================================================
File: src/main/java/com/awesome/testing/security/JwtTokenFilterConfigurer.java
================================================
package com.awesome.testing.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.config.annotation.SecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@RequiredArgsConstructor
public class JwtTokenFilterConfigurer extends SecurityConfigurerAdapter<DefaultSecurityFilterChain, HttpSecurity> {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void configure(HttpSecurity http) {
        JwtTokenFilter customFilter = new JwtTokenFilter(jwtTokenProvider);
        http.addFilterBefore(customFilter, UsernamePasswordAuthenticationFilter.class);
    }

}


================================================
File: src/main/java/com/awesome/testing/security/JwtTokenProvider.java
================================================
package com.awesome.testing.security;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

import com.awesome.testing.exception.CustomException;
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
import com.awesome.testing.model.Role;

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

    private List<SimpleGrantedAuthority> getRoles(List<Role> roles) {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.getAuthority()))
                .collect(Collectors.toList());
    }

    public Authentication getAuthentication(String token) {
        String username = getUsername(token);
        UserDetails userDetails = myUserDetails.loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(new CustomPrincipal(username, userDetails), "", userDetails.getAuthorities());
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
        String bearerToken = req.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
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

import com.awesome.testing.model.User;

import java.text.MessageFormat;

import static org.springframework.security.core.userdetails.User.*;

@Service
@RequiredArgsConstructor
public class MyUserDetails implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        final User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException(
                    MessageFormat.format("User ''{0}'' not found", username));
        }

        return withUsername(username)
                .password(user.getPassword())
                .authorities(user.getRoles())
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }

}


================================================
File: src/main/java/com/awesome/testing/security/WebSecurityConfig.java
================================================
package com.awesome.testing.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Disable CSRF as we use JWT
        http.csrf(csrf -> csrf.disable());
        
        // Enable CORS
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        
        // No session will be created or used by Spring Security
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        // Entry points
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/users/signin").permitAll()
            .requestMatchers("/users/signup").permitAll()
            .requestMatchers("/h2-console/**").permitAll()
            // Swagger endpoints
            .requestMatchers("/v3/api-docs/**").permitAll()
            .requestMatchers("/swagger-ui/**").permitAll()
            .requestMatchers("/swagger-resources/**").permitAll()
            .requestMatchers("/webjars/**").permitAll()
            // All other endpoints require authentication
            .anyRequest().authenticated()
        );

        // Handle errors
        http.exceptionHandling(ex -> ex
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("{\"message\":\"Access denied\"}");
            })
            .authenticationEntryPoint((request, response, authException) -> {
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"message\":\"Unauthorized\"}");
            })
        );

        // Apply JWT security filter
        http.addFilterBefore(new JwtTokenFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
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
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8081"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
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

import com.awesome.testing.dto.CartDTO;
import com.awesome.testing.dto.CartItemDTO;
import com.awesome.testing.model.CartItem;
import com.awesome.testing.model.Product;
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
    public CartDTO getCart(String username) {
        List<CartItem> cartItems = cartItemRepository.findByUsername(username);
        return createCartDTO(username, cartItems);
    }

    @Transactional
    public CartDTO addToCart(String username, CartItemDTO cartItemDTO) {
        Product product = productRepository.findById(cartItemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem cartItem = cartItemRepository.findByUsernameAndProductId(username, cartItemDTO.getProductId())
                .map(existingItem -> updateItem(cartItemDTO, existingItem, product))
                .orElseGet(() -> createItem(username, cartItemDTO, product));

        cartItemRepository.save(cartItem);
        List<CartItem> cartItems = cartItemRepository.findByUsername(username);
        return createCartDTO(username, cartItems);
    }

    private CartItem createItem(String username, CartItemDTO cartItemDTO, Product product) {
        return CartItem.builder()
                .username(username)
                .product(product)
                .quantity(cartItemDTO.getQuantity())
                .price(product.getPrice())
                .version(0L)
                .build();
    }

    private CartItem updateItem(CartItemDTO cartItemDTO, CartItem existingItem, Product product) {
        existingItem.setQuantity(existingItem.getQuantity() + cartItemDTO.getQuantity());
        existingItem.setPrice(product.getPrice());
        return existingItem;
    }

    @Transactional
    public CartDTO updateCartItem(String username, Long productId, CartItemDTO cartItemDTO) {
        CartItem cartItem = cartItemRepository.findByUsernameAndProductId(username, productId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        cartItem.setQuantity(cartItemDTO.getQuantity());
        cartItem.setPrice(cartItem.getProduct().getPrice());
        cartItemRepository.save(cartItem);

        List<CartItem> cartItems = cartItemRepository.findByUsername(username);
        return createCartDTO(username, cartItems);
    }

    @Transactional
    public CartDTO removeFromCart(String username, Long productId) {
        cartItemRepository.deleteByUsernameAndProductId(username, productId);
        List<CartItem> cartItems = cartItemRepository.findByUsername(username);
        return createCartDTO(username, cartItems);
    }

    @Transactional
    public void clearCart(String username) {
        cartItemRepository.deleteByUsername(username);
    }

    private CartDTO createCartDTO(String username, List<CartItem> cartItems) {
        return CartDTO.builder()
                .username(username)
                .items(getItems(cartItems))
                .totalPrice(calculateTotalPrice(cartItems))
                .totalItems(calculateTotalItems(cartItems))
                .build();
    }

    private List<CartItemDTO> getItems(List<CartItem> cartItems) {
        return cartItems.stream()
                .map(this::convertToCartItemDTO)
                .toList();
    }

    private CartItemDTO convertToCartItemDTO(CartItem item) {
        return CartItemDTO.builder()
                .productId(item.getProduct().getId())
                .quantity(item.getQuantity())
                .build();
    }

    private int calculateTotalItems(List<CartItem> cartItems) {
        return cartItems.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private BigDecimal calculateTotalPrice(List<CartItem> cartItems) {
        return cartItems.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
} 

================================================
File: src/main/java/com/awesome/testing/service/EmailService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.EmailDTO;
import com.awesome.testing.jms.JmsSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JmsSender jmsSender;

    @Value("${activemq.destination}")
    private String destination;

    public void sendEmail(EmailDTO email) {
        jmsSender.asyncSendTo(destination, email);
    }

} 

================================================
File: src/main/java/com/awesome/testing/service/OrderService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.AddressDTO;
import com.awesome.testing.dto.OrderDTO;
import com.awesome.testing.dto.OrderItemDTO;
import com.awesome.testing.exception.CustomException;
import com.awesome.testing.model.*;
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
    public OrderDTO createOrder(String username, AddressDTO addressDTO) {
        List<CartItem> cartItems = cartItemRepository.findByUsername(username);
        if (cartItems.isEmpty()) {
            throw new CustomException("Cart is empty", HttpStatus.BAD_REQUEST);
        }

        Order order = Order.builder()
                .username(username)
                .status(OrderStatus.PENDING)
                .shippingAddress(mapToAddress(addressDTO))
                .totalAmount(BigDecimal.ZERO)
                .build();

        cartItems.forEach(cartItem -> updateOrder(cartItem, order));

        Order savedOrder = orderRepository.save(order);
        cartItemRepository.deleteByUsername(username);

        return mapToOrderDTO(savedOrder);
    }

    private void updateOrder(CartItem cartItem, Order order) {
        OrderItem orderItem = OrderItem.builder()
                .product(cartItem.getProduct())
                .quantity(cartItem.getQuantity())
                .price(cartItem.getPrice())
                .build();
        order.addItem(orderItem);
        order.setTotalAmount(order.getTotalAmount().add(
                cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
        ));
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getUserOrders(String username, OrderStatus status, Pageable pageable) {
        Page<Order> orders = status == null ?
                orderRepository.findByUsername(username, pageable) :
                orderRepository.findByUsernameAndStatus(username, status, pageable);
        return orders.map(this::mapToOrderDTO);
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrder(String username, Long orderId) {
        return orderRepository.findByIdAndUsername(orderId, username)
                .map(this::mapToOrderDTO)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));

        if (newStatus == OrderStatus.CANCELLED && !canBeCancelled(order.getStatus())) {
            throw new CustomException("Order cannot be cancelled in current status", HttpStatus.BAD_REQUEST);
        }

        order.setStatus(newStatus);
        return mapToOrderDTO(orderRepository.save(order));
    }

    private boolean canBeCancelled(OrderStatus status) {
        return status == OrderStatus.PENDING || status == OrderStatus.PAID;
    }

    private Address mapToAddress(AddressDTO dto) {
        return Address.builder()
                .street(dto.getStreet())
                .city(dto.getCity())
                .state(dto.getState())
                .zipCode(dto.getZipCode())
                .country(dto.getCountry())
                .build();
    }

    private OrderDTO mapToOrderDTO(Order order) {
        return OrderDTO.builder()
                .id(order.getId())
                .username(order.getUsername())
                .items(mapToOrderItemDTOs(order.getItems()))
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(mapToAddressDTO(order.getShippingAddress()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private List<OrderItemDTO> mapToOrderItemDTOs(List<OrderItem> items) {
        return items.stream()
                .map(item -> OrderItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getPrice())
                        .totalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                        .build())
                .toList();
    }

    private AddressDTO mapToAddressDTO(Address address) {
        return AddressDTO.builder()
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .zipCode(address.getZipCode())
                .country(address.getCountry())
                .build();
    }
} 

================================================
File: src/main/java/com/awesome/testing/service/ProductService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.ProductDTO;
import com.awesome.testing.model.Product;
import com.awesome.testing.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product createProduct(ProductDTO productDTO) {
        Product product = Product.builder()
                .name(productDTO.getName())
                .description(productDTO.getDescription())
                .price(productDTO.getPrice())
                .stockQuantity(productDTO.getStockQuantity())
                .category(productDTO.getCategory())
                .imageUrl(productDTO.getImageUrl())
                .build();
        
        return productRepository.save(product);
    }

    @Transactional
    public Optional<Product> updateProduct(Long id, ProductDTO productDTO) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(productDTO.getName());
                    product.setDescription(productDTO.getDescription());
                    product.setPrice(productDTO.getPrice());
                    product.setStockQuantity(productDTO.getStockQuantity());
                    product.setCategory(productDTO.getCategory());
                    product.setImageUrl(productDTO.getImageUrl());
                    return productRepository.save(product);
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
} 

================================================
File: src/main/java/com/awesome/testing/service/UserService.java
================================================
package com.awesome.testing.service;

import com.awesome.testing.dto.UserEditDTO;
import com.awesome.testing.exception.CustomException;
import com.awesome.testing.exception.UserNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import com.awesome.testing.model.Role;
import com.awesome.testing.model.User;
import com.awesome.testing.repository.UserRepository;
import com.awesome.testing.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public String signIn(String username, String password) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
            return jwtTokenProvider.createToken(username, userRepository.findByUsername(username).getRoles());
        } catch (BadCredentialsException e) {
            throw new CustomException("Invalid username/password supplied", HttpStatus.UNPROCESSABLE_ENTITY);
        } catch (AuthenticationException e) {
            throw new CustomException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }
    }

    public void signup(User user) {
        if (!userRepository.existsByUsername(user.getUsername())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(Collections.singletonList(Role.ROLE_CLIENT));
            }
            userRepository.save(user);
        } else {
            throw new CustomException("Username is already in use", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    public void delete(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UserNotFoundException("The user doesn't exist");
        }
        userRepository.deleteByUsername(username);
    }

    public User search(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UserNotFoundException("The user doesn't exist");
        }
        return user;
    }

    public User whoami(HttpServletRequest req) {
        String username = jwtTokenProvider.getUsername(jwtTokenProvider.extractTokenFromRequest(req));
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UserNotFoundException("The user doesn't exist");
        }
        return user;
    }

    public String refresh(String username) {
        return jwtTokenProvider.createToken(username, userRepository.findByUsername(username).getRoles());
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User edit(String username, UserEditDTO userDto) {
        User existingUser = userRepository.findByUsername(username);
        if (existingUser == null) {
            throw new UserNotFoundException("The user doesn't exist");
        }
        
        if (userDto.getEmail() != null) {
            existingUser.setEmail(userDto.getEmail());
        }
        if (userDto.getFirstName() != null) {
            existingUser.setFirstName(userDto.getFirstName());
        }
        if (userDto.getLastName() != null) {
            existingUser.setLastName(userDto.getLastName());
        }
        if (userDto.getRoles() != null) {
            existingUser.setRoles(userDto.getRoles());
        }
        if (userDto.getPassword() != null) {
            existingUser.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        
        return userRepository.save(existingUser);
    }

    public boolean exists(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UserNotFoundException("User not found");
        }
        return true;
    }

}


================================================
File: src/main/resources/application.yml
================================================
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: root
    password: root
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
  activemq:
    in-memory: false
    broker-url: tcp://host.docker.internal:61616
    user: admin
    password: admin
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
    include-stacktrace: ON_PARAM
    include-exception: false
  servlet:
    encoding:
      charset: UTF-8
      enabled: true
      force: true


security:
  jwt:
    token:
      secret-key: secret-key
      expire-length: 300000 # 5 minutes duration by default: 5 minutes * 60 seconds * 1000 miliseconds

logbook:
  include: "/**"
  exclude: 
    - "/swagger-ui/**"
    - "/v3/api-docs/**"
  format:
    style: json
  write:
    chunk-size: 1000
  filter.enabled: true
  obfuscate:
    headers:
      - x-secret
      - cookie

logging:
  level:
    root: INFO
    org.zalando.logbook: TRACE
  pattern:
    console: "%msg%n"

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

management:
  endpoints:
    web:
      exposure:
        include: "*"



