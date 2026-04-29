import React from "react";
import {
  useCallback,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useTransition,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";

import { useStore } from "@/components/providers/store-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchCatagories, fetchProducts } from "@/lib/store-api";
import { formatPrice, type Category, type Product } from "@/lib/storefront";
import {
  appShellActions,
  useAppShellDispatch,
  useAppShellSelector,
} from "@/store/app-shell";

const PRODUCTS_PER_PAGE = 16;
const SPECIAL_CATEGORY_ALL = "all";
const SPECIAL_CATEGORY_NEW_ARRIVALS = "new-arrivals";
const SPECIAL_CATEGORY_BEST_SELLERS = "best-sellers";

const specialCollections = [
  {
    id: SPECIAL_CATEGORY_NEW_ARRIVALS,
    name: "New Arrivals",
    description: "New and trending products in our store",
  },
  {
    id: SPECIAL_CATEGORY_BEST_SELLERS,
    name: "Best Sellers",
    description: "Top products picked by customers",
  },
] as const;

const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

const staggerContainerVariant = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
} as const;

type FilterState = {
  selectedBrand: string;
  minimumDiscount: number;
  maxPrice: number;
  sortBy: string;
  currentPage: number;
  showFilters: boolean;
};

type FilterAction =
  | { type: "set-brand"; value: string }
  | { type: "set-discount"; value: number }
  | { type: "set-max-price"; value: number }
  | { type: "set-sort"; value: string }
  | { type: "set-page"; value: number }
  | { type: "toggle-filters" }
  | { type: "reset" }
  | { type: "reset-page" };

const initialFilterState: FilterState = {
  selectedBrand: "all",
  minimumDiscount: 0,
  maxPrice: 500,
  sortBy: "relevance",
  currentPage: 1,
  showFilters: false,
};

const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => {
  switch (action.type) {
    case "set-brand":
      return { ...state, selectedBrand: action.value, currentPage: 1 };
    case "set-discount":
      return { ...state, minimumDiscount: action.value, currentPage: 1 };
    case "set-max-price":
      return { ...state, maxPrice: action.value, currentPage: 1 };
    case "set-sort":
      return { ...state, sortBy: action.value, currentPage: 1 };
    case "set-page":
      return { ...state, currentPage: action.value };
    case "toggle-filters":
      return { ...state, showFilters: !state.showFilters };
    case "reset":
      return { ...initialFilterState };
    case "reset-page":
      return { ...state, currentPage: 1 };
    default:
      return state;
  }
};

const matchesSelectedCategory = (product: Product, categoryId: string) => {
  if (categoryId === SPECIAL_CATEGORY_ALL) {
    return true;
  }

  if (categoryId === SPECIAL_CATEGORY_NEW_ARRIVALS) {
    return Boolean(product.isNewArrival);
  }

  if (categoryId === SPECIAL_CATEGORY_BEST_SELLERS) {
    return Boolean(product.isBestSeller);
  }

  return product.category === categoryId;
};

