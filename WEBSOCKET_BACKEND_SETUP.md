# WebSocket Backend Setup for Real-time Order Updates

This document provides guidance on implementing the backend WebSocket functionality to support real-time order updates in the New Orders page.

## Backend Dependencies

Add these dependencies to your Spring Boot `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

## WebSocket Configuration

Create a WebSocket configuration class:

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new OrderWebSocketHandler(), "/ws/orders")
                .setAllowedOrigins("*"); // Configure CORS as needed
    }
}
```

## WebSocket Handler

Create a WebSocket handler for order events:

```java
@Component
public class OrderWebSocketHandler extends TextWebSocketHandler {
    
    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("WebSocket connection established: " + session.getId());
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("WebSocket connection closed: " + session.getId());
    }
    
    public void broadcastNewOrder(OrderDTO order) {
        String message = createOrderMessage("newOrder", order);
        broadcast(message);
    }
    
    public void broadcastOrderUpdate(OrderDTO order) {
        String message = createOrderMessage("orderUpdated", order);
        broadcast(message);
    }
    
    private String createOrderMessage(String event, OrderDTO order) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> message = new HashMap<>();
            message.put("event", event);
            message.put("data", order);
            return mapper.writeValueAsString(message);
        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }
    
    private void broadcast(String message) {
        sessions.removeIf(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                    return false;
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
            return true;
        });
    }
}
```

## Order Service Integration

Update your OrderService to emit WebSocket events:

```java
@Service
public class OrderServiceImpl implements OrderService {
    
    @Autowired
    private OrderWebSocketHandler webSocketHandler;
    
    @Override
    public Response<OrderDTO> createOrder(OrderDTO orderDTO) {
        // ... existing order creation logic ...
        
        // Emit new order event
        webSocketHandler.broadcastNewOrder(createdOrder);
        
        return response;
    }
    
    @Override
    public Response<OrderDTO> updateOrderStatus(OrderDTO orderDTO) {
        // ... existing update logic ...
        
        // Emit order update event
        webSocketHandler.broadcastOrderUpdate(updatedOrder);
        
        return response;
    }
}
```

## Frontend WebSocket URL

Update the WebSocket connection URL in `foodFrontend/src/services/websocket.js`:

```javascript
this.socket = io('http://localhost:8080', {
  transports: ['websocket'],
  autoConnect: true,
});
```

## Testing the Implementation

1. Start your Spring Boot application
2. Start the frontend development server
3. Navigate to `/new-orders` page
4. Create a new order from another browser session
5. The new order should appear automatically on the New Orders page

## Security Considerations

- Add authentication to WebSocket connections
- Implement proper CORS configuration
- Add rate limiting for WebSocket events
- Validate WebSocket message content

## Additional Features

- Add order status change notifications
- Implement order assignment to delivery staff
- Add real-time order tracking
- Implement order priority management

