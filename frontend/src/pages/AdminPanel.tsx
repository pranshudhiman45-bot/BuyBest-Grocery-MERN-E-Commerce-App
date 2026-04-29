import * as React from "react";
import {
  CircleAlert,
  CircleCheckBig,
  Boxes,
  FolderTree,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCatagory,
  createCoupon,
  createProduct,
  deleteCoupon,
  deleteCatagory,
  deleteProduct,
  fetchAdminCoupons,
  fetchAppSettings,
  fetchCatagories,
  fetchInventoryAlerts,
  fetchProducts,
  uploadProductImage,
  updateCatagory,
  updateCoupon,
  updateAppSettings,
  updateProduct,
  type CategoryFormData,
  type InventoryAlertsResponse,
  type ProductFormData,
} from "@/lib/store-api";
import {
  formatCouponDiscount,
  type CouponDefinition,
} from "@/lib/offers";
import { formatPrice, type Category, type Product } from "@/lib/storefront";

const emptyForm: ProductFormData = {
  name: "",
  slug: "",
  brand: "",
  category: "",
  categoryLabel: "",
  size: "",
  price: 0,
  originalPrice: null,
  offer: "",
  accent: "#9CD56A",
  imageLabel: "",
  images: "",
  description: "",
  stock: 0,
  maxPerOrder: null,
  expirationDate: "",
  benefits: "",
  storage: "",
  tags: "",
  relatedIds: "",
  isBestSeller: false,
  isNewArrival: false,
  publish: true,
};

const emptyCategoryForm: CategoryFormData = {
  name: "",
  image: "",
};

const emptyCouponForm: CouponDefinition = {
  id: "",
  code: "",
  description: "",
  discountType: "fixed",
  value: 0,
  minimumOrderValue: 0,
  maxDiscount: undefined,
  isActive: true,
};

const toTextValue = (value?: string[] | string | null) =>
  Array.isArray(value) ? value.join("\n") : value || "";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createFormFromProduct = (product: Product): ProductFormData => ({
  name: product.name,
  slug: product.id,
  brand: product.brand,
  category: product.category,
  categoryLabel: product.categoryLabel,
  size: product.size,
  price: product.price,
  originalPrice: product.originalPrice ?? null,
  offer: product.offer || product.badge || "",
  accent: product.accent,
  imageLabel: product.imageLabel,
  images: toTextValue(product.images),
  description: product.description || "",
  stock: product.stock || 0,
  maxPerOrder: product.maxPerOrder ?? null,
  expirationDate: product.expirationDate ? String(product.expirationDate).slice(0, 10) : "",
  benefits: toTextValue(product.benefits),
  storage: product.storage || "",
  tags: toTextValue(product.tags),
  relatedIds: toTextValue(product.relatedIds),
  isBestSeller: Boolean(product.isBestSeller),
  isNewArrival: Boolean(product.isNewArrival),
  publish: true,
});

type ProductSortKey =
  | "latest"
  | "name_asc"
  | "price_high"
  | "price_low"
  | "stock_high"
  | "stock_low";

type ProductFeatureFilter =
  | "all"
  | "bestseller"
  | "new_arrival"
  | "featured"
  | "regular";

type ProductStockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const getProductSearchText = (product: Product) =>
  [
    product.name,
    product.id,
    product.brand,
    product.category,
    product.categoryLabel,
    product.size,
    product.offer,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const ProductBadge = ({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "blue" | "amber" | "gray";
}) => {
  const toneClassName = {
    green: "bg-[#e7f8dd] text-[#4b7d21]",
    blue: "bg-[#dff3ff] text-[#1f6281]",
    amber: "bg-[#fff1d7] text-[#9b5d00]",
    gray: "bg-[#edf4f0] text-[#5d756b]",
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClassName}`}
    >
      {label}
    </span>
  );
};

export default function AdminPanel() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [form, setForm] = React.useState<ProductFormData>(emptyForm);
  const [categoryForm, setCategoryForm] =
    React.useState<CategoryFormData>(emptyCategoryForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = React.useState<
    string | null
  >(null);
  const [coupons, setCoupons] = React.useState<CouponDefinition[]>([]);
  const [couponForm, setCouponForm] =
    React.useState<CouponDefinition>(emptyCouponForm);
  const [editingCouponId, setEditingCouponId] = React.useState<string | null>(
    null,
  );
  const [inventoryAlerts, setInventoryAlerts] =
    React.useState<InventoryAlertsResponse>({
      alerts: {
        lowStockProducts: [],
        outOfStockProducts: [],
        expiringSoonProducts: [],
      },
      summary: {
        lowStockCount: 0,
        outOfStockCount: 0,
        expiringSoonCount: 0,
      },
    });
  const [productQuery, setProductQuery] = React.useState("");
  const [categoryQuery, setCategoryQuery] = React.useState("");
  const [productCategoryFilter, setProductCategoryFilter] =
    React.useState("all");
  const [productFeatureFilter, setProductFeatureFilter] =
    React.useState<ProductFeatureFilter>("all");
  const [productStockFilter, setProductStockFilter] =
    React.useState<ProductStockFilter>("all");
  const [productSortKey, setProductSortKey] =
    React.useState<ProductSortKey>("latest");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCategorySaving, setIsCategorySaving] = React.useState(false);
  const [isCouponSaving, setIsCouponSaving] = React.useState(false);
  const [isImageUploading, setIsImageUploading] = React.useState(false);
  const [selectedImageNames, setSelectedImageNames] = React.useState<string[]>(
    [],
  );
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  // Collapsible products workspace state
  const [showInventoryAlerts, setShowInventoryAlerts] = React.useState(false);
  const [showProducts, setShowProducts] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  );
  const [isBulkConfirm, setIsBulkConfirm] = React.useState(false);
  const [confirmCouponDeleteId, setConfirmCouponDeleteId] = React.useState<
    string | null
  >(null);
  const [confirmCategoryDeleteId, setConfirmCategoryDeleteId] =
    React.useState<string | null>(null);
  const [showCouponForm, setShowCouponForm] = React.useState(false);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [taxPercentage, setTaxPercentage] = React.useState("5");
  const [isSettingsSaving, setIsSettingsSaving] = React.useState(false);

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  React.useEffect(() => {
    if (!message && !error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [message, error]);

  const loadAdminData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResult, categoriesResult, alertsResult, couponsResult, settingsResult] = await Promise.allSettled([
        fetchProducts(),
        fetchCatagories(),
        fetchInventoryAlerts(),
        fetchAdminCoupons(),
        fetchAppSettings(),
      ]);

      if (productsResult.status === "fulfilled") {
        setProducts(
          productsResult.value.map((product) => ({
            ...product,
            isBestSeller: Boolean(product.isBestSeller),
            isNewArrival: Boolean(product.isNewArrival),
          })),
        );
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value);
      }

      if (alertsResult.status === "fulfilled") {
        setInventoryAlerts(alertsResult.value);
      } else {
        setInventoryAlerts({
          alerts: {
            lowStockProducts: [],
            outOfStockProducts: [],
            expiringSoonProducts: [],
          },
          summary: {
            lowStockCount: 0,
            outOfStockCount: 0,
            expiringSoonCount: 0,
          },
        });
      }

      if (couponsResult.status === "fulfilled") {
        setCoupons(couponsResult.value);
      }

      if (settingsResult.status === "fulfilled") {
        setTaxPercentage(String(settingsResult.value.taxPercentage));
      }

      const criticalLoadFailed =
        productsResult.status === "rejected" ||
        categoriesResult.status === "rejected" ||
        couponsResult.status === "rejected";

      if (criticalLoadFailed) {
        throw new Error("Unable to load some admin data.");
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load admin data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const categoryOptions = React.useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        productCategory: slugify(category.name) || category.id,
      })),
    [categories],
  );

  const productStats = React.useMemo(
    () => ({
      total: products.length,
      bestSellers: products.filter((product) => Boolean(product.isBestSeller))
        .length,
      newArrivals: products.filter((product) => Boolean(product.isNewArrival))
        .length,
      lowStock: products.filter(
        (product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5,
      ).length,
    }),
    [products],
  );

  const filteredProducts = React.useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();

    const nextProducts = products.filter((product) => {
      const stock = Math.max(0, product.stock ?? 0);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        getProductSearchText(product).includes(normalizedQuery);

      const matchesCategory =
        productCategoryFilter === "all" ||
        product.category === productCategoryFilter;

      const matchesFeature =
        productFeatureFilter === "all" ||
        (productFeatureFilter === "bestseller" &&
          Boolean(product.isBestSeller)) ||
        (productFeatureFilter === "new_arrival" &&
          Boolean(product.isNewArrival)) ||
        (productFeatureFilter === "featured" &&
          (Boolean(product.isBestSeller) || Boolean(product.isNewArrival))) ||
        (productFeatureFilter === "regular" &&
          !product.isBestSeller &&
          !product.isNewArrival);

      const matchesStock =
        productStockFilter === "all" ||
        (productStockFilter === "in_stock" && stock > 0) ||
        (productStockFilter === "low_stock" && stock > 0 && stock <= 5) ||
        (productStockFilter === "out_of_stock" && stock === 0);

      return matchesQuery && matchesCategory && matchesFeature && matchesStock;
    });

    const sortedProducts = [...nextProducts];

    sortedProducts.sort((left, right) => {
      switch (productSortKey) {
        case "name_asc":
          return left.name.localeCompare(right.name);
        case "price_high":
          return right.price - left.price;
        case "price_low":
          return left.price - right.price;
        case "stock_high":
          return (right.stock ?? 0) - (left.stock ?? 0);
        case "stock_low":
          return (left.stock ?? 0) - (right.stock ?? 0);
        case "latest":
        default:
          return 0;
      }
    });

    return sortedProducts;
  }, [
    productCategoryFilter,
    productFeatureFilter,
    productQuery,
    productSortKey,
    productStockFilter,
    products,
  ]);

  const filteredCategories = React.useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLowerCase();

    return categories.filter((category) => {
      const categoryName = category.name.toLowerCase();
      const categorySlug = slugify(category.name);

      return (
        normalizedQuery.length === 0 ||
        categoryName.includes(normalizedQuery) ||
        categorySlug.includes(normalizedQuery)
      );
    });
  }, [categories, categoryQuery]);

  const updateField =
    (field: keyof ProductFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const rawValue =
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setForm((current) => ({
        ...current,
        [field]:
          field === "price" ||
          field === "originalPrice" ||
          field === "stock" ||
          field === "maxPerOrder"
            ? rawValue === ""
              ? ""
              : Number(rawValue)
            : rawValue,
      }));
    };

  const updateCouponField =
    (field: keyof CouponDefinition) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const rawValue =
        event.target instanceof HTMLInputElement && event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setCouponForm((current) => ({
        ...current,
        [field]:
          field === "value" || field === "minimumOrderValue" || field === "maxDiscount"
            ? rawValue === ""
              ? undefined
              : Number(rawValue)
            : rawValue,
      }));
    };

  const updateCategoryField =
    (field: keyof CategoryFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setCategoryForm((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId(null);
    setError("");
  };

  const resetCouponForm = () => {
    setCouponForm(emptyCouponForm);
    setEditingCouponId(null);
    setError("");
    setShowCouponForm(true);
  };

  const handleEdit = (product: Product) => {
    setForm(createFormFromProduct(product));
    setEditingId(product.id);
    setMessage("");
    setError("");
    setShowProductForm(true);
  };

  const handleCategoryEdit = (category: Category) => {
    setCategoryForm({
      name: category.name,
      image: category.image || "",
    });
    setEditingCategoryId(category.mongoId || null);
    setMessage("");
    setError("");
  };

  const handleCouponEdit = (coupon: CouponDefinition) => {
    setCouponForm(coupon);
    setEditingCouponId(coupon.id);
    setMessage("");
    setError("");
  };

  const handleCategorySelect = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedCategory = categoryOptions.find(
      (category) => category.productCategory === event.target.value,
    );

    setForm((current) => ({
      ...current,
      category: event.target.value,
      categoryLabel: selectedCategory?.name || "",
    }));
  };

  const handleLocalImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setSelectedImageNames([]);
      return;
    }

    setSelectedImageNames(files.map((file) => file.name));
    setIsImageUploading(true);
    setMessage("");
    setError("");

    try {
      const uploadedImages = await Promise.all(
        files.map((file) => uploadProductImage(file)),
      );

      setForm((current) => {
        const existingImages = toTextValue(current.images);
        const nextImages = uploadedImages.map((image) => image.url).join("\n");

        return {
          ...current,
          images: existingImages
            ? `${existingImages}\n${nextImages}`
            : nextImages,
        };
      });

      setMessage(
        `${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} uploaded successfully`,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload product image.",
      );
    } finally {
      event.target.value = "";
      setSelectedImageNames([]);
      setIsImageUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        const response = await updateProduct(editingId, form);
        setMessage(response.message);
      } else {
        const response = await createProduct(form);
        setMessage(response.message);
      }

      resetForm();
      await loadAdminData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save product.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategorySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsCategorySaving(true);
    setMessage("");
    setError("");

    try {
      if (editingCategoryId) {
        const response = await updateCatagory(editingCategoryId, categoryForm);
        setMessage(response.message);
      } else {
        const response = await createCatagory(categoryForm);
        setMessage(response.message);
      }

      resetCategoryForm();
      await loadAdminData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save category.",
      );
    } finally {
      setIsCategorySaving(false);
    }
  };

  const handleCouponSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsCouponSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingCouponId) {
        const response = await updateCoupon(editingCouponId, couponForm);
        setMessage(response.message);
      } else {
        const response = await createCoupon(couponForm);
        setMessage(response.message);
      }

      resetCouponForm();
      await loadAdminData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save coupon.",
      );
    } finally {
      setIsCouponSaving(false);
    }
  };

  const handleCouponDelete = async (couponId: string) => {
    setConfirmCouponDeleteId(couponId);
  };

  const handleSettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSettingsSaving(true);
    setError("");

    try {
      const response = await updateAppSettings({
        taxPercentage: Number(taxPercentage),
      });
      setTaxPercentage(String(response.settings.taxPercentage));
      setMessage(response.message);
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Unable to update store settings.",
      );
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const confirmCouponDeleteAction = async () => {
    if (!confirmCouponDeleteId) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await deleteCoupon(confirmCouponDeleteId);
      setMessage(response.message);

      if (editingCouponId === confirmCouponDeleteId) {
        resetCouponForm();
      }

      await loadAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete coupon.",
      );
    } finally {
      setConfirmCouponDeleteId(null);
    }
  };

  const handleDelete = (productId: string) => {
    setConfirmDeleteId(productId);
    setIsBulkConfirm(false);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    setIsBulkConfirm(true);
  };

  const confirmDeleteAction = async () => {
    setError("");
    setMessage("");

    try {
      if (isBulkConfirm) {
        await Promise.all(selectedProducts.map((id) => deleteProduct(id)));
        setSelectedProducts([]);
        setMessage("Selected products deleted");
      } else if (confirmDeleteId) {
        const response = await deleteProduct(confirmDeleteId);
        setMessage(response.message);

        if (editingId === confirmDeleteId) {
          resetForm();
        }
      }

      await loadAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete selected product(s).",
      );
    } finally {
      setConfirmDeleteId(null);
      setIsBulkConfirm(false);
    }
  };

  const handleCategoryDelete = async (catagoryId: string) => {
    setConfirmCategoryDeleteId(catagoryId);
  };

  const confirmCategoryDeleteAction = async () => {
    if (!confirmCategoryDeleteId) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await deleteCatagory(confirmCategoryDeleteId);
      setMessage(response.message);

      if (editingCategoryId === confirmCategoryDeleteId) {
        resetCategoryForm();
      }

      await loadAdminData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete category.",
      );
    } finally {
      setConfirmCategoryDeleteId(null);
    }
  };

  if (isLoading && products.length === 0 && categories.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-2 pb-12 pt-2 sm:px-3 md:px-4">
        <Card className="overflow-hidden rounded-[30px] border-none bg-[linear-gradient(135deg,#10392f_0%,#1d6d4b_100%)] py-0 text-white shadow-[0_22px_60px_rgba(16,57,47,0.22)]">
          <CardHeader className="px-6 py-6">
            <CardTitle className="flex items-center gap-3 text-3xl">
              <ShieldCheck className="size-7" />
              Admin panel
            </CardTitle>
            <CardDescription className="text-white/80">
              Loading catalog, categories, coupons, and inventory alerts...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-2 pb-12 pt-2 sm:px-3 md:px-4">
      <Card className="overflow-hidden rounded-[30px] border-none bg-[linear-gradient(135deg,#10392f_0%,#1d6d4b_100%)] py-0 text-white shadow-[0_22px_60px_rgba(16,57,47,0.22)]">
        <CardHeader className="px-6 py-6">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-3xl">
                <ShieldCheck className="size-7" />
                Admin panel
              </CardTitle>
              <CardDescription className="max-w-2xl text-white/80">
                Manage large catalogs faster with search, filters,
                featured-product flags, and category tools in one place.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                className="min-w-[140px] snap-start rounded-[20px] bg-white/12 px-4 py-3 hover:bg-white/20 transition 2xl:min-w-0 cursor-pointer"
                onClick={() => {
                  setShowProducts(true);
                  setProductFeatureFilter("all");
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Products
                </div>
                <div className="mt-1 text-2xl font-black">
                  {productStats.total}
                </div>
              </div>
              <div
                className="min-w-[140px] snap-start rounded-[20px] bg-white/12 px-4 py-3 hover:bg-white/20 transition 2xl:min-w-0 cursor-pointer"
                onClick={() => {
                  setShowCategories(true);
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Categories
                </div>
                <div className="mt-1 text-2xl font-black">
                  {categories.length}
                </div>
              </div>
              <div
                className="min-w-[140px] snap-start rounded-[20px] bg-white/12 px-4 py-3 hover:bg-white/20 transition 2xl:min-w-0 cursor-pointer"
                onClick={() => {
                  setShowProducts(true);
                  setProductFeatureFilter("bestseller");
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Bestsellers
                </div>
                <div className="mt-1 text-2xl font-black">
                  {productStats.bestSellers}
                </div>
              </div>
              <div
                className="min-w-[140px] snap-start rounded-[20px] bg-white/12 px-4 py-3 hover:bg-white/20 transition 2xl:min-w-0 cursor-pointer"
                onClick={() => {
                  setShowProducts(true);
                  setProductStockFilter("low_stock");
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Low Stock
                </div>
                <div className="mt-1 text-2xl font-black">
                  {productStats.lowStock}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {message || error ? (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-[calc(100vw-2rem)] max-w-md sm:right-6 sm:top-6">
          <div
            className={`pointer-events-auto overflow-hidden rounded-[24px] border px-5 py-4 shadow-[0_22px_60px_rgba(16,57,47,0.18)] backdrop-blur ${
              error
                ? "border-[#f3c2c2] bg-[#fff6f6]/95 text-[#7a2727]"
                : "border-[#cfe7d7] bg-white/95 text-[#123b30]"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${
                  error ? "bg-[#ffe3e3]" : "bg-[#edf8f1]"
                }`}
              >
                {error ? (
                  <CircleAlert className="size-5 text-[#c24b4b]" />
                ) : (
                  <CircleCheckBig className="size-5 text-[#0d7a45]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {error ? "Action failed" : "Action completed"}
                </p>
                <p className="mt-1 text-sm leading-6 text-inherit/80">
                  {error || message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setError("");
                }}
                className="rounded-full p-1 text-[#6f897e] transition hover:bg-black/5 hover:text-[#123b30]"
                aria-label="Close notification"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Store settings</CardTitle>
          <CardDescription>
            Update the shared tax percentage used in cart summaries and checkout totals.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form
            onSubmit={handleSettingsSubmit}
            className="grid gap-4 md:grid-cols-[minmax(0,280px)_auto] md:items-end"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="store-tax-percentage">Tax percentage</FieldLabel>
                <Input
                  id="store-tax-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxPercentage}
                  onChange={(event) => setTaxPercentage(event.target.value)}
                  required
                />
                <FieldDescription>
                  Example: enter `5` for 5% tax.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={isSettingsSaving}
                className="rounded-2xl bg-[#0d7a45] text-white hover:bg-[#0a6539]"
              >
                {isSettingsSaving ? "Saving..." : "Save tax settings"}
              </Button>
              <span className="text-sm text-[#6f897e]">
                Current applied tax: {taxPercentage || "0"}%
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="self-start rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
          <CardHeader className="px-6 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Inventory alerts</CardTitle>
                <CardDescription>
                  Products with 5 or fewer units in stock, out-of-stock items, or expiry dates within 30 days.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInventoryAlerts((prev) => !prev)}
                className="rounded-xl px-3 py-1.5 text-xs"
              >
                {showInventoryAlerts ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          {showInventoryAlerts ? (
          <CardContent className="grid items-start gap-5 px-6 pb-6 md:grid-cols-3">
            <div className="self-start rounded-[24px] border border-[#efe4c7] bg-[#fff8e8] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e6b16]">
                    Low stock
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#6f5310]">
                    {inventoryAlerts.summary.lowStockCount}
                  </p>
                </div>
                <Boxes className="size-8 text-[#c28d18]" />
              </div>
              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {inventoryAlerts.alerts.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[18px] bg-white/80 px-4 py-3 text-sm text-[#5f4b18]"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8e6b16]">
                      {product.stock} left · {product.categoryLabel}
                    </div>
                  </div>
                ))}
                {inventoryAlerts.alerts.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-[#7f6a37]">No low-stock products right now.</p>
                ) : null}
              </div>
              {inventoryAlerts.alerts.lowStockProducts.length > 5 ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b7a28]">
                  Scroll to view all items
                </p>
              ) : null}
            </div>

            <div className="self-start rounded-[24px] border border-[#f0d9d9] bg-[#fff5f5] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a3f3f]">
                    Out of stock
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#7a2727]">
                    {inventoryAlerts.summary.outOfStockCount}
                  </p>
                </div>
                <Boxes className="size-8 text-[#c65a5a]" />
              </div>
              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {inventoryAlerts.alerts.outOfStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[18px] bg-white/90 px-4 py-3 text-sm text-[#6b2d2d]"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#9a3f3f]">
                      0 left · {product.categoryLabel}
                    </div>
                  </div>
                ))}
                {inventoryAlerts.alerts.outOfStockProducts.length === 0 ? (
                  <p className="text-sm text-[#8f5959]">No out-of-stock products right now.</p>
                ) : null}
              </div>
              {inventoryAlerts.alerts.outOfStockProducts.length > 5 ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b05d5d]">
                  Scroll to view all items
                </p>
              ) : null}
            </div>

            <div className="self-start rounded-[24px] border border-[#d8e8dc] bg-[#f4fbf6] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6a45]">
                    Expiring in 30 days
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#174638]">
                    {inventoryAlerts.summary.expiringSoonCount}
                  </p>
                </div>
                <Sparkles className="size-8 text-[#2f8b5c]" />
              </div>
              <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {inventoryAlerts.alerts.expiringSoonProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[18px] bg-white px-4 py-3 text-sm text-[#2f5c4a]"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#5b8a74]">
                      Expires {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : "soon"}
                    </div>
                  </div>
                ))}
                {inventoryAlerts.alerts.expiringSoonProducts.length === 0 ? (
                  <p className="text-sm text-[#62806f]">No products expiring within 30 days.</p>
                ) : null}
              </div>
              {inventoryAlerts.alerts.expiringSoonProducts.length > 5 ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b8a74]">
                  Scroll to view all items
                </p>
              ) : null}
            </div>
          </CardContent>
          ) : null}
        </Card>

        <Card className="self-start rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
          <CardHeader className="px-6 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{editingCouponId ? "Edit coupon" : "Create coupon"}</CardTitle>
                <CardDescription>
                  Coupons created here appear in the offers page and the payment section.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCouponForm}
                  className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3]"
                >
                  New coupon
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCouponForm((prev) => !prev)}
                  className="rounded-2xl"
                >
                  {showCouponForm ? "Hide" : "Show"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMessage("Bank offers section coming next.");
                  }}
                  className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3]"
                >
                  Bank Offers
                </Button>
              </div>
            </div>
          </CardHeader>
          {showCouponForm ? (
          <CardContent className="grid gap-6 px-6 pb-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form onSubmit={handleCouponSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="coupon-code">Coupon code</FieldLabel>
                  <Input
                    id="coupon-code"
                    value={couponForm.code}
                    onChange={updateCouponField("code")}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="coupon-description">Description</FieldLabel>
                  <Textarea
                    id="coupon-description"
                    value={couponForm.description}
                    onChange={updateCouponField("description")}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="coupon-type">Discount type</FieldLabel>
                    <select
                      id="coupon-type"
                      value={couponForm.discountType}
                      onChange={updateCouponField("discountType")}
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="coupon-value">Value</FieldLabel>
                    <Input
                      id="coupon-value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(couponForm.value ?? 0)}
                      onChange={updateCouponField("value")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="coupon-minimum">Minimum order value</FieldLabel>
                    <Input
                      id="coupon-minimum"
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(couponForm.minimumOrderValue ?? 0)}
                      onChange={updateCouponField("minimumOrderValue")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="coupon-max-discount">Max discount</FieldLabel>
                      <Input
                        id="coupon-max-discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={couponForm.maxDiscount == null ? "" : String(couponForm.maxDiscount)}
                        onChange={updateCouponField("maxDiscount")}
                      />
                  </Field>
                </div>
                <Field>
                  <label className="flex items-center gap-3 rounded-[18px] border border-[#dbeadf] bg-[#f7fbf8] px-4 py-3 text-sm font-medium text-[#184236]">
                    <Input
                      type="checkbox"
                      checked={Boolean(couponForm.isActive)}
                      onChange={updateCouponField("isActive")}
                      className="h-4 w-4"
                    />
                    Coupon is active and visible to shoppers
                  </label>
                </Field>
                <Button
                  type="submit"
                  disabled={isCouponSaving}
                  className="rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539] text-white font-semibold"
                >
                  {isCouponSaving ? "Saving..." : editingCouponId ? "Update coupon" : "Create coupon"}
                </Button>
              </FieldGroup>
            </form>

            <div>
              {confirmCouponDeleteId ? (
                <Alert
                  variant="destructive"
                  className="mb-4 flex items-center justify-between"
                >
                  <div>
                    <AlertTitle>Delete this coupon?</AlertTitle>
                    <AlertDescription>
                      This action cannot be undone.
                    </AlertDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmCouponDeleteId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void confirmCouponDeleteAction()}
                    >
                      Delete
                    </Button>
                  </div>
                </Alert>
              ) : null}
              <div className="max-h-[540px] space-y-3 overflow-y-auto pr-1">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="rounded-[22px] border border-[#e3efe8] bg-[#fbfdfc] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProductBadge
                            label={coupon.isActive === false ? "inactive" : "active"}
                            tone={coupon.isActive === false ? "gray" : "green"}
                          />
                          <span className="text-sm font-semibold text-[#123b30]">{coupon.code}</span>
                          <span className="text-sm text-[#5b756b]">{formatCouponDiscount(coupon)}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#5f7b70]">{coupon.description}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#7d958b]">
                          Minimum order {formatPrice(coupon.minimumOrderValue)}
                        </p>
                        {coupon.maxDiscount && coupon.discountType === "percentage" && (
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7d958b]">
                            Max discount {formatPrice(coupon.maxDiscount)}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 sm:mt-0 sm:ml-auto">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl whitespace-nowrap px-3 py-1.5 text-xs"
                          onClick={() => handleCouponEdit(coupon)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-2xl whitespace-nowrap px-3 py-1.5 text-xs text-[#b85a5a] hover:bg-[#ffeaea] hover:text-[#943f3f]"
                          onClick={() => handleCouponDelete(coupon.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 ? (
                  <p className="rounded-[18px] border border-dashed border-[#dbeadf] px-4 py-5 text-sm text-[#648176]">
                    No coupons created yet.
                  </p>
                ) : null}
              </div>
              {coupons.length > 4 ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f897e]">
                  Scroll to view all coupons
                </p>
              ) : null}
            </div>
          </CardContent>
          ) : showInventoryAlerts ? (
          <CardContent className="px-6 pb-6">
            {coupons.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-[20px] border border-[#e3efe8] bg-[#f8fcf9] px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f897e]">
                      Coupon preview
                    </p>
                    <p className="mt-1 text-sm text-[#5f7b70]">
                      Showing {Math.min(coupons.length, 3)} of {coupons.length} coupons while the editor is hidden.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#edf6f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#184236]">
                    {coupons.length} total
                  </span>
                </div>

                <div className="grid gap-3">
                  {coupons.slice(0, 3).map((coupon) => (
                    <div
                      key={coupon.id}
                      className="rounded-[22px] border border-[#e3efe8] bg-[#fbfdfc] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <ProductBadge
                              label={coupon.isActive === false ? "inactive" : "active"}
                              tone={coupon.isActive === false ? "gray" : "green"}
                            />
                            <span className="text-sm font-semibold text-[#123b30]">
                              {coupon.code}
                            </span>
                            <span className="text-sm text-[#5b756b]">
                              {formatCouponDiscount(coupon)}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-[#5f7b70]">
                            {coupon.description || "No description added yet."}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#7d958b]">
                            Minimum order {formatPrice(coupon.minimumOrderValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {coupons.length > 3 ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f897e]">
                    Open the section to manage the full coupon list.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#dbeadf] bg-[#fbfdfc] px-4 py-6 text-sm text-[#648176]">
                No coupons created yet. Use the Show button to open the coupon form.
              </div>
            )}
          </CardContent>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6 xl:sticky xl:top-4 xl:self-start">
        <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
            <CardHeader className="px-6 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    {editingId ? "Edit product" : "Create product"}
                  </CardTitle>
                  <CardDescription>
                    Product category values come from the backend `catagory`
                    collection.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowProductForm(true);
                    }}
                    className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-2 whitespace-nowrap"
                  >
                    New product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductForm((prev) => !prev)}
                    className="rounded-2xl"
                  >
                    {showProductForm ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {showProductForm && (
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="name">Product name</FieldLabel>
                      <Input
                        id="name"
                        value={String(form.name || "")}
                        onChange={updateField("name")}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="slug">Slug</FieldLabel>
                      <Input
                        id="slug"
                        value={String(form.slug || "")}
                        onChange={updateField("slug")}
                        placeholder="auto-generated-from-name"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="brand">Brand</FieldLabel>
                      <Input
                        id="brand"
                        value={String(form.brand || "")}
                        onChange={updateField("brand")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="category">Category</FieldLabel>
                      <select
                        id="category"
                        value={String(form.category || "")}
                        onChange={handleCategorySelect}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <option value="">Select Category</option>
                        {categoryOptions.map((category) => (
                          <option
                            key={category.mongoId || category.id}
                            value={category.productCategory}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <FieldDescription>
                        Product category slug is generated from the selected
                        category.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="categoryLabel">
                        Category label
                      </FieldLabel>
                      <Input
                        id="categoryLabel"
                        value={String(form.categoryLabel || "")}
                        onChange={updateField("categoryLabel")}
                        readOnly={categoryOptions.length > 0}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="size">Size</FieldLabel>
                      <Input
                        id="size"
                        value={String(form.size || "")}
                        onChange={updateField("size")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="price">Price</FieldLabel>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(form.price ?? 0)}
                        onChange={updateField("price")}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="originalPrice">
                        Original price
                      </FieldLabel>
                      <Input
                        id="originalPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.originalPrice === null ||
                          form.originalPrice === undefined
                            ? ""
                            : String(form.originalPrice)
                        }
                        onChange={updateField("originalPrice")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="stock">Stock</FieldLabel>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={String(form.stock ?? 0)}
                        onChange={updateField("stock")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="maxPerOrder">Max units per user (single order)</FieldLabel>
                      <Input
                        id="maxPerOrder"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          form.maxPerOrder === null || form.maxPerOrder === undefined
                            ? ""
                            : String(form.maxPerOrder)
                        }
                        onChange={updateField("maxPerOrder")}
                        placeholder="Leave empty for no per-order limit"
                      />
                      <FieldDescription>
                        Prevents one user from buying more than this quantity of this product in a single order.
                      </FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="expirationDate">Expiration date</FieldLabel>
                      <Input
                        id="expirationDate"
                        type="date"
                        value={String(form.expirationDate || "")}
                        onChange={updateField("expirationDate")}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="offer">Offer / badge</FieldLabel>
                      <Input
                        id="offer"
                        value={String(form.offer || "")}
                        onChange={updateField("offer")}
                        placeholder="Fresh Today"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="accent">Accent color</FieldLabel>
                      <Input
                        id="accent"
                        value={String(form.accent || "")}
                        onChange={updateField("accent")}
                        placeholder="#9CD56A"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="imageLabel">Image label</FieldLabel>
                      <Input
                        id="imageLabel"
                        value={String(form.imageLabel || "")}
                        onChange={updateField("imageLabel")}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <label className="flex items-center gap-3 rounded-[18px] border border-[#dbeadf] bg-[#f7fbf8] px-4 py-3 text-sm font-medium text-[#184236]">
                        <Input
                          id="isBestSeller"
                          type="checkbox"
                          checked={Boolean(form.isBestSeller)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              isBestSeller: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Add this product to the bestseller section
                      </label>
                    </Field>
                    <Field>
                      <label className="flex items-center gap-3 rounded-[18px] border border-[#dbeadf] bg-[#f7fbf8] px-4 py-3 text-sm font-medium text-[#184236]">
                        <Input
                          id="isNewArrival"
                          type="checkbox"
                          checked={Boolean(form.isNewArrival)}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              isNewArrival: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        Add this product to the new arrivals section
                      </label>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="images">Image URLs</FieldLabel>
                    <Textarea
                      id="images"
                      value={toTextValue(form.images)}
                      onChange={updateField("images")}
                      placeholder={
                        "https://example.com/product-1.jpg\nhttps://example.com/product-2.jpg"
                      }
                    />
                    <FieldDescription>
                      Each line becomes one product image.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="product-image-upload">
                      Upload images from device
                    </FieldLabel>
                    <label
                      htmlFor="product-image-upload"
                      className="group flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-[22px] border border-[#dbe7de] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbf8_100%)] px-4 py-3 shadow-[0_10px_22px_rgba(18,59,48,0.06)] transition hover:border-[#b9d9c7] hover:shadow-[0_14px_28px_rgba(18,59,48,0.08)]"
                    >
                      <div className="min-w-0">
                        <div className="inline-flex rounded-full bg-[#e7f5ec] px-4 py-2 text-sm font-semibold text-[#14543c] transition group-hover:bg-[#d9f2e1]">
                          {isImageUploading ? "Uploading..." : "Choose files"}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-medium text-[#24352d] sm:text-base">
                          {selectedImageNames.length === 0
                            ? "Select one or more product images"
                            : selectedImageNames.length === 1
                              ? selectedImageNames[0]
                              : `${selectedImageNames.length} files selected`}
                        </p>
                        <p className="mt-1 text-xs text-[#6e7d76]">
                          PNG, JPG, WEBP supported
                        </p>
                      </div>
                    </label>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleLocalImageUpload}
                      className="sr-only"
                    />
                    <FieldDescription>
                      Upload from your device and the hosted image URLs will be
                      added to the image list automatically.
                      {isImageUploading ? " Uploading..." : ""}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea
                      id="description"
                      value={String(form.description || "")}
                      onChange={updateField("description")}
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="benefits">Benefits</FieldLabel>
                      <Textarea
                        id="benefits"
                        value={toTextValue(form.benefits)}
                        onChange={updateField("benefits")}
                        placeholder={"Rich in fiber\nFarm fresh quality"}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="storage">Storage</FieldLabel>
                      <Textarea
                        id="storage"
                        value={String(form.storage || "")}
                        onChange={updateField("storage")}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="tags">Tags</FieldLabel>
                      <Textarea
                        id="tags"
                        value={toTextValue(form.tags)}
                        onChange={updateField("tags")}
                        placeholder={"Fresh Today\nOrganic"}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="relatedIds">
                        Related product slugs
                      </FieldLabel>
                      <Textarea
                        id="relatedIds"
                        value={toTextValue(form.relatedIds)}
                        onChange={updateField("relatedIds")}
                        placeholder={"broccoli\ntomatoes"}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {editingId ? (
                        <Pencil className="mr-2 size-4" />
                      ) : (
                        <Plus className="mr-2 size-4" />
                      )}
                      {isSaving
                        ? "Saving..."
                        : editingId
                          ? "Update product"
                          : "Create product"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-2 whitespace-nowrap"
                    >
                      Clear form
                    </Button>
                  </div>
                </FieldGroup>
              </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
            <CardHeader className="px-6 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    {editingCategoryId ? "Edit category" : "Category manager"}
                  </CardTitle>
                  <CardDescription>
                    Keep your categories searchable and tidy.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCategoryForm}
                  className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-4 py-2 whitespace-nowrap"
                >
                  New category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 px-6 pb-6">
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="category-name">
                      Category name
                    </FieldLabel>
                    <Input
                      id="category-name"
                      value={categoryForm.name || ""}
                      onChange={updateCategoryField("name")}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="category-image">
                      Category image URL
                    </FieldLabel>
                    <Input
                      id="category-image"
                      value={categoryForm.image || ""}
                      onChange={updateCategoryField("image")}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <Button
                    type="submit"
                    disabled={isCategorySaving}
                    className="rounded-2xl bg-[#0d7a45] hover:bg-[#0a6539] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {editingCategoryId ? (
                      <Pencil className="mr-2 size-4" />
                    ) : (
                      <Plus className="mr-2 size-4" />
                    )}
                    {isCategorySaving
                      ? "Saving..."
                      : editingCategoryId
                        ? "Update category"
                        : "Create category"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetCategoryForm}
                    className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-2 whitespace-nowrap"
                  >
                    Clear form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
            <CardHeader className="px-6 pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="size-5 text-[#0d7a45]" />
                    Product workspace
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProducts((prev) => !prev)}
                    className="rounded-xl px-3 py-1.5 text-xs"
                  >
                    {showProducts ? "Hide" : "Show"}
                  </Button>
                </div>
                <CardDescription>
                  Search, filter, and manage products quickly, even with a large
                  catalog.
                </CardDescription>
                {showProducts && (
                  <div className="grid gap-5 xl:grid-cols-[minmax(260px,1fr)_minmax(0,1fr)] xl:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7c9188]" />
                      <Input
                        value={productQuery}
                        onChange={(event) =>
                          setProductQuery(event.target.value)
                        }
                        placeholder="Search name, brand, slug..."
                        className="pl-9 h-11 rounded-xl border-[#dbeadf] focus:ring-2 focus:ring-[#0d7a45]/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <select
                        value={productCategoryFilter}
                        onChange={(event) =>
                          setProductCategoryFilter(event.target.value)
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dbeadf] bg-white px-3 py-2 text-sm font-medium text-[#184236] shadow-sm transition hover:border-[#0d7a45] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d7a45]/20"
                      >
                        <option value="all">All categories</option>
                        {categoryOptions.map((category) => (
                          <option
                            key={category.productCategory}
                            value={category.productCategory}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={productFeatureFilter}
                        onChange={(event) =>
                          setProductFeatureFilter(
                            event.target.value as ProductFeatureFilter,
                          )
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dbeadf] bg-white px-3 py-2 text-sm font-medium text-[#184236] shadow-sm transition hover:border-[#0d7a45] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d7a45]/20"
                      >
                        <option value="all">All feature states</option>
                        <option value="bestseller">Bestsellers</option>
                        <option value="new_arrival">New arrivals</option>
                        <option value="featured">Any featured product</option>
                        <option value="regular">Regular products</option>
                      </select>
                      <select
                        value={productStockFilter}
                        onChange={(event) =>
                          setProductStockFilter(
                            event.target.value as ProductStockFilter,
                          )
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dbeadf] bg-white px-3 py-2 text-sm font-medium text-[#184236] shadow-sm transition hover:border-[#0d7a45] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d7a45]/20"
                      >
                        <option value="all">All stock</option>
                        <option value="in_stock">In stock</option>
                        <option value="low_stock">Low stock</option>
                        <option value="out_of_stock">Out of stock</option>
                      </select>
                      <select
                        value={productSortKey}
                        onChange={(event) =>
                          setProductSortKey(
                            event.target.value as ProductSortKey,
                          )
                        }
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dbeadf] bg-white px-3 py-2 text-sm font-medium text-[#184236] shadow-sm transition hover:border-[#0d7a45] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0d7a45]/20"
                      >
                        <option value="latest">Default</option>
                        <option value="name_asc">Name A-Z</option>
                        <option value="price_high">Price high-low</option>
                        <option value="price_low">Price low-high</option>
                        <option value="stock_high">Stock high-low</option>
                        <option value="stock_low">Stock low-high</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              {showProducts && (
                <>
                  {(confirmDeleteId || isBulkConfirm) && (
                    <Alert
                      variant="destructive"
                      className="mb-4 flex items-center justify-between"
                    >
                      <div>
                        <AlertTitle>
                          {isBulkConfirm
                            ? "Delete selected products?"
                            : "Delete this product?"}
                        </AlertTitle>
                        <AlertDescription>
                          This action cannot be undone.
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            setIsBulkConfirm(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmDeleteAction}
                        >
                          Delete
                        </Button>
                      </div>
                    </Alert>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#678277]">
                    <span className="rounded-full bg-[#edf6f1] px-4 py-2 font-medium text-[#184236]">
                      {filteredProducts.length} result
                      {filteredProducts.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#70887f] xl:hidden">
                      Slide filters sideways if space is tight
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setProductQuery("");
                        setProductCategoryFilter("all");
                        setProductFeatureFilter("all");
                        setProductStockFilter("all");
                        setProductSortKey("latest");
                      }}
                      className="rounded-full border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-2 whitespace-nowrap"
                    >
                      Reset filters
                    </Button>
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        onClick={handleBulkDelete}
                        className="mb-2"
                      >
                        Delete Selected ({selectedProducts.length})
                      </Button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const stock = Math.max(0, product.stock ?? 0);
                      const hasImage = Boolean(product.images?.[0]);

                      return (
                        <div
                          key={product.id}
                          className="rounded-xl border border-[#e2efe6] bg-white px-4 py-3 hover:shadow-sm transition flex items-center gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4"
                          />
                          <div className="flex items-center justify-between gap-4 flex-1">
                            <div className="flex min-w-0 gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#edf8f1] text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a7c70]">
                                {hasImage ? (
                                  <img
                                    src={product.images?.[0]}
                                    alt={product.imageLabel}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="px-2 text-xs text-center">
                                    {product.imageLabel || "No Image"}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#789286]">
                                    {product.brand || product.categoryLabel}
                                  </p>
                                  {product.isBestSeller ? (
                                    <ProductBadge
                                      label="Bestseller"
                                      tone="green"
                                    />
                                  ) : null}
                                  {product.isNewArrival ? (
                                    <ProductBadge
                                      label="New Arrival"
                                      tone="blue"
                                    />
                                  ) : null}
                                  {stock === 0 ? (
                                    <ProductBadge
                                      label="Out Of Stock"
                                      tone="gray"
                                    />
                                  ) : null}
                                  {stock > 0 && stock <= 5 ? (
                                    <ProductBadge
                                      label="Low Stock"
                                      tone="amber"
                                    />
                                  ) : null}
                                </div>
                                <h3 className="text-base font-semibold text-[#123b30]">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-[#6f897e]">
                                  {product.id} · {product.categoryLabel} ·{" "}
                                  {product.size}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-[#5f7a70]">
                                  <span className="font-semibold text-[#0d7a45]">
                                    {formatPrice(product.price)}
                                    {product.originalPrice
                                      ? ` · ${formatPrice(product.originalPrice)}`
                                      : ""}
                                  </span>
                                  <span>{stock} in stock</span>
                                  {product.maxPerOrder ? (
                                    <span>Max {product.maxPerOrder} per order</span>
                                  ) : null}
                                  {product.offer ? (
                                    <span>{product.offer}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                                className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-1.5 text-xs whitespace-nowrap"
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleDelete(product.id)}
                                className="rounded-2xl shadow-sm hover:scale-[1.03] transition px-3 py-1.5 text-xs whitespace-nowrap"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!isLoading && filteredProducts.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-[#c7ddd0] p-5 text-sm text-[#6f897e]">
                        No products matched your current search or filters.
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)]">
            <CardHeader className="px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="size-5 text-[#0d7a45]" />
                    Category workspace
                  </CardTitle>
                  <CardDescription>
                    Search categories quickly and jump straight into editing.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategories((prev) => !prev)}
                  className="rounded-xl px-3 py-1.5 text-xs"
                >
                  {showCategories ? "Hide" : "Show"}
                </Button>
              </div>
              {showCategories && (
                <div className="relative w-full max-w-sm mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7c9188]" />
                  <Input
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Search category name or slug..."
                    className="pl-9"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {showCategories && (
                <>
                  {confirmCategoryDeleteId ? (
                    <Alert
                      variant="destructive"
                      className="mb-4 flex items-center justify-between"
                    >
                      <div>
                        <AlertTitle>Delete this category?</AlertTitle>
                        <AlertDescription>
                          This action cannot be undone.
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setConfirmCategoryDeleteId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => void confirmCategoryDeleteAction()}
                        >
                          Delete
                        </Button>
                      </div>
                    </Alert>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#678277]">
                    <span className="rounded-full bg-[#edf6f1] px-4 py-2 font-medium text-[#184236]">
                      {filteredCategories.length} categor
                      {filteredCategories.length === 1 ? "y" : "ies"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.mongoId || category.id}
                        className="flex flex-col gap-3 rounded-[22px] border border-[#e2efe6] bg-[#f8fcf9] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#789286]">
                              {slugify(category.name)}
                            </p>
                            {category.image ? (
                              <ProductBadge label="Image Ready" tone="blue" />
                            ) : (
                              <ProductBadge label="No Image" tone="gray" />
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-[#123b30]">
                            {category.name}
                          </h3>
                          <p className="mt-1 break-all text-sm text-[#6f897e]">
                            {category.image || "No category image added"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-3 flex-wrap sm:flex-nowrap">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCategoryEdit(category)}
                            className="rounded-2xl border-[#dbeadf] hover:bg-[#f0f7f3] transition px-3 py-2 whitespace-nowrap"
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </Button>
                          {category.mongoId ? (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() =>
                                void handleCategoryDelete(category.mongoId!)
                              }
                              className="rounded-2xl shadow-sm hover:scale-[1.03] transition px-3 py-2 whitespace-nowrap"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}

                    {!isLoading && filteredCategories.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-[#c7ddd0] p-5 text-sm text-[#6f897e]">
                        No categories matched your search.
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-[24px] border-none bg-[#e8f8de] py-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-5">
                <Star className="size-6 text-[#4b7d21]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c845a]">
                    Featured
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#24421a]">
                    {productStats.bestSellers + productStats.newArrivals}{" "}
                    home-page products
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-[#e4f5ff] py-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-5">
                <Sparkles className="size-6 text-[#1f6281]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#66849c]">
                    New Arrivals
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#17445b]">
                    {productStats.newArrivals} products highlighted
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-none bg-[#fff3df] py-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-5">
                <Boxes className="size-6 text-[#9b5d00]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c825b]">
                    Inventory Watch
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#5f4200]">
                    {productStats.lowStock} low-stock products
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bank Offers Section */}
      <Card className="rounded-[28px] border border-white/70 bg-white/92 py-0 shadow-[0_18px_44px_rgba(18,75,53,0.08)] mt-6">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Bank Offers</CardTitle>
          <CardDescription>
            Manage bank-specific offers like credit/debit card discounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-3">
          <div className="rounded-[18px] border border-dashed border-[#dbeadf] px-4 py-5 text-sm text-[#648176]">
            Bank offers creation UI coming next 🚀
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
