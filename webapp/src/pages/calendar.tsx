import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { client } from "@/lib/api";
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface Event {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    status: string;
    color?: string;
}

export function CalendarPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showEventDialog, setShowEventDialog] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        start: "",
        end: "",
        location: "",
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = monthStart.getDay();
    const paddedDays = [...Array(startPadding).fill(null), ...days];

    const fetchEvents = useCallback(async () => {
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            const data = await client.events.list({ start, end });
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const getEventsForDay = (day: Date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.start);
            return isSameDay(eventDate, day);
        });
    };

    const handleDayClick = (day: Date) => {
        setNewEvent({
            ...newEvent,
            start: format(day, "yyyy-MM-dd'T'09:00"),
            end: format(day, "yyyy-MM-dd'T'10:00"),
        });
        setShowEventDialog(true);
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.start || !newEvent.end) return;

        try {
            await client.events.create({
                title: newEvent.title,
                description: newEvent.description || undefined,
                start: new Date(newEvent.start).toISOString(),
                end: new Date(newEvent.end).toISOString(),
                location: newEvent.location || undefined,
            });
            setShowEventDialog(false);
            setNewEvent({ title: "", description: "", start: "", end: "", location: "" });
            toast.success("Event created", { description: newEvent.title });
            fetchEvents();
        } catch (error) {
            console.error("Failed to create event:", error);
            toast.error("Failed to create event");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <CalendarIcon className="w-7 h-7 text-blue-400" />
                        Calendar
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your schedule and events</p>
                </div>
                <Button
                    onClick={() => {
                        setNewEvent({
                            ...newEvent,
                            start: format(new Date(), "yyyy-MM-dd'T'09:00"),
                            end: format(new Date(), "yyyy-MM-dd'T'10:00"),
                        });
                        setShowEventDialog(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Event
                </Button>
            </div>

            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-gray-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-gray-400 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-gray-500 text-sm font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {paddedDays.map((day, index) => {
                        if (!day) {
                            return <div key={`pad-${index}`} className="aspect-square" />;
                        }

                        const dayEvents = getEventsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentDate);

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day)}
                                className={`aspect-square rounded-xl p-2 cursor-pointer transition-all duration-200 border ${isToday
                                    ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                    } ${!isCurrentMonth ? "opacity-50" : ""}`}
                            >
                                <span className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-white"}`}>
                                    {format(day, "d")}
                                </span>
                                <div className="mt-1 space-y-1 overflow-hidden">
                                    {dayEvents.slice(0, 2).map((event) => (
                                        <div
                                            key={event.id}
                                            className="text-xs px-1.5 py-0.5 rounded truncate bg-blue-500/30 text-blue-300"
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-400" />
                            Create New Event
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Event Title</label>
                            <Input
                                value={newEvent.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Enter event title"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Start
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={newEvent.start}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, start: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> End
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={newEvent.end}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, end: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Location
                            </label>
                            <Input
                                value={newEvent.location}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, location: e.target.value })}
                                placeholder="Optional location"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Description</label>
                            <Input
                                value={newEvent.description}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, description: e.target.value })}
                                placeholder="Optional description"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowEventDialog(false)} className="text-gray-400">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateEvent}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                            >
                                Create Event
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
