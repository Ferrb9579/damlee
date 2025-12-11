import { useState, useEffect } from "react";
import { client } from "@/lib/api";
// import { Room } from "@/../../backend/src/models/Room";
// Since we don't have shared package, I'll define interfaces locally or use specific types if ORPC client provides them.
// For now I'll trust the client types or define a local interface.

import {
    MapPin,
    Users,
    Search,
    Plus,
    Wifi,
    Monitor,
    Coffee,
    Trash2,
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Local interface matching backend model
interface IRoom {
    id: string;
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    status: "available" | "maintenance" | "occupied";
    images: string[];
}

export function RoomsPage() {
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    // New Room Form State
    const [newRoom, setNewRoom] = useState<{
        name: string;
        capacity: number;
        location: string;
        amenities: string; // comma separated for input
        status: "available" | "maintenance" | "occupied";
    }>({
        name: "",
        capacity: 10,
        location: "",
        amenities: "",
        status: "available",
    });

    useEffect(() => {
        const fetchRooms = async () => {
            // Debounce
            const timer = setTimeout(async () => {
                try {
                    setLoading(true);
                    const data = await client.rooms.list({ search: search || undefined });
                    setRooms(data as IRoom[]);
                } catch (error) {
                    console.error("Failed to fetch rooms:", error);
                    toast.error("Failed to load rooms");
                } finally {
                    setLoading(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        };
        fetchRooms();
    }, [search]);

    const handleCreateRoom = async () => {
        if (!newRoom.name || !newRoom.location) {
            toast.error("Please fill in required fields");
            return;
        }

        try {
            await client.rooms.create({
                ...newRoom,
                amenities: newRoom.amenities.split(",").map(s => s.trim()).filter(Boolean),
            });
            setShowCreateDialog(false);
            setNewRoom({ name: "", capacity: 10, location: "", amenities: "", status: "available" });
            toast.success("Room created successfully");
            // Refresh
            const data = await client.rooms.list({ search: search || undefined });
            setRooms(data as IRoom[]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create room");
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm("Delete this room?")) return;
        try {
            await client.rooms.delete({ id });
            setRooms(rooms.filter(r => r.id !== id));
            toast.success("Room deleted");
        } catch {
            toast.error("Failed to delete room");
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            maintenance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
            occupied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };
        return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", colors[status as keyof typeof colors])}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <MapPin className="w-7 h-7 text-violet-400" />
                        Room Management
                    </h1>
                    <p className="text-gray-400 mt-1">Book and manage meeting rooms and resources</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search rooms..."
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white w-full md:w-64"
                        />
                    </div>
                    <Button
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Room
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No rooms found.
                    </div>
                ) : (
                    rooms.map(room => (
                        <div key={room.id} className="group relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300">
                            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                                {room.images && room.images.length > 0 ? (
                                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                                ) : (
                                    <MapPin className="w-12 h-12 text-white/10" />
                                )}
                                <div className="absolute top-3 right-3">
                                    <StatusBadge status={room.status} />
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => handleDeleteRoom(room.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> {room.location}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md">
                                        <Users className="w-3 h-3 text-violet-400" />
                                        {room.capacity} Seats
                                    </div>
                                    {room.amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md">
                                            {amenity.toLowerCase().includes('wifi') ? <Wifi className="w-3 h-3" /> :
                                                amenity.toLowerCase().includes('tv') || amenity.toLowerCase().includes('monitor') ? <Monitor className="w-3 h-3" /> :
                                                    <Coffee className="w-3 h-3" />}
                                            {amenity}
                                        </div>
                                    ))}
                                </div>

                                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white group-hover:border-violet-500/30">
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    Book Room
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Room</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-400">Room Name</label>
                            <Input
                                value={newRoom.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoom({ ...newRoom, name: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="e.g. Conference Room A"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Capacity</label>
                                <Input
                                    type="number"
                                    value={newRoom.capacity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-gray-400">Location</label>
                                <Input
                                    value={newRoom.location}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoom({ ...newRoom, location: e.target.value })}
                                    className="bg-white/5 border-white/10"
                                    placeholder="e.g. 2nd Floor"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-400">Amenities (comma separated)</label>
                            <Input
                                value={newRoom.amenities}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="WiFi, TV, Whiteboard"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-400">Status</label>
                            <div className="flex gap-2">
                                {(["available", "maintenance", "occupied"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setNewRoom({ ...newRoom, status: s })}
                                        className={cn(
                                            "flex-1 py-1.5 px-2 rounded-md text-xs font-medium capitalize border transition-all",
                                            newRoom.status === s
                                                ? "bg-violet-500/20 border-violet-500 text-violet-400"
                                                : "border-white/10 text-gray-400 hover:bg-white/5"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowCreateDialog(false)} variant="ghost" className="hover:bg-white/10">Cancel</Button>
                        <Button onClick={handleCreateRoom} className="bg-violet-600 hover:bg-violet-500">Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
