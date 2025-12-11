import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { Users, Plus, UserPlus, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeamMember {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Team {
    id: string;
    name: string;
    description?: string;
    owner: TeamMember;
    members: TeamMember[];
    color?: string;
    memberCount: number;
    createdAt: string;
}

const colorOptions = [
    "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#6366f1",
];

export function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: "", description: "", color: "#8b5cf6" });

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const data = await client.teams.list();
            setTeams(data as Team[]);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeam.name) return;

        try {
            await client.teams.create({
                name: newTeam.name,
                description: newTeam.description || undefined,
                color: newTeam.color,
            });
            setShowCreateDialog(false);
            setNewTeam({ name: "", description: "", color: "#8b5cf6" });
            fetchTeams();
        } catch (error) {
            console.error("Failed to create team:", error);
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm("Are you sure you want to delete this team?")) return;
        try {
            await client.teams.delete({ id });
            fetchTeams();
        } catch (error) {
            console.error("Failed to delete team:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-emerald-400" />
                        Teams
                    </h1>
                    <p className="text-gray-400 mt-1">Manage your teams and members</p>
                </div>
                <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Team
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-20">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
                    <p className="text-gray-400 mb-4">Create your first team to start collaborating</p>
                    <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Team
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <div
                            key={team.id}
                            className="group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 transition-all duration-300 hover:bg-white/10"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                        style={{ backgroundColor: team.color || "#8b5cf6" }}
                                    >
                                        {team.name[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{team.name}</h3>
                                        <p className="text-sm text-gray-500">{team.memberCount} members</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteTeam(team.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {team.description && (
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{team.description}</p>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                                <Crown className="w-4 h-4 text-amber-400" />
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">{team.owner.name[0]}</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{team.owner.name}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                <div className="flex -space-x-2">
                                    {team.members.slice(0, 5).map((member, i) => (
                                        <div
                                            key={member._id}
                                            className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                                            style={{ backgroundColor: colorOptions[i % colorOptions.length], zIndex: 5 - i }}
                                        >
                                            {member.name[0]}
                                        </div>
                                    ))}
                                    {team.members.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-slate-900 flex items-center justify-center text-gray-400 text-xs font-medium">
                                            +{team.members.length - 5}
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto text-gray-400 hover:text-white">
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-400" />
                            Create New Team
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Team Name</label>
                            <Input
                                value={newTeam.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam({ ...newTeam, name: e.target.value })}
                                placeholder="Enter team name"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-1 block">Description</label>
                            <Input
                                value={newTeam.description}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeam({ ...newTeam, description: e.target.value })}
                                placeholder="Optional description"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Team Color</label>
                            <div className="flex gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewTeam({ ...newTeam, color })}
                                        className={cn(
                                            "w-8 h-8 rounded-lg transition-all",
                                            newTeam.color === color && "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-gray-400">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTeam}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                            >
                                Create Team
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
