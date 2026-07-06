import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restaurantsAPI, guestAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Search, Star, Info, ChefHat, SlidersHorizontal, X } from "lucide-react";
import RestaurantCard from "../components/common/RestaurantCard";
import RestaurantCarousel from "../components/common/RestaurantCarousel";
import FilterRadioDropdown from "../components/common/FilterRadioDropdown";

// ─── Wolt-style Category Scroller ────────────────────────────────────────────
const CategoryScroller = ({ categories, selectedCategory, setSelectedCategory }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el && el.removeEventListener("scroll", updateArrows);
  }, [categories, updateArrows]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-bold text-foreground">Browse by category</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`h-8 w-8 rounded-full border border-border flex items-center justify-center transition-all
              ${canScrollLeft
                ? "bg-background text-foreground hover:bg-accent shadow-sm"
                : "opacity-30 cursor-default bg-background text-foreground"
              }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`h-8 w-8 rounded-full border border-border flex items-center justify-center transition-all
              ${canScrollRight
                ? "bg-background text-foreground hover:bg-accent shadow-sm"
                : "opacity-30 cursor-default bg-background text-foreground"
              }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >


        {/* Category items */}
        {categories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(isActive ? null : category.id)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 overflow-hidden transition-all
                ${isActive
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border group-hover:border-primary/50"
                }`}
              >
                {category.restaurantImageUrl ? (
                  <img
                    src={category.restaurantImageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ChefHat className={`h-7 w-7 md:h-8 md:w-8 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                  </div>
                )}
              </div>
              <span className={`text-[11px] md:text-xs font-medium text-center leading-tight max-w-[72px] md:max-w-[80px] line-clamp-1 transition-colors
                ${isActive ? "text-primary" : "text-foreground"}`}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── Brands Scroller (Top Brands) ─────────────────────────────────────────────
const BrandsScroller = ({ brands, selectedBrand, setSelectedBrand }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el && el.removeEventListener("scroll", updateArrows);
  }, [brands, updateArrows]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (!brands || brands.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
          Top brands <span className="text-yellow-500">✨</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`h-8 w-8 rounded-full border border-border flex items-center justify-center transition-all
              ${canScrollLeft
                ? "bg-background text-foreground hover:bg-accent shadow-sm"
                : "opacity-30 cursor-default bg-background text-foreground"
              }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`h-8 w-8 rounded-full border border-border flex items-center justify-center transition-all
              ${canScrollRight
                ? "bg-background text-foreground hover:bg-accent shadow-sm"
                : "opacity-30 cursor-default bg-background text-foreground"
              }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {brands.map((brand) => {
          const isActive = selectedBrand === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(isActive ? null : brand.id)}
              className={`flex flex-col w-[120px] sm:w-[140px] shrink-0 rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md snap-start
                ${isActive ? "ring-2 ring-primary border-primary scale-[1.02]" : "border-border"}`}
            >
              {/* Brand Logo Container (Solid White Background for perfect logo nesting) */}
              <div className="w-full aspect-square bg-white flex items-center justify-center p-3 relative">
                {brand.profileImageUrl ? (
                  <img
                    src={brand.profileImageUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {brand.name?.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Brand Name Footer Bar (Dark / Sleek Background matching user styling) */}
              <div className="w-full py-2 px-3 bg-secondary/80 dark:bg-secondary/40 border-t border-border flex items-center justify-center">
                <span className="text-[11px] font-bold text-foreground truncate max-w-full text-center">
                  {brand.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const SquareFilterOption = ({ name, checked, onChange, children }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
    />
    <span className="flex h-5 w-5 items-center justify-center rounded-[5px] border border-border bg-background transition-colors peer-checked:border-primary peer-checked:bg-primary/10">
      <span className="h-2.5 w-2.5 rounded-[3px] bg-primary opacity-0 scale-75 transition-all peer-checked:opacity-100 peer-checked:scale-100" />
    </span>
    <span className="text-sm">{children}</span>
  </label>
);

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const { isAuthenticated } = useAuth();

  // Get guest location from localStorage for unauthenticated users
  const guestLocation = useMemo(() => {
    try {
      const stored = localStorage.getItem("userLocation");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          lat: parsed.coordinates?.lat || parsed.lat,
          lng: parsed.coordinates?.lng || parsed.lng,
        };
      }
    } catch (e) {
      console.error("Error parsing guest location:", e);
    }
    return null;
  }, []);

  const isGuest = !isAuthenticated();

  // Initialize state from URL params
  const getParam = (key, defaultValue = null) => {
    const value = searchParams.get(key);
    if (value === null) return defaultValue;
    if (key === "page") return parseInt(value) || 0;
    if (key === "size") return parseInt(value) || 10;
    if (key === "minRating") return value || "";
    if (key === "minOrderAmount") return value ? parseInt(value) : null;
    if (key === "categoryId") return value ? parseInt(value) : null;
    if (key === "restaurantId") return value ? parseInt(value) : null;
    if (key === "isNew") {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }
    if (key === "isFeatured") {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    }
    if (key === "maxPrepTime") return value ? parseInt(value) : null;
    return value || defaultValue;
  };

  const [selectedCategory, setSelectedCategory] = useState(() =>
    getParam("categoryId")
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(() =>
    getParam("restaurantId")
  );
  const [searchTerm, setSearchTerm] = useState(() => getParam("search", ""));
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() =>
    getParam("search", "")
  );
  const [minRating, setMinRating] = useState(() => getParam("minRating", ""));
  const [hoverRating, setHoverRating] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isNew, setIsNew] = useState(() => getParam("isNew"));
  const [isFeatured, setIsFeatured] = useState(() => getParam("isFeatured"));
  const [minOrderAmount, setMinOrderAmount] = useState(() =>
    getParam("minOrderAmount")
  );
  const [maxPrepTime, setMaxPrepTime] = useState(() => getParam("maxPrepTime"));

  const [customMinOrder, setCustomMinOrder] = useState(() => {
    const val = getParam("minOrderAmount");
    return ![null, 400, 700].includes(val) && val !== null ? val : "";
  });
  const [customMaxPrep, setCustomMaxPrep] = useState(() => {
    const val = getParam("maxPrepTime");
    return ![null, 10, 20, 30].includes(val) && val !== null ? val : "";
  });

  // Debounce custom min order
  useEffect(() => {
    if (customMinOrder !== "" && customMinOrder !== null) {
      const timer = setTimeout(() => {
        setMinOrderAmount(parseInt(customMinOrder) || null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customMinOrder]);

  // Debounce custom max prep
  useEffect(() => {
    if (customMaxPrep !== "" && customMaxPrep !== null) {
      const timer = setTimeout(() => {
        setMaxPrepTime(parseInt(customMaxPrep) || null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customMaxPrep]);
  const [sort, setSort] = useState(() => getParam("sort", ""));
  const [page, setPage] = useState(() => getParam("page", 0));
  const [size] = useState(() => getParam("size", 10));

  // Infinite scroll state for normal (non-filtered) restaurants
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [normalPage, setNormalPage] = useState(0);
  const [normalTotalPages, setNormalTotalPages] = useState(0);
  const [normalTotalElements, setNormalTotalElements] = useState(0);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [filteredTotalPages, setFilteredTotalPages] = useState(0);
  const [filteredTotalElements, setFilteredTotalElements] = useState(0);
  const sentinelRef = useRef(null);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const filteredHasMoreRef = useRef(true);
  const filteredFetchingRef = useRef(false);

  // Determine if any filter is active
  const isAnyFilterActive =
    !!debouncedSearchTerm ||
    !!selectedCategory ||
    !!selectedRestaurantId ||
    !!minRating ||
    isNew === true ||
    isFeatured === true ||
    minOrderAmount !== null ||
    maxPrepTime !== null ||
    (sort !== "" && sort !== "best_match");

  // Track previous filter values to reset page when filters change
  const prevFiltersRef = useRef({
    debouncedSearchTerm,
    sort,
    selectedCategory,
    selectedRestaurantId,
    minRating,
    isNew,
    isFeatured,
    minOrderAmount,
    maxPrepTime,
  });

  // Reset page when filters change
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.debouncedSearchTerm !== debouncedSearchTerm ||
      prevFilters.sort !== sort ||
      prevFilters.selectedCategory !== selectedCategory ||
      prevFilters.selectedRestaurantId !== selectedRestaurantId ||
      prevFilters.minRating !== minRating ||
      prevFilters.isNew !== isNew ||
      prevFilters.isFeatured !== isFeatured ||
      prevFilters.minOrderAmount !== minOrderAmount ||
      prevFilters.maxPrepTime !== maxPrepTime;

    if (filtersChanged) {
      setFilteredRestaurants([]);
      setFilteredTotalPages(0);
      setFilteredTotalElements(0);
      filteredHasMoreRef.current = true;
      if (page !== 0) {
        setPage(0);
      }
    }
    prevFiltersRef.current = {
      debouncedSearchTerm,
      sort,
      selectedCategory,
      selectedRestaurantId,
      minRating,
      isNew,
      isFeatured,
      minOrderAmount,
      maxPrepTime,
    };
  }, [
    debouncedSearchTerm,
    sort,
    selectedCategory,
    selectedRestaurantId,
    minRating,
    isNew,
    isFeatured,
    minOrderAmount,
    maxPrepTime,
    page,
  ]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (sort) params.set("sort", sort);
    if (selectedCategory) params.set("categoryId", selectedCategory.toString());
    if (selectedRestaurantId) params.set("restaurantId", selectedRestaurantId.toString());
    if (minRating) params.set("minRating", minRating);
    if (isNew !== undefined && isNew !== null)
      params.set("isNew", isNew.toString());
    if (isFeatured !== undefined && isFeatured !== null)
      params.set("isFeatured", isFeatured.toString());
    if (minOrderAmount !== null && minOrderAmount !== undefined)
      params.set("minOrderAmount", minOrderAmount.toString());
    if (maxPrepTime !== null && maxPrepTime !== undefined)
      params.set("maxPrepTime", maxPrepTime.toString());
    if (page > 0) params.set("page", page.toString());
    if (size !== 10) params.set("size", size.toString());

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearchTerm,
    sort,
    selectedCategory,
    selectedRestaurantId,
    minRating,
    isNew,
    isFeatured,
    minOrderAmount,
    maxPrepTime,
    page,
    size,
    setSearchParams,
  ]);

  // Sync state from URL params
  useEffect(() => {
    const categoryId = getParam("categoryId");
    const restaurantId = getParam("restaurantId");
    const search = getParam("search", "");
    const rating = getParam("minRating", "");
    const newValue = getParam("isNew");
    const featuredValue = getParam("isFeatured");
    const orderAmount = getParam("minOrderAmount");
    const prepTime = getParam("maxPrepTime");
    const sortValue = getParam("sort", "");
    const pageValue = getParam("page", 0);

    if (categoryId !== selectedCategory) setSelectedCategory(categoryId);
    if (restaurantId !== selectedRestaurantId) setSelectedRestaurantId(restaurantId);
    if (search !== searchTerm) {
      setSearchTerm(search);
      setDebouncedSearchTerm(search);
    }
    if (rating !== minRating) setMinRating(rating);
    if (newValue !== isNew) setIsNew(newValue);
    if (featuredValue !== isFeatured) setIsFeatured(featuredValue);
    if (orderAmount !== minOrderAmount) setMinOrderAmount(orderAmount);
    if (prepTime !== maxPrepTime) setMaxPrepTime(prepTime);
    if (sortValue !== sort) setSort(sortValue);
    if (pageValue !== page) setPage(pageValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Use this helper to flatten restaurant data into individual branches
  const flattenRestaurants = (restaurants) => {
    return restaurants.flatMap((restaurant) =>
      (restaurant.branches || []).map((branch) => ({
        restaurant,
        branch,
      }))
    );
  };

  // Fetch restaurant categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["restaurant-categories"],
    queryFn: () =>
      isGuest
        ? guestAPI.getRestaurantCategories()
        : restaurantsAPI.getRestaurantCategories(),
  });

  // --- CAROUSEL AND MAIN QUERIES ---

  // Helper: call the right API depending on auth state
  const fetchRestaurants = useCallback(
    (params) => {
      if (isGuest && guestLocation) {
        return guestAPI.getAvailableRestaurants(
          guestLocation.lat,
          guestLocation.lng,
          params
        );
      }
      return restaurantsAPI.getAvailableRestaurants(params);
    },
    [isGuest, guestLocation]
  );

  // Helper: call the new dashboard API when NOT filtering
  const fetchDashboardData = useCallback(
    () => {
      if (isGuest && guestLocation) {
        return guestAPI.getAvailableRestaurantsDashboard(
          guestLocation.lat,
          guestLocation.lng
        );
      }
      return restaurantsAPI.getAvailableRestaurantsDashboard();
    },
    [isGuest, guestLocation]
  );

  const fetchSelectedRestaurantBranches = useCallback(
    (restaurantId) => {
      if (isGuest) {
        return guestAPI.searchByRestaurant(restaurantId);
      }
      return restaurantsAPI.searchByRestaurant(restaurantId);
    },
    [isGuest]
  );

  // Separate paginated query for the main grid when no filters are active
  const { data: normalRestaurantsData, isFetching: normalRestaurantsFetching } = useQuery({
    queryKey: ["normal-restaurants", normalPage, isGuest, guestLocation?.lat, guestLocation?.lng],
    queryFn: () => fetchRestaurants({ page: normalPage, size: 10 }),
    keepPreviousData: true,
    enabled: !isAnyFilterActive && normalPage > 0,
  });

  // Accumulate pages into allRestaurants
  useEffect(() => {
    if (normalRestaurantsData?.data?.data) {
      const page = normalRestaurantsData.data.data;
      setNormalTotalPages(page.totalPages || 0);
      setNormalTotalElements(page.totalElements || 0);
      hasMoreRef.current = !page.last;
      setAllRestaurants(prev => [...prev, ...(page.content || [])]);
    }
  }, [normalRestaurantsData, normalPage]);

  // Reset infinite scroll when filters are toggled off (coming from filtered state)
  const wasFiltered = useRef(isAnyFilterActive);
  useEffect(() => {
    if (wasFiltered.current && !isAnyFilterActive) {
      setNormalPage(0);
      setAllRestaurants([]);
    }
    wasFiltered.current = isAnyFilterActive;
  }, [isAnyFilterActive]);

  // IntersectionObserver for infinite scroll
  fetchingRef.current = normalRestaurantsFetching;
  useEffect(() => {
    if (isAnyFilterActive || allRestaurants.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !fetchingRef.current) {
          setNormalPage(prev => prev + 1);
        }
      },
      { rootMargin: "400px" }
    );

    const el = sentinelRef.current;
    if (!el) return;
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isAnyFilterActive, allRestaurants.length]);

  const queryParams = {
    page,
    size,
    search: debouncedSearchTerm || undefined,
    sort: sort || undefined,
    isNew,
    isFeatured,
    restaurantId: selectedRestaurantId || undefined,
  };
  if (minRating !== "") queryParams.minRating = parseFloat(minRating);
  if (minOrderAmount !== null) queryParams.minOrderAmount = minOrderAmount;
  if (maxPrepTime !== null) queryParams.maxPrepTime = maxPrepTime;
  if (selectedCategory) queryParams.categoryId = selectedCategory;

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard-restaurants", isGuest, guestLocation?.lat, guestLocation?.lng],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isAnyFilterActive || !dashboardData?.data?.data?.normal) return;

    const normal = dashboardData.data.data.normal;
    setAllRestaurants(normal.content || []);
    setNormalTotalPages(normal.totalPages || 0);
    setNormalTotalElements(normal.totalElements || 0);
    hasMoreRef.current = !normal.last;
    setNormalPage(0);
  }, [dashboardData, isAnyFilterActive]);

  const {
    data: restaurantsData,
    isLoading: restaurantsLoading,
    isFetching: restaurantsFetching,
  } = useQuery({
    queryKey: [
      "available-restaurants",
      page,
      size,
      debouncedSearchTerm,
      minRating,
      isNew,
      isFeatured,
      minOrderAmount,
      maxPrepTime,
      sort,
      selectedCategory,
      selectedRestaurantId,
      isGuest,
      guestLocation?.lat,
      guestLocation?.lng,
    ],
    queryFn: () => fetchRestaurants(queryParams),
    keepPreviousData: true,
    enabled: isAnyFilterActive && !selectedRestaurantId,
  });

  useEffect(() => {
    if (!isAnyFilterActive || selectedRestaurantId || !restaurantsData?.data?.data) return;

    const restaurantsPage = restaurantsData.data.data;
    setFilteredTotalPages(restaurantsPage.totalPages || 0);
    setFilteredTotalElements(restaurantsPage.totalElements || 0);
    filteredHasMoreRef.current = !restaurantsPage.last;

    if (page === 0) {
      setFilteredRestaurants(restaurantsPage.content || []);
    } else {
      setFilteredRestaurants(prev => [...prev, ...(restaurantsPage.content || [])]);
    }
  }, [restaurantsData, page, isAnyFilterActive, selectedRestaurantId]);

  filteredFetchingRef.current = restaurantsFetching;
  useEffect(() => {
    if (!isAnyFilterActive || selectedRestaurantId || filteredRestaurants.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && filteredHasMoreRef.current && !filteredFetchingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: "400px" }
    );

    const el = sentinelRef.current;
    if (!el) return;
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isAnyFilterActive, selectedRestaurantId, filteredRestaurants.length]);

  const { data: selectedRestaurantData, isLoading: selectedRestaurantLoading } = useQuery({
    queryKey: ["restaurant-branches", selectedRestaurantId, isGuest],
    queryFn: () => fetchSelectedRestaurantBranches(selectedRestaurantId),
    enabled: !!selectedRestaurantId,
  });

  const categories = categoriesData?.data?.data || [];
  const topBrands = useMemo(() => {
    if (!dashboardData?.data?.data) return [];
    const data = dashboardData.data.data;
    const allLists = [
      ...(data.normal?.content || []),
      ...(data.topRated?.content || []),
      ...(data.fastest?.content || []),
      ...(data.trending?.content || []),
    ];
    
    // De-duplicate by restaurant ID
    const seen = new Set();
    const uniqueBrands = [];
    for (const r of allLists) {
      if (r && r.id && !seen.has(r.id)) {
        seen.add(r.id);
        uniqueBrands.push({
          id: r.id,
          name: r.name,
          profileImageUrl: r.profileImageUrl,
        });
      }
    }
    return uniqueBrands;
  }, [dashboardData]);
  const sortOptions = useMemo(
    () => [
      { label: "Recommended", value: "" },
      { label: "Rating", value: "rating" },
      { label: "Earliest arrival", value: "time" },
    ],
    []
  );

  let restaurantsPage;
  let restaurantList = [];

  const selectedRestaurant = selectedRestaurantData?.data?.data;

  if (selectedRestaurantId) {
    restaurantsPage = {
      totalElements: selectedRestaurant?.branches?.length || 0,
      totalPages: 1,
      number: 0,
      last: true,
    };
    restaurantList = selectedRestaurant ? [selectedRestaurant] : [];
  } else if (isAnyFilterActive) {
    restaurantsPage = { totalElements: filteredTotalElements, totalPages: filteredTotalPages };
    restaurantList = filteredRestaurants;
  } else {
    restaurantsPage = { totalElements: normalTotalElements, totalPages: normalTotalPages };
    restaurantList = allRestaurants;
  }

  // Since we are showing branches, the "total elements" from backend (restaurants)
  // doesn't exactly match visible cards (branches).
  // Ideally backend should return branches, but for now we display multiple cards if one restaurant has multiple branches.
  const totalRestaurants = restaurantsPage?.totalElements || 0;

  // Flatten the data for display
  const mainGridItems = flattenRestaurants(restaurantList);
  const localHeroesItems = flattenRestaurants(
    dashboardData?.data?.data?.topRated?.content || []
  );
  const inAHurryItems = flattenRestaurants(
    dashboardData?.data?.data?.fastest?.content || []
  );
  const trendingItems = flattenRestaurants(
    dashboardData?.data?.data?.trending?.content || []
  );

  const isInitialLoading = selectedRestaurantId
    ? (!selectedRestaurantData && selectedRestaurantLoading)
    : isAnyFilterActive
      ? (!restaurantsData && restaurantsLoading)
      : (!dashboardData && dashboardLoading);

  if (categoriesLoading && isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex gap-6 px-0 py-3 md:px-4 md:py-6 max-w-[1600px] mx-auto">
        {/* Left Sidebar - Filters */}
        <aside
          className={`${isMobileFiltersOpen ? "fixed inset-0 z-50 block bg-black/40 p-3" : "hidden"} lg:sticky lg:top-24 lg:z-auto lg:block lg:h-fit lg:w-1/4 lg:min-w-[280px] lg:bg-transparent lg:p-0`}
        >
          <div className="max-h-[calc(100vh-1.5rem)] space-y-6 overflow-y-auto rounded-lg bg-background p-5 shadow-2xl lg:max-h-none lg:overflow-visible lg:bg-muted/30 lg:p-6 lg:shadow-none">
            <div className="mb-5 flex items-center justify-between lg:mb-0">
              <div className="text-sm font-medium text-foreground">
                {totalRestaurants} places (showing branches)
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full lg:hidden"
                onClick={() => setIsMobileFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="new" className="text-sm font-normal">
                  New
                </Label>
                <Switch
                  id="new"
                  checked={isNew === true}
                  onCheckedChange={(checked) =>
                    setIsNew(checked ? true : undefined)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="text-sm font-normal">
                  Featured
                </Label>
                <Switch
                  id="featured"
                  checked={isFeatured === true}
                  onCheckedChange={(checked) =>
                    setIsFeatured(checked ? true : undefined)
                  }
                />
              </div>
            </div>

            {/* Minimum Order Amount */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  Minimum order amount
                </Label>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden w-max max-w-[220px] bg-popover text-popover-foreground text-xs rounded-md px-3 py-2 shadow-md group-hover:block z-50 text-center border border-border">
                    Set a limit on how much the minimum order requirement can be.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <SquareFilterOption
                  name="minOrder"
                  checked={minOrderAmount === null}
                  onChange={() => { setMinOrderAmount(null); setCustomMinOrder(""); }}
                >
                  Show all
                </SquareFilterOption>
                <SquareFilterOption
                  name="minOrder"
                  checked={minOrderAmount === 400}
                  onChange={() => { setMinOrderAmount(400); setCustomMinOrder(""); }}
                >
                  400 ALL or less
                </SquareFilterOption>
                <SquareFilterOption
                  name="minOrder"
                  checked={minOrderAmount === 700}
                  onChange={() => { setMinOrderAmount(700); setCustomMinOrder(""); }}
                >
                  700 ALL or less
                </SquareFilterOption>

                {/* Custom Minimum Order Amount Input */}
                <div className="flex items-center gap-2 pt-1">
                  <SquareFilterOption
                    name="minOrder"
                    checked={![null, 400, 700].includes(minOrderAmount) && minOrderAmount !== undefined}
                    onChange={() => {
                      if (![null, 400, 700].includes(minOrderAmount)) return;
                      setMinOrderAmount('');
                      setCustomMinOrder('');
                    }}
                  >
                    Custom:
                  </SquareFilterOption>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      placeholder=""
                      className="h-8 w-28 text-sm pr-9"
                      value={customMinOrder}
                      onChange={(e) => {
                        setCustomMinOrder(e.target.value);
                        if ([null, 400, 700].includes(minOrderAmount)) {
                          setMinOrderAmount(undefined);
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      ALL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Maximum Prep Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Maximum prep time</Label>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden w-max max-w-[220px] bg-popover text-popover-foreground text-xs rounded-md px-3 py-2 shadow-md group-hover:block z-50 text-center border border-border">
                    Filter places that can prepare your food within the selected time.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <SquareFilterOption
                  name="maxPrepTime"
                  checked={maxPrepTime === null}
                  onChange={() => { setMaxPrepTime(null); setCustomMaxPrep(""); }}
                >
                  Show all
                </SquareFilterOption>
                <SquareFilterOption
                  name="maxPrepTime"
                  checked={maxPrepTime === 10}
                  onChange={() => { setMaxPrepTime(10); setCustomMaxPrep(""); }}
                >
                  10 min or less
                </SquareFilterOption>
                <SquareFilterOption
                  name="maxPrepTime"
                  checked={maxPrepTime === 20}
                  onChange={() => { setMaxPrepTime(20); setCustomMaxPrep(""); }}
                >
                  20 min or less
                </SquareFilterOption>

                {/* Custom Prep Time Input */}
                <div className="flex items-center gap-2 pt-1">
                  <SquareFilterOption
                    name="maxPrepTime"
                    checked={![null, 10, 20, 30].includes(maxPrepTime) && maxPrepTime !== undefined}
                    onChange={() => {
                      if (![null, 10, 20, 30].includes(maxPrepTime)) return;
                      setMaxPrepTime('');
                      setCustomMaxPrep('');
                    }}
                  >
                    Custom:
                  </SquareFilterOption>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="5"
                      placeholder=""
                      className="h-8 w-28 text-sm pr-9"
                      value={customMaxPrep}
                      onChange={(e) => {
                        setCustomMaxPrep(e.target.value);
                        if ([null, 10, 20, 30].includes(maxPrepTime)) {
                          setMaxPrepTime(undefined);
                        }
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Rating</Label>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((ratingValue) => (
                  <button
                    key={ratingValue}
                    onClick={() =>
                      setMinRating(
                        minRating === ratingValue.toString()
                          ? ""
                          : ratingValue.toString()
                      )
                    }
                    onMouseEnter={() => setHoverRating(ratingValue)}
                    className={`transition-colors ${(hoverRating || parseFloat(minRating)) >= ratingValue
                      ? "text-yellow-400"
                      : "text-muted-foreground"
                      }`}
                  >
                    <Star
                      className={`h-5 w-5 ${(hoverRating || parseFloat(minRating)) >= ratingValue
                        ? "fill-current"
                        : ""
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 space-y-4 md:space-y-6 w-full min-w-0 lg:w-3/4">
          {/* Search and Sort Bar */}
          <div className="flex items-center gap-2 md:gap-4 bg-background z-10 py-2 sticky top-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 md:h-5 md:w-5" />
              <Input
                ref={searchInputRef}
                placeholder="Looking for anything?"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border border-border rounded-lg focus:border-primary focus:ring-0 bg-card"
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full lg:hidden"
                onClick={() => setIsMobileFiltersOpen(true)}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <FilterRadioDropdown
                triggerLabel="Sort"
                panelTitle="Sort"
                value={sort}
                options={sortOptions}
                onChange={(value) => setSort(value)}
                onReset={() => setSort("")}
              />
            </div>
          </div>

          {/* Browse by Category — Wolt-style */}
          {categories.length > 0 && (
            <CategoryScroller
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          )}

          {/* Conditional Rendering for Carousels */}
          {!isAnyFilterActive && (
            <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
              <RestaurantCarousel
                title="Local heroes"
                items={localHeroesItems}
                loading={dashboardLoading}
              />
              <RestaurantCarousel
                title="In a Hurry?"
                items={inAHurryItems}
                loading={dashboardLoading}
              />
              <RestaurantCarousel
                title="Trending"
                items={trendingItems}
                loading={dashboardLoading}
              />
            </div>
          )}

          {/* Main Restaurants Section */}
          <div className="space-y-4 md:space-y-6">
            {!isAnyFilterActive && topBrands.length > 0 && (
              <BrandsScroller
                brands={topBrands}
                selectedBrand={selectedRestaurantId}
                setSelectedBrand={setSelectedRestaurantId}
              />
            )}

            {!isAnyFilterActive && (
              <h2 className="text-lg md:text-2xl font-bold text-foreground">
                Order from {totalRestaurants}{" "}
                places near you
              </h2>
            )}

            {selectedRestaurantId && (
              <Button
                variant="outline"
                onClick={() => setSelectedRestaurantId(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Button>
            )}

            {(selectedRestaurantId ? selectedRestaurantLoading : isAnyFilterActive ? restaurantsLoading : dashboardLoading) ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : mainGridItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mainGridItems.map((item) => (
                  <RestaurantCard
                    key={item.branch.id}
                    restaurant={item.restaurant}
                    branch={item.branch}
                    className="h-full"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-card rounded-3xl p-12 shadow-lg max-w-md mx-auto border border-border">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No restaurants found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Infinite scroll sentinel */}
          {!selectedRestaurantId && mainGridItems.length > 0 && (
            <div ref={sentinelRef} className="flex items-center justify-center py-8">
              {(isAnyFilterActive ? restaurantsFetching : normalRestaurantsFetching) ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              ) : isAnyFilterActive ? (
                page + 1 < filteredTotalPages ? (
                  <span className="text-muted-foreground text-sm">Scroll for more</span>
                ) : (
                  <span className="text-muted-foreground text-sm">All restaurants loaded</span>
                )
              ) : normalPage + 1 < normalTotalPages ? (
                <span className="text-muted-foreground text-sm">Scroll for more</span>
              ) : (
                <span className="text-muted-foreground text-sm">All restaurants loaded</span>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Menu;
