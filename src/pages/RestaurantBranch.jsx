import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restaurantBranchAPI, guestAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { MapPin, Phone, Star, Timer, Truck, Search, Plus, Users, Info, ChevronLeft, ChevronRight, X, ShoppingBasket } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { restaurantReviewAPI } from "../services/api";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import BranchMap from "../components/common/BranchMap";

const ReviewsTab = ({ branchId }) => {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated();
  const {
    data: reviewsRes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["restaurant-branch-reviews", branchId],
    queryFn: () =>
        isGuest
            ? guestAPI.getBranchReviews(branchId)
            : restaurantReviewAPI.getBranchReviews(branchId),
  });

  if (isLoading) {
    return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="text-sm text-red-500 text-center py-8">
          {error?.response?.data?.message || "Failed to load reviews."}
        </div>
    );
  }

  const reviews = reviewsRes?.data?.data || [];

  return (
      <div className="space-y-4">
        {reviews.length > 0 ? (
            reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center justify-between">
              <span className="font-semibold">
                {review.userName || "Anonymous"}
              </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                          <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                  ? "text-primary fill-current"
                                  : "text-muted"
                              }`}
                          />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {review.comment}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No reviews yet.
            </p>
        )}
      </div>
  );
};

const daysOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const formatTime = (t) => (t ? t.substring(0, 5) : "");

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartAPI } from "../services/api";
import Basket from "../components/Basket";
import MenuDetailModal from "../components/MenuDetailModal";

const RestaurantBranch = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated();
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('highlights');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMobileBasketOpen, setIsMobileBasketOpen] = useState(false);
  const highlightsRef = useRef(null);
  const categoryRefs = useRef({});
  const sectionRefs = useRef({});
  const categoryNavRef = useRef(null);
  const searchInputRef = useRef(null);

  // Update scroll buttons visibility
  const handleNavScroll = () => {
    if (!categoryNavRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryNavRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    handleNavScroll();
    window.addEventListener('resize', handleNavScroll);
    return () => window.removeEventListener('resize', handleNavScroll);
  }, []);

  const {
    data: detailsRes,
    isLoading: detailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["restaurant-branch-details", id],
    queryFn: () =>
        isGuest
            ? guestAPI.getBranchDetails(id)
            : restaurantBranchAPI.getBranchDetails(id),
  });

  const {
    data: deliveryLocRes,
  } = useQuery({
    queryKey: ["delivery-location"],
    queryFn: () => DeliveryLocationService.getDeliveryLocation(),
    enabled: !isGuest,
  });

  const {
    data: menuRes,
    isLoading: menuLoading,
    error: menuError,
  } = useQuery({
    queryKey: ["restaurant-branch-menu", id],
    queryFn: () =>
        isGuest
            ? guestAPI.getBranchMenu(id)
            : restaurantBranchAPI.getBranchMenu(id),
    enabled: !!detailsRes,
  });

  const { data: basketRes } = useQuery({
    queryKey: ["basket", id],
    queryFn: () => cartAPI.getShoppingCart(id),
    enabled: !isGuest && !!id,
  });

  const {
    data: searchRes,
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ["restaurant-branch-menu-search", id, debouncedSearch],
    queryFn: () =>
        isGuest
            ? guestAPI.getBranchMenu(id, debouncedSearch)
            : restaurantBranchAPI.getBranchMenu(id, debouncedSearch),
    enabled: debouncedSearch.length > 0,
    keepPreviousData: true,
  });

  const addToCartMutation = useMutation({
    mutationFn: (itemData) => cartAPI.addToCart(itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(["basket", id]);
    },
  });

  const openMenuModal = (menuId) => {
    setSelectedMenuId(menuId);
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setSelectedMenuId(null);
    setIsMenuModalOpen(false);
  };

  const handleAddToCartWithOptions = ({ menuId, quantity, options }) => {
    const payload = {
      branchId: parseInt(id),
      branchMenuItemId: menuId,
      quantity,
      options: options || [],
    };
    console.log("Adding to cart with options:", payload);
    addToCartMutation.mutate(payload);
  };

  // Debounce search query by 350ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derive data early so hooks below can reference them safely
  const branch = detailsRes?.data?.data;
  const categories = useMemo(() => menuRes?.data?.data || [], [menuRes?.data?.data]);
  const isSearching = searchQuery.length > 0;
  
  const userLocationData = deliveryLocRes?.data;
  const userLocation = userLocationData ? { lat: userLocationData.latitude, lng: userLocationData.longitude } : null;
  const restaurantLocation = branch?.location ? { lat: branch.location.latitude, lng: branch.location.longitude } : null;

  // Flatten search results into a single list of items with their category names
  const searchCategories = searchRes?.data?.data || [];
  const searchItems = searchCategories.flatMap((cat) =>
      (cat.menus || []).map((item) => ({ ...item, categoryName: cat.name }))
  );

  const basket = basketRes?.data?.data;
  const basketItems = basket?.items || [];
  const basketItemCount = basketItems.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
  );
  const hasBasketItems = basketItemCount > 0;

  // Filter for highlighted items across all categories
  const highlightedItems = categories
      .flatMap((category) => category.menus || [])
      .filter((item) => item.highlighted === true);

  // Scroll-spy: track which category section is currently in view
  useEffect(() => {
    if (!categories.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '-200px 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-category-id');
          if (sectionId) {
            setActiveCategory(sectionId);
            const pill = categoryRefs.current[sectionId];
            if (pill && categoryNavRef.current) {
              pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          }
        }
      });
    }, observerOptions);

    const highlightSection = sectionRefs.current['highlights'];
    if (highlightSection) observer.observe(highlightSection);

    categories.forEach((cat) => {
      const el = sectionRefs.current[String(cat.id)];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  // Check if carousel can scroll in either direction
  const updateScrollButtons = useCallback(() => {
    const el = highlightsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Update scroll buttons on mount and when highlighted items change
  useEffect(() => {
    updateScrollButtons();
  }, [highlightedItems, updateScrollButtons]);

  // Highlights carousel scroll helpers
  const scrollHighlights = useCallback((direction) => {
    if (!highlightsRef.current) return;
    const scrollAmount = 320;
    highlightsRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Click handler for category pills
  const handleCategoryClick = useCallback((e, catId) => {
    e.preventDefault();
    setActiveCategory(catId);
    const target = catId === 'highlights'
        ? sectionRefs.current['highlights']
        : document.getElementById(`cat-${catId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // --- Early returns AFTER all hooks ---
  if (detailsLoading || menuLoading) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
    );
  }

  if (detailsError) {
    return (
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Unable to load branch</h2>
          <p className="text-muted-foreground">
            {detailsError?.response?.data?.message || "Please try again later."}
          </p>
        </div>
    );
  }

  return (
      <div className={`w-full bg-background min-h-screen ${hasBasketItems ? "pb-24 lg:pb-0" : ""}`}>
        {/* Banner Section */}
        <div className="relative h-64 md:h-80 w-full">
          {branch?.coverImageUrl ? (
              <img
                  src={branch.coverImageUrl}
                  alt={`${branch?.restaurantName} cover`}
                  className="w-full h-full object-cover"
              />
          ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-300 to-blue-200" />
          )}
        </div>

        <div className="w-full lg:max-w-7xl lg:mx-auto lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">

            {/* Main Content Column */}
            <div className="lg:col-span-2">

              {/* Header Info Block */}
              <div className="relative px-4 pb-6 border-b">
                {/* Overlapping Logo */}
                <div className="absolute -top-[9rem] left-4 md:left-0 z-10">
                  <div className="w-32 h-32 rounded-lg bg-white shadow-md p-1 flex items-center justify-center overflow-hidden border">
                    {branch?.profileImageUrl ? (
                        <img
                            src={branch.profileImageUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                          {branch?.restaurantName?.charAt(0)}
                        </div>
                    )}
                  </div>
                </div>

                {/* Text Content */}
                <div className="mt-20 md:ml-0 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight flex flex-wrap items-baseline gap-x-2 md:gap-x-3">
                        <span>{branch?.restaurantName}</span>
                        {branch?.address && (
                          <span className="text-xl md:text-2xl font-semibold text-muted-foreground">
                            {branch.address}
                          </span>
                        )}
                      </h1>
                      {(branch?.desc || branch?.description) && (
                        <p className="text-base md:text-lg font-medium text-muted-foreground mt-1 md:mt-1.5">
                          {branch.desc || branch.description}
                        </p>
                      )}
                      <TooltipProvider>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-muted-foreground mt-3 md:flex md:items-center md:gap-2">
                          {branch?.averageRating != null && (
                              <>
                                <div className="flex items-center text-orange-500 font-bold min-w-0">
                                  <Star className="h-4 w-4 fill-current mr-1" />
                                  <span>
                                {Number(branch.averageRating).toFixed(1)}
                                    <span className="text-muted-foreground font-normal ml-1">
                                  ({branch.reviewCount || 0}+)
                                </span>
                              </span>
                                </div>
                              </>
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                          <span className="leading-tight">{branch?.deliveryRadiusInKm ? `${branch.deliveryRadiusInKm} km` : 'Free'} delivery</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center cursor-pointer hover:text-foreground shrink-0">
                                <Info className="h-4 w-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This is the maximum delivery distance for this restaurant.</p>
                            </TooltipContent>
                          </Tooltip>
                          </div>
                          <div className="col-span-2 flex items-center gap-2 min-w-0 md:col-span-1">
                          <span className="leading-tight">min order amount: {branch.minOrderAmount}ALL</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center cursor-pointer hover:text-foreground shrink-0">
                                <Info className="h-4 w-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The minimum total cost of items required to place an order.</p>
                            </TooltipContent>
                          </Tooltip>
                          </div>
                        </div>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-3">
                      {Array.isArray(branch?.openingHours) && branch.openingHours.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="secondary" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0 gap-2">
                                <Info className="h-4 w-4" />
                                About Us
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>About</DialogTitle>
                              </DialogHeader>
                              <Tabs defaultValue="info" className="mt-2">
                                <TabsList>
                                  <TabsTrigger value="info">Info</TabsTrigger>
                                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info">
                                  <div className="mt-2 space-y-4">
                                    {(restaurantLocation || userLocation) && (
                                        <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border">
                                          <BranchMap 
                                              restaurantLocation={restaurantLocation}
                                              deliveryRadiusInKm={branch?.deliveryRadiusInKm}
                                              userLocation={userLocation}
                                          />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                      {branch.openingHours
                                          .slice()
                                          .sort((a, b) =>
                                              daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek)
                                          )
                                          .map((oh) => (
                                              <div
                                                  key={oh.dayOfWeek}
                                                  className="flex items-center justify-between border-b pb-2"
                                              >
                                        <span className="font-medium">
                                          {oh.dayOfWeek.charAt(0) + oh.dayOfWeek.slice(1).toLowerCase()}
                                        </span>
                                                <span className="text-muted-foreground">
                                          {formatTime(oh.openTime)} - {formatTime(oh.closeTime)}
                                        </span>
                                              </div>
                                          ))}
                                    </div>
                                  </div>
                                </TabsContent>
                                <TabsContent value="reviews">
                                  <ReviewsTab branchId={id} />
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Sticky Navigation & Search */}
              <div className="sticky top-16 z-40 bg-background pt-4 pb-2 px-4 border-b">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search in ${branch?.restaurantName || 'menu'}`}
                      className="pl-10 pr-10 h-12 rounded-full border-input bg-card shadow-sm text-base focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                  )}
                </div>

                {/* Categories Pills — hidden while searching */}
                {!isSearching && (
                    <div className="relative group flex items-center">
                      {canScrollLeft && (
                          <button 
                              onClick={() => categoryNavRef.current.scrollBy({ left: -200, behavior: 'smooth' })} 
                              className="absolute left-0 z-10 p-1.5 bg-background/90 backdrop-blur-sm border shadow-sm rounded-full text-muted-foreground hover:text-foreground transition-all"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                      )}
                      
                      <div 
                          ref={categoryNavRef} 
                          onScroll={handleNavScroll}
                          className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full px-1"
                      >
                        <button
                            ref={(el) => (categoryRefs.current['highlights'] = el)}
                            onClick={(e) => handleCategoryClick(e, 'highlights')}
                            className={`rounded-full h-8 px-4 text-sm font-bold shrink-0 transition-colors ${activeCategory === 'highlights'
                                ? 'bg-foreground text-background'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                        >
                          Highlights
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                ref={(el) => (categoryRefs.current[String(category.id)] = el)}
                                onClick={(e) => handleCategoryClick(e, String(category.id))}
                                className={`rounded-full h-8 px-4 text-sm font-semibold shrink-0 whitespace-nowrap transition-colors ${activeCategory === String(category.id)
                                    ? 'bg-foreground text-background'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                              {category.name}
                            </button>
                        ))}
                      </div>

                      {canScrollRight && (
                          <button 
                              onClick={() => categoryNavRef.current.scrollBy({ left: 200, behavior: 'smooth' })} 
                              className="absolute right-0 z-10 p-1.5 bg-background/90 backdrop-blur-sm border shadow-sm rounded-full text-muted-foreground hover:text-foreground transition-all"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                      )}
                    </div>
                )}
              </div>

              {/* Menu Sections */}
              <div className="px-4 py-6 space-y-10 min-h-[500px]">
                {!isSearching && menuError && (
                    <div className="text-sm text-red-500">
                      {menuError?.response?.data?.message || "Failed to load menu."}
                    </div>
                )}

                {/* ── Search Results ── */}
                {isSearching && (
                    <div className="space-y-3">
                      {searchLoading && debouncedSearch && (
                          <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                          </div>
                      )}
                      {!searchLoading && searchItems.length === 0 && debouncedSearch && (
                          <p className="text-sm text-muted-foreground text-center py-10">
                            No results for &ldquo;{debouncedSearch}&rdquo;
                          </p>
                      )}
                      {searchItems.map((item) => (
                          <div
                              key={item.id}
                              className="border-b border-border p-4 flex items-start gap-4 bg-background hover:bg-muted/30 transition-colors cursor-pointer group md:border md:rounded-xl md:bg-card md:shadow-sm md:hover:shadow-md"
                              onClick={() => openMenuModal(item.menuId || item.id)}
                          >
                            <div className="flex-1 space-y-1 min-w-0">
                              <p className="text-xs text-muted-foreground font-medium">{item.categoryName}</p>
                              <h3 className="font-bold text-base leading-tight">{item.name}</h3>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-semibold">{Number(item.price).toFixed(2)} ALL</p>
                                {!item.imageUrl && !isGuest && (
                                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                              </div>
                              {item.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {item.description}
                                  </p>
                              )}
                            </div>
                            {item.imageUrl && (
                                <div className="relative h-24 w-28 bg-white dark:bg-transparent rounded-lg overflow-hidden shrink-0">
                                  <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                                  />
                                  <Button
                                      size="icon"
                                      className={`absolute bottom-1 right-1 rounded-full h-7 w-7 transition-opacity shadow-lg ${isGuest ? 'hidden' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                )}

                {/* ── Normal Menu (hidden while searching) ── */}
                {!isSearching && (
                    <>

                      {/* Highlights Section */}
                      {highlightedItems.length > 0 && (
                          <section
                              ref={(el) => (sectionRefs.current['highlights'] = el)}
                              data-category-id="highlights"
                              className="scroll-mt-48"
                          >
                            <h2 className="text-2xl font-extrabold mb-6">Highlights</h2>
                            <div className="relative group/carousel">
                              {/* Left Arrow */}
                              {canScrollLeft && (
                                  <button
                                      onClick={() => scrollHighlights('left')}
                                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-10 w-10 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
                                      aria-label="Scroll left"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                              )}
                              {/* Right Arrow */}
                              {canScrollRight && (
                                  <button
                                      onClick={() => scrollHighlights('right')}
                                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-10 w-10 rounded-full bg-background border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
                                      aria-label="Scroll right"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                              )}

                              <div
                                  ref={highlightsRef}
                                  className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                  onScroll={updateScrollButtons}
                              >
                                {highlightedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="min-w-[calc(100vw-2rem)] border-b border-border p-4 flex gap-4 items-start bg-background hover:bg-muted/30 transition-colors cursor-pointer group md:min-w-[300px] md:border md:rounded-xl md:bg-card md:shadow-sm md:hover:shadow-md"
                                        onClick={() => openMenuModal(item.menuId || item.id)}
                                    >
                                      {item.imageUrl && (
                                          <div className="order-2 h-24 w-28 bg-white dark:bg-transparent rounded-lg shrink-0 overflow-hidden relative md:order-none md:w-24">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-full w-full object-cover mix-blend-multiply dark:mix-blend-normal"
                                            />
                                          </div>
                                      )}
                                      <div className="flex-1 min-w-0 self-stretch flex flex-col justify-between py-1">
                                        <div>
                                          <div className="font-bold truncate text-base">{item.name}</div>
                                          <div className="text-sm text-muted-foreground line-clamp-2 leading-tight mt-1">
                                            {item.description}
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                          <div className="font-bold">ALL {Number(item.price).toFixed(2)}</div>
                                          <Button
                                              size="icon"
                                              variant="secondary"
                                              className={`h-8 w-8 rounded-full shrink-0 shadow-sm ${isGuest ? 'hidden' : ''}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                ))}
                              </div>
                            </div>
                          </section>
                      )}

                      {categories.map((category) => (
                          <section
                              key={category.id}
                              id={`cat-${category.id}`}
                              ref={(el) => (sectionRefs.current[String(category.id)] = el)}
                              data-category-id={String(category.id)}
                              className="scroll-mt-48"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h2 className="text-2xl font-extrabold">{category.name}</h2>
                              <span className="text-sm text-muted-foreground">{(category.menus || []).length} items</span>
                            </div>
                            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4">
                              {(category.menus || []).map((item) => (
                                  <div
                                      key={item.id}
                                      className="border-b border-border rounded-none p-4 flex flex-row items-start gap-3 bg-background shadow-none hover:bg-muted/30 transition-colors cursor-pointer group md:border md:rounded-xl md:bg-card md:shadow-sm md:hover:shadow-md"
                                      onClick={() => openMenuModal(item.menuId || item.id)}
                                  >
                                    <div className="flex-1 space-y-2 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-base leading-tight md:text-lg">{item.name}</h3>
                                      </div>
                                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                                        {item.description}
                                      </p>
                                      <div className="flex items-center justify-between pt-2">
                                        <div className="font-bold text-lg">
                                          {Number(item.price).toFixed(2)} ALL
                                        </div>
                                        {!item.imageUrl && !isGuest && (
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                        )}
                                      </div>
                                    </div>

                                    {item.imageUrl && (
                                        <div className="relative h-24 w-28 md:h-32 md:w-32 bg-white dark:bg-transparent rounded-lg overflow-hidden shrink-0">
                                          <img
                                              src={item.imageUrl}
                                              alt={item.name}
                                              className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                                          />
                                          <Button
                                              size="icon"
                                              className={`absolute bottom-2 right-2 rounded-full h-8 w-8 transition-opacity shadow-lg ${isGuest ? 'hidden' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
                                          >
                                            <Plus className="h-5 w-5" />
                                          </Button>
                                        </div>
                                    )}
                                  </div>
                              ))}
                            </div>
                          </section>
                      ))}
                    </>
                )}

              </div>
            </div>

            {/* Right Column: Basket (hidden for guests) */}
            {!isGuest && (
                <div className="hidden lg:block relative z-30">
                  <div className="sticky top-16 pt-8 pr-4 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
                    <Basket branchId={id} />
                  </div>
                </div>
            )}

            {/* Guest Login Prompt */}
            {isGuest && (
                <div className="hidden lg:block relative z-30">
                  <div className="sticky top-16 pt-8 pr-4">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">Want to order?</h3>
                      <p className="text-sm text-muted-foreground">Log in or create an account to add items to your cart and place orders.</p>
                      <div className="space-y-2">
                        <Link
                            to="/login"
                            className="block w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Log In
                        </Link>
                        <Link
                            to="/register"
                            className="block w-full bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-secondary/80 transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
            )}

          </div>
        </div>

        {/* Menu Detail Modal */}
        {!isGuest && hasBasketItems && (
            <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
              <Button
                  className="grid h-12 w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-full px-5 text-base font-bold"
                  onClick={() => setIsMobileBasketOpen(true)}
              >
                <span className="relative inline-flex items-center justify-self-start">
                  <ShoppingBasket className="h-5 w-5" />
                  <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-background px-1 text-xs font-bold text-foreground">
                    {basketItemCount}
                  </span>
                </span>
                <span className="justify-self-center whitespace-nowrap">View basket</span>
                <span className="justify-self-end whitespace-nowrap">
                  {Number(basket?.subtotal || 0).toFixed(2)} ALL
                </span>
              </Button>
            </div>
        )}

        {!isGuest && hasBasketItems && isMobileBasketOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <button
                  className="absolute inset-0 bg-black/45"
                  aria-label="Close basket"
                  onClick={() => setIsMobileBasketOpen(false)}
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-background p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold">Basket</h2>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setIsMobileBasketOpen(false)}
                      aria-label="Close basket"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Basket branchId={id} />
              </div>
            </div>
        )}

        <MenuDetailModal
            isOpen={isMenuModalOpen}
            onClose={closeMenuModal}
            menuId={selectedMenuId}
            branchId={id}
            onAddToCart={handleAddToCartWithOptions}
            readOnly={isGuest}
        />
      </div>
  );
};

export default RestaurantBranch;
