import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Team, User } from "../models/index.js";

const teamSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().optional(),
});

export const teamsRouter = {
    list: protectedProcedure.handler(async () => {
        const teams = await Team.find()
            .populate("owner", "name email")
            .populate("members", "name email avatar")
            .sort({ name: 1 });

        return teams.map((team) => ({
            id: team._id.toString(),
            name: team.name,
            description: team.description,
            owner: team.owner,
            members: team.members,
            color: team.color,
            memberCount: team.members.length,
            createdAt: team.createdAt.toISOString(),
        }));
    }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const team = await Team.findById(input.id)
                .populate("owner", "name email avatar")
                .populate("members", "name email avatar");

            if (!team) {
                throw new Error("Team not found");
            }

            return {
                id: team._id.toString(),
                name: team.name,
                description: team.description,
                owner: team.owner,
                members: team.members,
                color: team.color,
                createdAt: team.createdAt.toISOString(),
            };
        }),

    create: protectedProcedure
        .input(teamSchema)
        .handler(async ({ input, context }) => {
            const team = await Team.create({
                ...input,
                owner: context.user.userId,
                members: [context.user.userId], // Owner is automatically a member
            });

            return {
                id: team._id.toString(),
                name: team.name,
                color: team.color,
            };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: teamSchema.partial(),
            })
        )
        .handler(async ({ input, context }) => {
            const team = await Team.findById(input.id);
            if (!team) {
                throw new Error("Team not found");
            }

            // Only owner can update
            if (team.owner.toString() !== context.user.userId) {
                throw new Error("Only the team owner can update the team");
            }

            const updated = await Team.findByIdAndUpdate(
                input.id,
                { $set: input.data },
                { new: true }
            );

            return {
                id: updated!._id.toString(),
                name: updated!.name,
                color: updated!.color,
            };
        }),

    addMember: protectedProcedure
        .input(
            z.object({
                teamId: z.string(),
                userId: z.string(),
            })
        )
        .handler(async ({ input, context }) => {
            const team = await Team.findById(input.teamId);
            if (!team) {
                throw new Error("Team not found");
            }

            // Only owner can add members
            if (team.owner.toString() !== context.user.userId) {
                throw new Error("Only the team owner can add members");
            }

            // Check if user exists
            const user = await User.findById(input.userId);
            if (!user) {
                throw new Error("User not found");
            }

            // Check if already a member
            if (team.members.some((m) => m.toString() === input.userId)) {
                throw new Error("User is already a team member");
            }

            await Team.findByIdAndUpdate(input.teamId, {
                $push: { members: input.userId },
            });

            return { success: true };
        }),

    removeMember: protectedProcedure
        .input(
            z.object({
                teamId: z.string(),
                userId: z.string(),
            })
        )
        .handler(async ({ input, context }) => {
            const team = await Team.findById(input.teamId);
            if (!team) {
                throw new Error("Team not found");
            }

            // Only owner can remove members
            if (team.owner.toString() !== context.user.userId) {
                throw new Error("Only the team owner can remove members");
            }

            // Can't remove the owner
            if (team.owner.toString() === input.userId) {
                throw new Error("Cannot remove the team owner");
            }

            await Team.findByIdAndUpdate(input.teamId, {
                $pull: { members: input.userId },
            });

            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input, context }) => {
            const team = await Team.findById(input.id);
            if (!team) {
                throw new Error("Team not found");
            }

            // Only owner can delete
            if (team.owner.toString() !== context.user.userId) {
                throw new Error("Only the team owner can delete the team");
            }

            await Team.findByIdAndDelete(input.id);
            return { success: true };
        }),

    // Get all users for member selection
    availableUsers: protectedProcedure.handler(async () => {
        const users = await User.find().select("name email avatar");
        return users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            avatar: u.avatar,
        }));
    }),
};
