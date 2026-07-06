import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, MapPin, Bike, Flame, Store } from "lucide-react";

const RestaurantCard = ({ restaurant, branch, className = "" }) => {
    // Use the provided branch, or fallback to the first branch if sticking to old behavior (though we should always pass branch now)
    const activeBranch = branch || restaurant.branches?.[0];

    if (!activeBranch) return null;

    const hasDeliveryTime = activeBranch.deliveryTime !== null && activeBranch.deliveryTime !== undefined && activeBranch.deliveryTime !== "";
    const hasDistance = activeBranch.distanceInKm !== null && activeBranch.distanceInKm !== undefined && Number(activeBranch.distanceInKm) > 0;
    const hasDeliveryPrice = activeBranch.deliveryPrice !== null && activeBranch.deliveryPrice !== undefined;

    return (
        <Link
            className={`group bg-card rounded-lg md:rounded-3xl shadow-sm md:shadow-lg hover:shadow-md md:hover:shadow-2xl transition-all duration-300 md:duration-500 overflow-hidden border border-border block h-full ${className}`}
            to={`/restaurant-branch/${activeBranch.id}`}
        >
            {/* Cover Image Section */}
            <div className="relative h-32 md:h-40 bg-muted/30 overflow-hidden">
                <img
                    src={restaurant.coverImageUrl || "/vite.svg"}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Dark gradient overlay at the bottom for profile image contrast */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                {activeBranch.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current" />
                        {Number(activeBranch.rating).toFixed(1)}
                    </div>
                )}
                {/* Fire icon for trending branches */}
                {activeBranch.isTrending && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white p-1.5 rounded-full shadow-lg animate-pulse">
                        <Flame className="h-5 w-5 fill-current" />
                    </div>
                )}
                {/* Profile Image - overlapping the cover */}
                <div className="absolute bottom-[0.2rem] left-3 md:left-4 z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-card border-2 border-card shadow-md md:shadow-lg overflow-hidden flex items-center justify-center">
                        {restaurant.profileImageUrl ? (
                            <img
                                src={restaurant.profileImageUrl}
                                alt={`${restaurant.name} logo`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Store className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section - extra top padding to accommodate overlapping profile image */}
            <div className="p-3 pt-6 md:p-4 md:pt-8 space-y-1.5 md:space-y-2">
                <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                    {restaurant.name} <span className="text-muted-foreground font-normal text-sm md:text-base">- {activeBranch.address}</span>
                </h3>

                {(hasDeliveryTime || hasDistance || hasDeliveryPrice) && (
                    <div className="flex flex-wrap items-center justify-between text-sm text-muted-foreground gap-x-2 gap-y-1 md:gap-2">
                        {hasDeliveryTime && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs">{activeBranch.deliveryTime}</span>
                            </div>
                        )}
                        {hasDistance && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="text-xs">{activeBranch.distanceInKm} km</span>
                            </div>
                        )}
                        {hasDeliveryPrice && (
                            <div className="flex items-center gap-1">
                                <Bike className="h-3.5 w-3.5" />
                                <span className="text-xs">{activeBranch.deliveryPrice} ALL</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default RestaurantCard;
