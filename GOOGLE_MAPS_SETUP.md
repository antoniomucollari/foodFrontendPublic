# Google Maps API Setup Guide

This guide will help you set up the Google Places API for the location search functionality.

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console

## Step 1: Enable Google Places API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Places API" and click on it
5. Click "Enable"

## Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Recommended) Click "Restrict Key" to add restrictions:
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5176/*` for development)
   - Under "API restrictions", select "Restrict key" and choose "Places API"

## Step 3: Configure the Application

### Option 1: Environment Variable (Recommended)

1. Create a `.env` file in your project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

2. Update `index.html` to use the environment variable:

```html
<script
  async
  defer
  src="https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places"
></script>
```

### Option 2: Direct Configuration

1. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `index.html` with your actual API key:

```html
<script
  async
  defer
  src="https://maps.googleapis.com/maps/api/js?key=your_actual_api_key_here&libraries=places"
></script>
```

## Step 4: Backend API Integration

The location search integrates with your backend API endpoints:

### Set Delivery Location

```
PUT /delivery-location/deliverTo
```

**Request Parameters:**

```
latitude: Double
longitude: Double
locationName: String
```

**Example:**

```
PUT /delivery-location/deliverTo?latitude=40.7128&longitude=-74.0060&locationName=New York
```

### Get Current Delivery Location

```
GET /delivery-location/deliveryLocation
```

**Response:**

```json
{
  "data": {
    "locationName": "New York",
    "latitude": 40.7128,
    "longitude": -74.006
  }
}
```

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

## Features

### Geolocation Permission Modal

- **Location request**: Asks user for current location permission
- **Browser geolocation**: Uses navigator.geolocation API
- **Reverse geocoding**: Converts coordinates to readable address
- **Error handling**: Graceful handling of permission denials and errors
- **Troubleshooting tips**: Helpful guidance for common issues

### Location Search Modal

- **Real-time search**: Uses Google Places Autocomplete API
- **Address validation**: Only shows valid addresses
- **US restriction**: Currently limited to US addresses
- **Error handling**: Graceful handling of API failures
- **Loading states**: Visual feedback during search and confirmation

### Navigation Integration

- **Desktop**: Clickable "Deliver to" section in top navigation
- **Mobile**: Integrated into mobile menu
- **Short display**: Shows abbreviated location (e.g., "New York, NY")
- **Blur effect**: Indicates there's more text available
- **Persistence**: Location stored in localStorage and backend

### User Experience

- **Smart flow**: First-time users get location permission request
- **Current location**: Uses browser geolocation for instant setup
- **Manual search**: Fallback to address search if location denied
- **Search suggestions**: Real-time address suggestions as you type
- **Place selection**: Click on any suggestion to select it
- **Confirmation**: "Confirm Location" button to save the selection
- **Backend sync**: Automatically calls your backend API with coordinates
- **Location loading**: Fetches current delivery location on app start

## Customization

### Change Country Restriction

In `src/components/LocationSearchModal.jsx`, modify the `componentRestrictions`:

```javascript
componentRestrictions: { country: "ca" }, // For Canada
```

### Modify Search Types

Change the `types` array to include different place types:

```javascript
types: ["address", "establishment"], // Include businesses
```

### Update API Endpoint

Modify the backend API call in `handleConfirmLocation`:

```javascript
const response = await fetch("/api/users/deliverTo", {
  // ... your configuration
});
```

## Troubleshooting

### Google Maps Not Loading

1. Check if your API key is valid
2. Verify the Places API is enabled
3. Check browser console for errors
4. Ensure your domain is allowed in API key restrictions

### Search Not Working

1. Verify the API key has Places API access
2. Check network requests in browser dev tools
3. Ensure you're not hitting API quotas

### Backend Integration Issues

1. Check if your backend endpoint is accessible
2. Verify the request format matches your controller
3. Check authentication headers
4. Review backend logs for errors

## Security Notes

- Never commit API keys to version control
- Use environment variables for API keys
- Restrict API keys to specific domains and APIs
- Monitor API usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## API Quotas and Pricing

- Google Places API has usage quotas and pricing
- Monitor your usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
- Consider implementing caching for frequently searched locations

## Support

For issues with:

- **Google Maps API**: Check [Google Maps Platform documentation](https://developers.google.com/maps/documentation)
- **Application code**: Review the component files and error logs
- **Backend integration**: Check your Spring Boot controller and service logs
