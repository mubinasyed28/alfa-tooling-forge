import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { listCategoriesTree, listAllPublishedProducts } from "@/lib/catalog.functions";
import { ArrowRight, ShoppingCart, X, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { createCategory, updateCategory, deleteCategory } from "@/lib/product-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const catsQ = queryOptions({ queryKey: ["categories"], queryFn: () => listCategoriesTree() });
const prodsQ = queryOptions({ queryKey: ["all-published-products"], queryFn: () => listAllPublishedProducts() });

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "Product Catalog — CNC Spare Parts & Industrial Tooling | Alfa Tooling" },
      { name: "description", content: "Browse our complete catalog of CNC tooling, filtration systems, ATC spare parts, mechanical and electrical components, sensors and hydraulic products." },
      { property: "og:title", content: "Product Catalog | Alfa Tooling Systems" },
      { property: "og:url", content: "/catalog" },
    ],
    links: [{ rel: "canonical", href: "/catalog" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catsQ),
      context.queryClient.ensureQueryData(prodsQ),
    ]);
  },
  component: Catalog,
});

function Catalog() {
  const { data: cats } = useSuspenseQuery(catsQ);
  const { data: products } = useSuspenseQuery(prodsQ);
  const addItem = useQuoteStore((s) => s.add);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  
  const doCreate = useServerFn(createCategory);
  const doUpdate = useServerFn(updateCategory);
  const doDelete = useServerFn(deleteCategory);

  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Auto-generate slug from name on creation
  useEffect(() => {
    if (isCreating) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }, [name, isCreating]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await doCreate({
        data: {
          name: name.trim(),
          description: description.trim() || null,
          parent_id: parentId === "none" ? null : parentId,
          sort_order: sortOrder,
        }
      });
      toast.success("Category created successfully!");
      setIsCreating(false);
      setName("");
      setDescription("");
      setParentId("none");
      setSortOrder(0);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !name.trim()) return;
    try {
      await doUpdate({
        data: {
          id: editingCategory.id,
          data: {
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            parent_id: parentId === "none" ? null : parentId,
            sort_order: sortOrder,
          }
        }
      });
      toast.success("Category updated successfully!");
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await doDelete({ data: { id: deletingCategory.id } });
      toast.success("Category deleted successfully!");
      setDeletingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  const startEdit = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setDescription(cat.description || "");
    setParentId(cat.parent_id || "none");
    setSortOrder(cat.sort_order || 0);
  };

  const startCreate = () => {
    setIsCreating(true);
    setName("");
    setSlug("");
    setDescription("");
    setParentId("none");
    setSortOrder(0);
  };

  // Helper to check if a category has at least one published product (directly or in any subcategory)
  const categoryHasProducts = (catId: string): boolean => {
    const hasDirect = products.some((p) => p.category_id === catId);
    if (hasDirect) return true;
    const subCats = cats.filter((c) => c.parent_id === catId);
    return subCats.some((sub) => categoryHasProducts(sub.id));
  };

  const getProductCount = (catId: string): number => {
    const direct = products.filter((p) => p.category_id === catId).length;
    const subCats = cats.filter((c) => c.parent_id === catId);
    const subCount = subCats.reduce((acc, sub) => acc + products.filter((p) => p.category_id === sub.id).length, 0);
    return direct + subCount;
  };

  const top = cats.filter((c) => {
    if (c.parent_id) return false;
    if (isEditor) return true;
    return categoryHasProducts(c.id);
  });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-orange mb-2">Catalog</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-navy">All Product Categories</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">Industrial tooling, spare parts and maintenance products organised by category.</p>
          </div>
          {isEditor && (
            <Button onClick={startCreate} className="bg-orange hover:bg-orange/90 text-white flex items-center gap-1.5 shrink-0 self-start md:self-center">
              <Plus className="h-4 w-4" /> Create Category
            </Button>
          )}
        </div>
      </section>

      {top.length > 0 && (
        <section className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
          {top.map((t) => {
            const subs = cats.filter((c) => {
              if (c.parent_id !== t.id) return false;
              if (isEditor) return true;
              return categoryHasProducts(c.id);
            });
            const hasProds = categoryHasProducts(t.id);
            const count = getProductCount(t.id);

            return (
              <div key={t.id} className="border border-border rounded-lg p-6 bg-card relative group/card flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link to="/catalog/$category" params={{ category: t.slug }} className="font-display text-xl font-bold text-navy hover:text-orange inline-flex items-center gap-1">
                        {t.name} <ArrowRight className="h-4 w-4" />
                      </Link>
                      {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                    </div>
                    {isEditor && (
                      <div className="flex items-center gap-1 shrink-0">
                        {!hasProds && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold mr-1">No products</span>
                        )}
                        <span className="text-[10px] bg-secondary text-navy px-2 py-0.5 rounded font-medium mr-2">{count} {count === 1 ? 'product' : 'products'}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange" onClick={() => startEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeletingCategory(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {subs.length > 0 && (
                    <ul className="mt-4 grid grid-cols-2 gap-1 border-t border-border/50 pt-4">
                      {subs.map((s) => {
                        const subCount = products.filter((p) => p.category_id === s.id).length;
                        return (
                          <li key={s.id} className="group/item flex items-center justify-between py-1 pr-2">
                            <Link to="/catalog/$category" params={{ category: s.slug }} className="text-sm text-foreground hover:text-orange flex-1 truncate">
                              · {s.name}
                              {isEditor && (
                                <span className="text-[9px] text-muted-foreground ml-1.5 font-medium">({subCount})</span>
                              )}
                            </Link>
                            {isEditor && (
                              <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-0.5">
                                <button className="p-1 text-muted-foreground hover:text-orange rounded" onClick={() => startEdit(s)}>
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button className="p-1 text-muted-foreground hover:text-red-600 rounded" onClick={() => setDeletingCategory(s)}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="border-t border-border pt-10">
          <h2 className="font-display text-2xl font-bold text-navy mb-6">All Products ({products.length})</h2>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm">No products found in the catalog.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => {
                return (
                  <div key={p.id} className="group border border-border rounded-lg overflow-hidden bg-card hover:border-orange hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <button 
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="block w-full aspect-square bg-secondary overflow-hidden text-left focus:outline-none cursor-pointer"
                      >
                        {p.image_urls?.[0] ? (
                          <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs bg-muted">No Image</div>
                        )}
                      </button>
                      <div className="p-4 pb-2">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{p.sku || "NO SKU"}</div>
                        <button 
                          type="button"
                          onClick={() => setSelectedProduct(p)}
                          className="font-display font-bold text-navy mt-1 line-clamp-2 hover:text-orange text-left w-full focus:outline-none cursor-pointer"
                        >
                          {p.name}
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.short_description}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 space-y-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="text-xs text-orange hover:underline font-semibold block text-center py-1 w-full focus:outline-none cursor-pointer"
                      >
                        Show Detailed Description
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addItem({ product_id: p.id, product_name: p.name ?? "", quantity: 1, slug: p.slug });
                          toast.success("Added to quote basket");
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-orange py-2 text-xs font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Quote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background rounded-xl border border-border w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background rounded-t-xl z-10">
              <div>
                <h2 className="font-display text-xl font-bold text-navy">{selectedProduct.name}</h2>
                {selectedProduct.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {selectedProduct.sku}</p>}
              </div>
              <button onClick={() => setSelectedProduct(null)} className="grid h-8 w-8 place-items-center rounded hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Media */}
              <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border">
                {selectedProduct.image_urls?.[0] ? (
                  <img src={selectedProduct.image_urls[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-muted">No Image Available</div>
                )}
              </div>

              {/* Product Price */}
              {selectedProduct.price && (
                <div className="text-2xl font-bold text-navy">
                  {selectedProduct.currency === "INR" ? "₹" : selectedProduct.currency === "USD" ? "$" : "€"}
                  {selectedProduct.price.toLocaleString()}
                </div>
              )}

              {/* Descriptions */}
              <div className="space-y-4">
                {selectedProduct.short_description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Description</h3>
                    <p className="mt-1 text-sm text-foreground">{selectedProduct.short_description}</p>
                  </div>
                )}
                {selectedProduct.long_description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Description</h3>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-line leading-relaxed">{selectedProduct.long_description}</p>
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technical Specifications</h3>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <tbody>
                        {Object.entries(selectedProduct.specs).map(([k, v], idx) => (
                          <tr key={k} className={idx % 2 ? "bg-secondary" : ""}>
                            <td className="px-3 py-1.5 font-medium text-muted-foreground w-1/2">{k}</td>
                            <td className="px-3 py-1.5 text-foreground">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Features, Applications, Compatible Machines */}
              <div className="grid sm:grid-cols-3 gap-4">
                {selectedProduct.features && selectedProduct.features.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Features</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.features.map((f: string) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {selectedProduct.applications && selectedProduct.applications.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Applications</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.applications.map((a: string) => <li key={a}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {selectedProduct.compatible_machines && selectedProduct.compatible_machines.length > 0 && (
                  <div className="border border-border rounded p-3 bg-secondary/30">
                    <h4 className="text-xs font-bold text-navy mb-1.5">Compatible Machines</h4>
                    <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                      {selectedProduct.compatible_machines.map((m: string) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border sticky bottom-0 bg-background rounded-b-xl z-10">
              <button onClick={() => setSelectedProduct(null)} className="rounded border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
                Close
              </button>
              <button
                onClick={() => {
                  addItem({ product_id: selectedProduct.id, product_name: selectedProduct.name ?? "", quantity: 1, slug: selectedProduct.slug });
                  toast.success("Added to quote basket");
                }}
                className="inline-flex items-center gap-1.5 rounded bg-orange px-4 py-2 text-sm font-semibold text-orange-foreground hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Industrial Filters"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the category..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-parent">Parent Category</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="create-parent">
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {cats
                      .filter((c: any) => !c.parent_id)
                      .map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-sort">Sort Order</Label>
                <Input
                  id="create-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange text-white">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-parent">Parent Category</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="edit-parent">
                    <SelectValue placeholder="Select a parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {cats
                      .filter((c: any) => !c.parent_id && c.id !== editingCategory?.id)
                      .map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sort">Sort Order</Label>
                <Input
                  id="edit-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange text-white">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the category <span className="font-semibold text-foreground">"{deletingCategory?.name}"</span>?
            </p>
            <p className="text-xs text-red-600 mt-2">
              Warning: Products referencing this category will have their category reference cleared.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

