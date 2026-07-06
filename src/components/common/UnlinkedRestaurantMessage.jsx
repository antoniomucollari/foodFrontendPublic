import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Store, AlertCircle } from "lucide-react";

const UnlinkedRestaurantMessage = ({ role = "Manager" }) => {
    return (
        <div className="flex items-center justify-center p-6 h-[60vh]">
            <Card className="w-full max-w-md border-2 border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Store className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <CardTitle className="text-xl text-amber-900 dark:text-amber-100">
                        No Restaurant Linked
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Your {role} account is not currently linked to any restaurant.
                        You need to be assigned to a restaurant to view the dashboard and manage operations.
                    </p>

                    <div className="bg-background/50 p-3 rounded-lg flex items-start text-left text-sm text-muted-foreground border border-border/50">
                        <AlertCircle className="h-5 w-5 mr-3 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground mb-1">What should I do?</p>
                            <p>Please contact the Platform Administrator to have your account assigned to a restaurant branch.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UnlinkedRestaurantMessage;
