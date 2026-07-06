import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { userAPI } from "../../services/api";
import { UserCircle } from "lucide-react";

const SidebarUserProfile = ({ profilePath }) => {
    const { data: accountRes, isLoading } = useQuery({
        queryKey: ["own-account-details"],
        queryFn: () => userAPI.getOwnAccountDetails(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const account = accountRes?.data?.data;

    if (isLoading) {
        return (
            <div className="flex items-center px-4 py-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="ml-3 flex-1 min-w-0 space-y-1.5">
                    <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-2.5 w-16 bg-muted animate-pulse rounded" />
                </div>
            </div>
        );
    }

    if (!account) return null;

    // Get primary role display name
    const roleName = account.roles?.[0]?.name || "User";
    const roleDisplay = roleName
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <Link
            to={profilePath}
            className="flex items-center px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer group"
        >
            {/* Avatar */}
            {account.profileUrl ? (
                <img
                    src={account.profileUrl}
                    alt={account.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-border group-hover:ring-primary/50 transition-all"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                    <UserCircle className="h-6 w-6 text-primary" />
                </div>
            )}

            {/* Info */}
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {account.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{roleDisplay}</p>
            </div>
        </Link>
    );
};

export default SidebarUserProfile;
