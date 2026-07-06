import React, { useRef } from "react";
import RestaurantCard from "./RestaurantCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

const RestaurantCarousel = ({ title, items, loading }) => {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === "left" ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
            <div className="space-y-2 md:space-y-4 mb-6 md:mb-10">
                <div className="h-6 md:h-8 w-36 md:w-48 bg-muted rounded animate-pulse" />
                <div className="flex gap-2 md:gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="min-w-[236px] md:min-w-[280px] h-[220px] md:h-[260px] bg-muted rounded-lg md:rounded-3xl animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!items?.length) return null;

    return (
        <div className="relative mb-6 md:mb-10 group/carousel">
            <div className="flex items-center justify-between mb-2 md:mb-4 px-0 md:px-1">
                <h2 className="text-lg md:text-2xl font-bold text-foreground">{title}</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="h-8 w-8 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll("right")}
                        className="h-8 w-8 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-2 md:gap-4 overflow-x-auto pb-3 md:pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {items.map((item) => (
                    <div
                        // Use branch ID for key uniqueness
                        key={item.branch.id}
                        className="min-w-[236px] max-w-[236px] md:min-w-[280px] md:max-w-[280px] snap-start"
                    >
                        <RestaurantCard restaurant={item.restaurant} branch={item.branch} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantCarousel;
