import { useEffect, useState } from "react";
import { toast } from "sonner";
import { client } from "@/lib/api";
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    MapPin,
    Tag,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    name: string;
    description?: string;
    category: string;
    location: string;
    quantity: number;
    minQuantity: number;
    status: "available" | "in-use" | "maintenance" | "retired";
    assignedTo?: { name: string; email: string; avatar?: string };
    updatedAt: string;
}

export function InventoryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newAsset, setNewAsset] = useState<{
        name: string;
        category: string;
        location: string;
        quantity: number;
        minQuantity: number;
        status: Asset["status"];
    }>({
        name: "",
        category: "",
        location: "",
        quantity: 1,
        minQuantity: 5,
        status: "available",
    });

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                setLoading(true);
                const data = await client.assets.list({ search: search || undefined });
                setAssets(data);
            } catch (error) {
                console.error("Failed to fetch assets:", error);
                toast.error("Failed to fetch inventory");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchAssets();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleCreateAsset = async () => {
        if (!newAsset.name || !newAsset.category || !newAsset.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await client.assets.create(newAsset);
            setShowCreateDialog(false);
            setNewAsset({
                name: "",
                category: "",
                location: "",
                quantity: 1,
                minQuantity: 5,
                status: "available",
            });
            toast.success("Asset created successfully");
            // Re-fetch assets
            setLoading(true);
            const data = await client.assets.list({ search: search || undefined });
            setAssets(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to create asset:", error);
            toast.error("Failed to create asset");
        }
    };

    const handleDeleteAsset = async (id: string) => {
        if (!confirm("Are you sure you want to delete this asset?")) return;
        try {
            await client.assets.delete({ id });
            toast.success("Asset deleted");
            // Re-fetch assets
            const data = await client.assets.list({ search: search || undefined });
            setAssets(data);
        } catch (error) {
            console.error("Failed to delete asset:", error);
            toast.error("Failed to delete asset");
        }
    };

    const getStatusColor = (status: Asset["status"]) => {
        switch (status) {
            case "available": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            case "in-use": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "maintenance": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
            case "retired": return "text-gray-400 bg-gray-400/10 border-gray-400/20";
            default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Package className="w-7 h-7 text-emerald-400" />
                        Inventory Management
                    </h1>
                    <p className="text-gray-400 mt-1">Track assets, equipment, and stock levels</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search assets..."
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white w-full md:w-64"
                        />
                    </div>
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Asset
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Total Assets</p>
                    <p className="text-2xl font-bold text-white">{assets.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Low Stock Items</p>
                    <p className="text-2xl font-bold text-orange-400">
                        {assets.filter(a => a.quantity <= a.minQuantity).length}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-blue-400">Coming Soon</p>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No assets found. Create one to get started.
                    </div>
                ) : (
                    assets.map((asset) => (
                        <div
                            key={asset.id}
                            className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", getStatusColor(asset.status))}>
                                    {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Edit button placeholder */}
                                    <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-1">{asset.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{asset.description || "No description provided"}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Tag className="w-4 h-4 text-emerald-500/50" />
                                    <span>{asset.category}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <MapPin className="w-4 h-4 text-emerald-500/50" />
                                    <span>{asset.location}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500">Quantity</p>
                                    <p className={cn("text-lg font-bold", asset.quantity <= asset.minQuantity ? "text-orange-400" : "text-white")}>
                                        {asset.quantity}
                                        {asset.quantity <= asset.minQuantity && (
                                            <AlertTriangle className="inline w-4 h-4 ml-1.5 -mt-0.5 text-orange-400" />
                                        )}
                                    </p>
                                </div>
                                {asset.assignedTo && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Assigned To</p>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                                                {asset.assignedTo.name[0]}
                                            </div>
                                            <span className="text-sm text-gray-300">{asset.assignedTo.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Asset</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-400">Name</label>
                            <Input
                                value={newAsset.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAsset({ ...newAsset, name: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="e.g. MacBook Pro M3"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Category</label>
                                <Input
                                    value={newAsset.category}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAsset({ ...newAsset, category: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                    placeholder="e.g. Electronics"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Location</label>
                                <Input
                                    value={newAsset.location}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAsset({ ...newAsset, location: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                    placeholder="e.g. Room 304"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Quantity</label>
                                <Input
                                    type="number"
                                    value={newAsset.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAsset({ ...newAsset, quantity: parseInt(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Min Quantity</label>
                                <Input
                                    type="number"
                                    value={newAsset.minQuantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAsset({ ...newAsset, minQuantity: parseInt(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-400">Status</label>
                            <div className="flex gap-2">
                                {(["available", "in-use", "maintenance", "retired"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setNewAsset({ ...newAsset, status: s })}
                                        className={cn(
                                            "flex-1 py-1.5 px-2 rounded-md text-xs font-medium capitalize border transition-all",
                                            newAsset.status === s
                                                ? getStatusColor(s)
                                                : "border-white/10 text-gray-400 hover:bg-white/5"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleCreateAsset}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                    >
                        Create Asset
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
