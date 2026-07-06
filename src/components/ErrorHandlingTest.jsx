import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../contexts/ToastContext';

/**
 * Test component to demonstrate improved error handling
 * This component can be temporarily added to admin/delivery dashboards for testing
 */
const ErrorHandlingTest = () => {
  const { showError, showWarning, showSuccess } = useToast();

  const testBackendError = () => {
    // Simulate a backend error response like the one mentioned in the user's request
    const mockError = {
      response: {
        status: 500,
        data: {
          statusCode: 500,
          message: "No static resource api/orders/delivery/orders."
        },
        config: {
          url: '/api/orders/delivery/orders',
          method: 'post'
        }
      }
    };

    // Import and use the error handler
    import('../services/errorHandler').then(({ handleApiError }) => {
      handleApiError(mockError);
    });
  };

  const testDifferentErrorTypes = () => {
    const errors = [
      {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: "Invalid request parameters"
          },
          config: { url: '/api/test', method: 'post' }
        }
      },
      {
        response: {
          status: 404,
          data: {
            statusCode: 404,
            message: "Resource not found"
          },
          config: { url: '/api/test', method: 'put' }
        }
      },
      {
        response: {
          status: 422,
          data: {
            statusCode: 422,
            message: "Validation failed: email is required"
          },
          config: { url: '/api/test', method: 'post' }
        }
      }
    ];

    errors.forEach((error, index) => {
      setTimeout(() => {
        import('../services/errorHandler').then(({ handleApiError }) => {
          handleApiError(error);
        });
      }, index * 1000);
    });
  };

  const testOrderStatusUpdate = () => {
    // Simulate a successful order status update
    const mockResponse = {
      config: {
        url: '/api/orders/update-status',
        method: 'put'
      },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        message: 'Order status updated successfully to CONFIRMED',
        orderId: 123,
        newStatus: 'CONFIRMED'
      }
    };

    // This would normally be handled by the response interceptor
    console.log('📋 PUT Response Details:', {
      url: mockResponse.config.url,
      status: mockResponse.status,
      statusText: mockResponse.statusText,
      headers: mockResponse.headers,
      data: mockResponse.data,
      timestamp: new Date().toISOString()
    });

    showSuccess('Order status updated successfully to CONFIRMED');
  };

  const testUserRoleChange = () => {
    // Simulate a successful user role change
    const mockResponse = {
      config: {
        url: '/api/users/change-role',
        method: 'get'
      },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        statusCode: 200,
        message: 'User role changed successfully to DELIVERY',
        userId: 456,
        newRole: 'DELIVERY'
      }
    };

    // This would normally be handled by the response interceptor
    console.log('📋 GET Response Details:', {
      url: mockResponse.config.url,
      status: mockResponse.status,
      statusText: mockResponse.statusText,
      headers: mockResponse.headers,
      data: mockResponse.data,
      timestamp: new Date().toISOString()
    });

    showSuccess('User role changed successfully to DELIVERY', { title: 'Success' });
  };

  const testUserRoleError = () => {
    // Simulate a user role change error (like the example you provided)
    const mockResponse = {
      config: {
        url: '/api/users/change-role',
        method: 'get'
      },
      status: 200, // HTTP status is 200 but backend statusCode is 400
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        statusCode: 400,
        message: "Bad Request: User already has role 'CUSTOMER'."
      }
    };

    // This would normally be handled by the response interceptor
    console.log('📋 GET Response Details:', {
      url: mockResponse.config.url,
      status: mockResponse.status,
      statusText: mockResponse.statusText,
      headers: mockResponse.headers,
      data: mockResponse.data,
      timestamp: new Date().toISOString()
    });

    showError("Bad Request: User already has role 'CUSTOMER'.", { title: 'Error 400' });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Error Handling Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Test the improved error handling and response logging
        </div>
        
        <Button 
          onClick={testBackendError} 
          variant="destructive" 
          className="w-full"
        >
          Test 500 Server Error
        </Button>
        
        <Button 
          onClick={testDifferentErrorTypes} 
          variant="outline" 
          className="w-full"
        >
          Test Multiple Error Types
        </Button>
        
        <Button 
          onClick={testOrderStatusUpdate} 
          variant="default" 
          className="w-full"
        >
          Test Order Status Update
        </Button>
        
        <Button 
          onClick={testUserRoleChange} 
          variant="default" 
          className="w-full"
        >
          Test User Role Change (Success)
        </Button>
        
        <Button 
          onClick={testUserRoleError} 
          variant="destructive" 
          className="w-full"
        >
          Test User Role Error (400)
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Check the browser console for detailed response/error logs when in admin/delivery panels
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorHandlingTest;
