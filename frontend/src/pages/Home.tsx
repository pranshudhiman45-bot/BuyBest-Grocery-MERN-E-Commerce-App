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
import { ChevronRight, SlidersHorizontal } from "lucide-react";

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

const PRODUCTS_PER_PAGE = 8;

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
const ImagePlaceholder = ({
  label,
  accent,
  className,
  src,
}: {
  label: string;
  accent: string;
  className?: string;
  src?: string;
}) => (
  <div
    // Ensure the container itself is a flexbox and spans full width
    className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[18px] ${className || ""}`}
    style={{
      backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${accent}10 100%)`,
    }}
  >
    {src ? (
      <img
        src={src}
        alt={label}
       
        className="block m-auto max-h-[90%] max-w-[90%] object-contain"
      />
    ) : (
      <div className="flex h-full items-center justify-center px-4 text-center">
        <div
          className="rounded-full border border-dashed px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d5e1a]"
          style={{ borderColor: accent }}
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

  return (
    <article className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[18px] border border-[#e8e4da] bg-white shadow-[0_3px_10px_rgba(38,33,24,0.05)] transition hover:shadow-[0_8px_18px_rgba(38,33,24,0.08)]">
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
        className="block w-30 d-flex flex-col justify-between align-middle gap-3 text-left"
      >
    <div className="relative border-b border-[#f1ede4] bg-[#fffdf9] p-2 flex justify-center w-full overflow-hidden">
  
  <div className="aspect-square w-full flex items-center justify-center">
    <ImagePlaceholder
      label={product.imageLabel}
      accent={product.accent}
      src={product.images?.[0]}
     
      className="bg-transparent" 
    />
  </div>
</div>

        <div className="px-4 pb-3 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a8d74]">
            {product.brand || product.categoryLabel}
          </p>
          <h3 className="mt-1.5 line-clamp-2 min-h-[48px] text-[15px] font-semibold leading-6 text-[#2a2217]">
            {product.name}
          </h3>
          <p className="mt-2 text-[13px] text-[#7e7565]">{product.size}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#241d13]">
                {formatPrice(product.price)}
              </span>
              {discount > 0 ? (
                <span className="text-[11px] font-medium text-[#3e8d31]">
                  {discount}% off
                </span>
              ) : null}
            </div>

            {quantity > 0 ? (
              <div className="flex items-center gap-1 rounded-[12px] border border-[#dbe8d8] bg-[#f8fcf7] p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-[10px] px-0 text-[#3e8d31] hover:bg-[#edf7ea]"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdate(product.id, quantity - 1);
                  }}
                >
                  -
                </Button>
                <span className="min-w-6 text-center text-sm font-semibold text-[#2f4f28]">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 rounded-[10px] px-0 text-[#3e8d31] hover:bg-[#edf7ea]"
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
                className="h-11 min-w-[106px] rounded-[12px] border-[#49a339] bg-[#f7fff5] px-5 text-[16px] font-bold tracking-[0.02em] text-[#3e8d31] hover:bg-[#eef9ea] hover:text-[#347d29]"
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
    </article>
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
    if (selectedCategory === "all") {
      return null;
    }

    return (
      derivedCategories.find((category) => category.id === selectedCategory) ||
      null
    );
  }, [derivedCategories, selectedCategory]);

  const availableBrands = useMemo(() => {
    const sourceProducts =
      deferredSelectedCategory === "all"
        ? deferredProducts
        : deferredProducts.filter(
            (product) => product.category === deferredSelectedCategory,
          );

    return Array.from(
      new Set(
        sourceProducts.map((product) => product.brand.trim()).filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }, [deferredProducts, deferredSelectedCategory]);

  const filteredProducts = useMemo(() => {
    const nextProducts = deferredProducts
      .filter((product) =>
        deferredSelectedCategory === "all"
          ? true
          : product.category === deferredSelectedCategory,
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
  const currentPage = Math.min(filters.currentPage, totalPages);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE,
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
    <div className="min-h-full bg-[#f7f4ee] text-[#262118]">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 px-3 pb-12 pt-4 md:px-5">
        {cartActionError ? (
          <Alert variant="destructive">
            <AlertTitle>Purchase limit reached</AlertTitle>
            <AlertDescription>{cartActionError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-[22px] border border-[#ece4d6] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(78,62,31,0.05)]">
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
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[22px] border border-[#ece4d6] bg-white shadow-[0_8px_24px_rgba(78,62,31,0.05)]">
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
                    onClick={() => selectCategory("all", true)}
                    className={`mb-2 flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      selectedCategory === "all"
                        ? "bg-[#ffd24a] text-[#624c11]"
                        : "text-[#5f5238] hover:bg-[#faf4e8]"
                    }`}
                  >
                    All Items
                  </button>

                  <div className="space-y-1">
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
                  <h3 className="text-sm font-bold text-[#31291d]">Brand</h3>
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
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(78,62,31,0.05)]">
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
                    className="text-sm font-semibold text-[#7f6f52]"
                  >
                    Sort By:
                  </label>
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
                    className="h-10 rounded-xl border border-[#e6dcc9] bg-[#fbf8f2] px-3 text-sm text-[#4b402a] outline-none focus:border-[#c9aa45]"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Biggest Discount</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-14 text-center text-[#8c7d60] shadow-[0_8px_24px_rgba(78,62,31,0.05)]">
                Loading products...
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                </div>

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
              </>
            ) : (
              <div className="rounded-[22px] border border-[#ece4d6] bg-white px-5 py-14 text-center shadow-[0_8px_24px_rgba(78,62,31,0.05)]">
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
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