const ImagePlaceholder = ({
  label,
  className,
  src,
}: {
  label: string;
  className?: string;
  src?: string;
}) => (
  <div
    className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[18px] ${className || ""}`}
    style={{ backgroundColor: "#ffffff" }}
  >
    {src ? (
      <img
        src={src}
        alt={label}
        className="block h-full w-full object-contain object-center"
      />
    ) : (
      <div className="flex h-full items-center justify-center px-4 text-center">
        <div
          className="rounded-full border border-dashed px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d5e1a]"
          style={{ borderColor: "#d8cfbf" }}
        >
          {label}
        </div>
      </div>
    )}
  </div>
);

const ProductCard = React.memo(function ProductCard({
  product,
  quantity,
  onNavigate,
  onAdd,
  onUpdate,
}: {
  product: Product;
  quantity: number;
  onNavigate: (id: string) => void;
  onAdd: (id: string) => void;
  onUpdate: (id: string, value: number) => void;
}) {
  const availableStock = Math.max(0, product.stock ?? 0);
  const maxPerOrder =
    product.maxPerOrder && product.maxPerOrder > 0
      ? Math.floor(product.maxPerOrder)
      : null;
  const purchasableLimit =
    maxPerOrder === null
      ? availableStock
      : Math.min(availableStock, maxPerOrder);
  const isOutOfStock = availableStock === 0;
  const isAtStockLimit = purchasableLimit > 0 && quantity >= purchasableLimit;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
  const badges = [
    product.isBestSeller
      ? {
          label: "Best Seller",
          className: "bg-[#ffe7a6] text-[#6a4a00] border-[#f2d276]",
        }
      : null,
    product.isNewArrival
      ? {
          label: "New Arrival",
          className: "bg-[#dff5e7] text-[#1f6a40] border-[#bfe3cd]",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; className: string }>;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="mx-auto w-full max-w-55 overflow-hidden rounded-[14px] sm:rounded-[18px] border border-[#e8e4da] bg-white shadow-[0_3px_10px_rgba(38,33,24,0.05)] transition hover:shadow-[0_8px_18px_rgba(38,33,24,0.08)]"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate(product.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onNavigate(product.id);
          }
        }}
        className="flex h-full flex-col gap-2 sm:gap-3 text-left"
      >
        <div className="relative flex w-full justify-center overflow-hidden bg-white px-2 pb-1 pt-2">
          {badges.length > 0 ? (
            <div className="pointer-events-none absolute left-2 top-2 sm:left-3 sm:top-3 z-10 flex flex-col gap-1">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          <motion.div
            className="flex h-25 sm:h-34 w-full max-w-49 items-center justify-center"
            whileHover={{ scale: 1.05, rotate: -1.5 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <ImagePlaceholder
              label={product.imageLabel}
              src={product.images?.[0]}
              className="mx-auto h-20 w-20 sm:h-28.5 sm:w-28.5 bg-white"
            />
          </motion.div>
        </div>

        <div className="flex grow flex-col px-3 pb-2 pt-1 sm:px-4 sm:pb-2.5 sm:pt-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9a8d74] sm:text-[11px]">
            {product.brand || product.categoryLabel}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-9 text-[13px] font-semibold leading-relaxed text-[#2a2217] sm:min-h-8.5 sm:text-[15px] sm:leading-5">
            {product.name}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#7e7565] sm:text-[13px] sm:leading-5">{product.size}</p>

          <div className="mt-auto pt-2 flex items-end justify-between gap-1 sm:mt-2.5 sm:gap-3 sm:pt-0">
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#241d13] sm:text-[15px]">
                {formatPrice(product.price)}
              </span>
              {discount > 0 ? (
                <span className="text-[10px] font-medium text-[#3e8d31] sm:text-[11px]">
                  {discount}% off
                </span>
              ) : null}
            </div>

            {quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-[10px] border border-[#dbe8d8] bg-[#f8fcf7] p-0.5 sm:rounded-[12px] sm:p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 rounded-[8px] px-0 text-[#3e8d31] hover:bg-[#edf7ea] sm:h-8 sm:w-8 sm:rounded-[10px]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdate(product.id, quantity - 1);
                  }}
                >
                  -
                </Button>
                <span className="min-w-5 text-center text-xs font-semibold text-[#2f4f28] sm:min-w-6 sm:text-sm">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 rounded-[8px] px-0 text-[#3e8d31] hover:bg-[#edf7ea] sm:h-8 sm:w-8 sm:rounded-[10px]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdate(product.id, quantity + 1);
                  }}
                  disabled={isOutOfStock || isAtStockLimit}
                >
                  +
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 min-w-16 rounded-[10px] border-[#49a339] bg-[#f7fff5] px-3 text-[12px] font-bold tracking-[0.02em] text-[#3e8d31] hover:bg-[#eef9ea] hover:text-[#347d29] sm:h-11 sm:min-w-26.5 sm:rounded-[12px] sm:px-5 sm:text-[16px]"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd(product.id);
                }}
                disabled={isOutOfStock || isAtStockLimit}
              >
                ADD
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
});

const Home = () => {
  const dispatchShell = useAppShellDispatch();
  const selectedCategory = useAppShellSelector(
    (state) => state.selectedCategory,
  );
  const { addToCart, cartQuantities, updateCartQuantity } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartActionError, setCartActionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);
  const [isFilterPending, startFilterTransition] = useTransition();

  const deferredProducts = useDeferredValue(products);
  const deferredSelectedCategory = useDeferredValue(selectedCategory);
  const deferredSelectedBrand = useDeferredValue(filters.selectedBrand);
  const deferredMinimumDiscount = useDeferredValue(filters.minimumDiscount);
  const deferredMaxPrice = useDeferredValue(filters.maxPrice);
  const deferredSortBy = useDeferredValue(filters.sortBy);

  useEffect(() => {
    const loadStorefront = async () => {
      setIsLoading(true);

      try {
        const [nextProducts, nextCategories] = await Promise.all([
          fetchProducts(),
          fetchCatagories(),
        ]);
        setProducts(nextProducts);
        setCategories(nextCategories);
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStorefront();
  }, []);

  useEffect(() => {
    dispatch({ type: "reset-page" });
  }, [selectedCategory]);

  const derivedCategories = useMemo(() => {
    if (categories.length > 0) {
      return categories;
    }

    const uniqueCategories = new Map<string, Category>();

    products.forEach((product) => {
      if (!uniqueCategories.has(product.category)) {
        uniqueCategories.set(product.category, {
          id: product.category,
          name: product.categoryLabel,
          image: product.images?.[0] || null,
        });
      }
    });

    return Array.from(uniqueCategories.values());
  }, [categories, products]);

  const currentCategory = useMemo(() => {
    if (selectedCategory === SPECIAL_CATEGORY_ALL) {
      return null;
    }

    return [
      ...specialCollections.map(({ id, name }) => ({ id, name })),
      ...derivedCategories,
    ].find((category) => category.id === selectedCategory) || null;
  }, [derivedCategories, selectedCategory]);

  const availableBrands = useMemo(() => {
    const sourceProducts =
      deferredSelectedCategory === SPECIAL_CATEGORY_ALL
        ? deferredProducts
        : deferredProducts.filter((product) =>
            matchesSelectedCategory(product, deferredSelectedCategory),
          );

    const brandCounts = sourceProducts.reduce<Map<string, number>>((counts, product) => {
      const normalizedBrand = product.brand.trim();

      if (!normalizedBrand) {
        return counts;
      }

      counts.set(normalizedBrand, (counts.get(normalizedBrand) ?? 0) + 1);
      return counts;
    }, new Map());

    const topBrands = Array.from(brandCounts.entries())
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, 10)
      .map(([brand]) => brand);

    if (
      deferredSelectedBrand !== "all" &&
      brandCounts.has(deferredSelectedBrand) &&
      !topBrands.includes(deferredSelectedBrand)
    ) {
      return [...topBrands, deferredSelectedBrand];
    }

    return topBrands;
  }, [deferredProducts, deferredSelectedBrand, deferredSelectedCategory]);

  const filteredProducts = useMemo(() => {
    const nextProducts = deferredProducts
      .filter((product) =>
        matchesSelectedCategory(product, deferredSelectedCategory),
      )
      .filter((product) =>
        deferredSelectedBrand === "all"
          ? true
          : product.brand === deferredSelectedBrand,
      )
      .filter((product) => product.price <= deferredMaxPrice)
      .filter((product) => {
        const discount =
          product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100,
              )
            : 0;

        return discount >= deferredMinimumDiscount;
      });

    return nextProducts.sort((left, right) => {
      switch (deferredSortBy) {
        case "price-low":
          return left.price - right.price;
        case "price-high":
          return right.price - left.price;
        case "discount":
          return (
            (right.originalPrice ?? right.price) -
            right.price -
            ((left.originalPrice ?? left.price) - left.price)
          );
        case "name":
          return left.name.localeCompare(right.name);
        case "relevance":
        default:
          if (Boolean(right.isBestSeller) !== Boolean(left.isBestSeller)) {
            return (
              Number(Boolean(right.isBestSeller)) -
              Number(Boolean(left.isBestSeller))
            );
          }

          return left.name.localeCompare(right.name);
      }
    });
  }, [
    deferredMaxPrice,
    deferredMinimumDiscount,
    deferredProducts,
    deferredSelectedCategory,
    deferredSelectedBrand,
    deferredSortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const currentPage = Math.min(filters.currentPage, totalPages);
  const startIndex = isDesktop ? (currentPage - 1) * PRODUCTS_PER_PAGE : 0;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    currentPage * PRODUCTS_PER_PAGE,
  );
  const productGridKey = [
    deferredSelectedCategory,
    deferredSelectedBrand,
    deferredSortBy,
    deferredMinimumDiscount,
    deferredMaxPrice,
    currentPage,
  ].join("|");

  const observer = React.useRef<IntersectionObserver | null>(null);
  const bottomBoundaryRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isDesktop || isLoading || isFilterPending) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && currentPage < totalPages) {
            startFilterTransition(() => {
              dispatch({ type: "set-page", value: currentPage + 1 });
            });
          }
        },
        { rootMargin: "800px" } // Trigger completely before user sees the bottom
      );

      if (node) observer.current.observe(node);
    },
    [currentPage, totalPages, isLoading, isFilterPending, isDesktop]
  );

  const updateQuantity = async (id: string, nextValue: number) => {
    if (nextValue <= 0) {
      await updateCartQuantity(id, 0);
      return;
    }

    const currentQuantity = cartQuantities[id] ?? 0;

    if (currentQuantity === 0) {
      await addToCart(id, nextValue);
      return;
    }

    await updateCartQuantity(id, nextValue);
  };

  const handleCartAction = async (action: () => Promise<void>) => {
    try {
      setCartActionError("");
      await action();
    } catch (error) {
      setCartActionError(
        error instanceof Error
          ? error.message
          : "Unable to update cart quantity right now.",
      );
    }
  };

  const selectCategory = useCallback(
    (categoryId: string, shouldResetFilters = false) => {
      if (categoryId === selectedCategory) return;

      startTransition(() => {
        dispatchShell(appShellActions.setSelectedCategory(categoryId));

        if (shouldResetFilters) {
          dispatch({ type: "reset" });
        } else {
          dispatch({ type: "reset-page" });
        }
      });
    },
    [dispatchShell, selectedCategory],
  );

  return (
    <motion.div
      className="min-h-full bg-[#f7f4ee] text-[#262118]"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariant}
    >
      <div className="mx-auto flex w-full max-w-345 flex-col gap-5 px-3 pb-12 pt-4 md:px-5">
        {cartActionError ? (
          <Alert variant="destructive">
            <AlertTitle>Purchase limit reached</AlertTitle>
            <AlertDescription>{cartActionError}</AlertDescription>
          </Alert>
        ) : null}

        <motion.div
          variants={fadeUpVariant}
          className="rounded-[22px] border border-[#ece4d6] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(78,62,31,0.05)]"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b8a69]">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <span>Groceries</span>
            {currentCategory ? (
              <>
                <ChevronRight className="size-3" />
                <span className="text-[#6e5820]">{currentCategory.name}</span>
              </>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]"
        >
          <motion.aside
            variants={fadeUpVariant}
            className="space-y-4"
          >
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-[22px] border border-[#ece4d6] bg-white shadow-[0_8px_24px_rgba(78,62,31,0.05)]"
            >
              <button
                type="button"
                onClick={() =>
                  startFilterTransition(() => {
                    dispatch({ type: "toggle-filters" });
                  })
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left lg:cursor-default"
              >
                <div>
                  <h2 className="text-lg font-bold text-[#2f281b]">
                    {currentCategory?.name || "All Items"}
                  </h2>
                  <p className="mt-1 text-sm text-[#8c7d60]">
                    Browse store categories
                  </p>
                </div>
                <SlidersHorizontal className="size-4 text-[#8c7d60] lg:hidden" />
              </button>

              <div
                className={`${filters.showFilters ? "block" : "hidden"} border-t border-[#f2eadc] lg:block`}
              >
                <div className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => selectCategory(SPECIAL_CATEGORY_ALL, true)}
                    className={`mb-2 flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      selectedCategory === SPECIAL_CATEGORY_ALL
                        ? "bg-[#ffd24a] text-[#624c11]"
                        : "text-[#5f5238] hover:bg-[#faf4e8]"
                    }`}
                  >
                    All Items
                  </button>

                  <div className="mb-3 space-y-1">
                    {specialCollections.map((collection) => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => selectCategory(collection.id, true)}
                        className={`flex w-full items-start rounded-xl px-4 py-3 text-left transition ${
                          selectedCategory === collection.id
                            ? "bg-[#eef8e8] text-[#224c2d]"
                            : "text-[#5f5238] hover:bg-[#f4f8ec]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">
                            {collection.name}
                          </div>
                          <div className="mt-1 text-xs text-[#8c7d60]">
                            {collection.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b8a69]">
                    Store Categories
                  </div>

                  <div
                    className={`space-y-1 ${
                      derivedCategories.length > 8
                        ? "max-h-88 overflow-y-auto pr-1"
                        : ""
                    }`}
                  >
                    {derivedCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => selectCategory(category.id)}
                        className={`flex w-full items-center rounded-xl px-4 py-2.5 text-left text-sm transition ${
                          selectedCategory === category.id
                            ? "bg-[#fff7dd] font-semibold text-[#6a5620]"
                            : "text-[#6f6248] hover:bg-[#faf4e8]"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#f2eadc] px-5 py-4">
                  <h3 className="text-sm font-bold text-[#31291d]">Top Brands</h3>
                  <p className="mt-1 text-xs text-[#8c7d60]">
                    Showing the 10 brands with the most products.
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-3 text-sm text-[#6e6146]">
                      <input
                        type="radio"
                        name="brand"
                        checked={filters.selectedBrand === "all"}
                        onChange={() =>
                          startFilterTransition(() => {
                            dispatch({ type: "set-brand", value: "all" });
                          })
                        }
                        className="h-4 w-4 accent-[#b08b16]"
                      />
                      All Brands
                    </label>
                    {availableBrands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-3 text-sm text-[#6e6146]"
                      >
                        <input
                          type="radio"
                          name="brand"
                          checked={filters.selectedBrand === brand}
                          onChange={() =>
                            startFilterTransition(() => {
                              dispatch({ type: "set-brand", value: brand });
                            })
                          }
                          className="h-4 w-4 accent-[#b08b16]"
                        />
                        {brand}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#f2eadc] px-5 py-4">
                  <div className="flex items-center justify-between text-sm font-bold text-[#31291d]">
                    <span>Price Range</span>
                    <span className="text-[#a0801a]">
                      {formatPrice(filters.maxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={filters.maxPrice}
                    onChange={(event) =>
                      startFilterTransition(() => {
                        dispatch({
                          type: "set-max-price",
                          value: Number(event.target.value),
                        });
                      })
                    }
                    className="mt-4 h-2 w-full cursor-pointer accent-[#b08b16]"
                  />
                  <div className="mt-2 flex justify-between text-xs text-[#a2957b]">
                    <span>₹50</span>
                    <span>₹500+</span>
                  </div>
                </div>

                <div className="border-t border-[#f2eadc] px-5 py-4">
                  <h3 className="text-sm font-bold text-[#31291d]">Discount</h3>
                  <div className="mt-3 space-y-2">
                    {[0, 5, 10, 20].map((value) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 text-sm text-[#6e6146]"
                      >
                        <input
                          type="radio"
                          name="discount"
                          checked={filters.minimumDiscount === value}
                          onChange={() =>
                            startFilterTransition(() => {
                              dispatch({ type: "set-discount", value });
                            })
                          }
                          className="h-4 w-4 accent-[#b08b16]"
                        />
                        {value === 0 ? "All offers" : `${value}% or more`}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.aside>

          <motion.section variants={fadeUpVariant} className="space-y-4">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(78,62,31,0.05)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#b39b69]">
                    {currentCategory ? "Category" : "Storefront"}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-[#2c2417] md:text-3xl">
                    {currentCategory?.name || "All Grocery Products"}
                  </h1>
                  <p className="mt-1 text-sm text-[#8c7d60]">
                    Showing {filteredProducts.length} item
                    {filteredProducts.length === 1 ? "" : "s"}
                    {isFilterPending ? " · updating..." : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <label
                    htmlFor="sort-products"
                    className="shrink-0 text-sm font-bold text-[#62553b]"
                  >
                    Sort By:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-products"
                      value={filters.sortBy}
                      onChange={(event) =>
                        startFilterTransition(() => {
                          dispatch({
                            type: "set-sort",
                            value: event.target.value,
                          });
                        })
                      }
                      className="h-10 w-full min-w-35 appearance-none rounded-xl border border-[#e6dcc9] bg-[#fbf8f2] pl-4 pr-10 text-sm font-medium text-[#4b402a] shadow-sm outline-none transition-colors focus:border-[#c9aa45] focus:ring-1 focus:ring-[#c9aa45]"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="discount">Biggest Discount</option>
                      <option value="name">Name</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8c7d60]" />
                  </div>
                </div>
              </div>
            </motion.div>

            {isLoading ? (
              <motion.div
                variants={fadeUpVariant}
                className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-14 text-center text-[#8c7d60] shadow-[0_8px_24px_rgba(78,62,31,0.05)]"
              >
                Loading products...
              </motion.div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={productGridKey}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={staggerContainerVariant}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 xl:grid-cols-4 2xl:grid-cols-5"
                  >
                    {paginatedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={cartQuantities[product.id] ?? 0}
                        onNavigate={(id) => {
                          dispatchShell(appShellActions.openProduct(id));
                          window.scrollTo({ top: 0 });
                        }}
                        onAdd={(id) => handleCartAction(() => addToCart(id, 1))}
                        onUpdate={(id, value) =>
                          handleCartAction(() => updateQuantity(id, value))
                        }
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {!isDesktop && currentPage < totalPages && (
                  <div
                    ref={bottomBoundaryRef}
                    className="flex items-center justify-center pt-8 pb-4"
                  >
                    <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#e8ddca] border-t-[#a78410]" />
                  </div>
                )}

                {isDesktop && (
                  <div className="flex items-center justify-center gap-2 pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        startFilterTransition(() => {
                          dispatch({
                            type: "set-page",
                            value: Math.max(1, currentPage - 1),
                          });
                        })
                      }
                      disabled={currentPage === 1}
                      className="rounded-xl border border-[#e8ddca] bg-white text-[#7f6f52] hover:bg-[#faf5ea]"
                    >
                      {"<"}
                    </Button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .slice(0, 5)
                      .map((page) => (
                        <Button
                          key={page}
                          type="button"
                          onClick={() =>
                            startFilterTransition(() => {
                              dispatch({ type: "set-page", value: page });
                            })
                          }
                          className={`h-9 min-w-9 rounded-xl px-3 text-sm font-semibold ${
                            currentPage === page
                              ? "bg-[#a78410] text-white hover:bg-[#92730f]"
                              : "border border-[#e8ddca] bg-white text-[#7f6f52] hover:bg-[#faf5ea]"
                          }`}
                        >
                          {page}
                        </Button>
                      ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        startFilterTransition(() => {
                          dispatch({
                            type: "set-page",
                            value: Math.min(totalPages, currentPage + 1),
                          });
                        })
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-xl border border-[#e8ddca] bg-white text-[#7f6f52] hover:bg-[#faf5ea]"
                    >
                      {">"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                variants={fadeUpVariant}
                className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-14 text-center shadow-[0_8px_24px_rgba(78,62,31,0.05)]"
              >
                <h2 className="text-2xl font-bold text-[#2d2518]">
                  No products found
                </h2>
                <p className="mt-2 text-sm text-[#8c7d60]">
                  Try changing the category or clearing a few filters.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    startFilterTransition(() => {
                      dispatch({ type: "reset" });
                    });
                    selectCategory("all", true);
                  }}
                  className="mt-5 rounded-xl bg-[#a78410] text-white hover:bg-[#92730f]"
                >
                  Clear filters
                </Button>
              </motion.div>
            )}
          </motion.section>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
