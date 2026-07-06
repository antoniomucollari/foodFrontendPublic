import React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

const ServerErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  title = "Server Error",
  showDismissButton = false,
  className = "" 
}) => {
  if (!error) return null;

  // Extract error information
  const status = error?.response?.status || error?.status;
  const message = error?.response?.data?.message || error?.message || "An unexpected server error occurred";
  const isServerError = status >= 500;

  if (!isServerError) return null;

  return (
    <Card className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                {title}
              </h3>
              {showDismissButton && onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-2">
              <p className="text-sm text-red-800 dark:text-red-200">
                {message}
              </p>
              {status && (
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Error Code: {status}
                </p>
              )}
            </div>
            {onRetry && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerErrorDisplay;
