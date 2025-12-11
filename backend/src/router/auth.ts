import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../orpc.js";
import { User } from "../models/index.js";
import { generateToken } from "../middleware/auth.js";

// Validation schemas
const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const authRouter = {
    signup: publicProcedure
        .input(signupSchema)
        .handler(async ({ input }) => {
            const existingUser = await User.findOne({ email: input.email });
            if (existingUser) {
                throw new Error("Email already registered");
            }

            const user = await User.create({
                email: input.email,
                password: input.password,
                name: input.name,
            });

            const token = generateToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            return {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            };
        }),

    login: publicProcedure
        .input(loginSchema)
        .handler(async ({ input }) => {
            const user = await User.findOne({ email: input.email });
            if (!user) {
                throw new Error("Invalid email or password");
            }

            const isValid = await user.comparePassword(input.password);
            if (!isValid) {
                throw new Error("Invalid email or password");
            }

            const token = generateToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            return {
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                },
                token,
            };
        }),

    me: protectedProcedure.handler(async ({ context }) => {
        const user = await User.findById(context.user.userId);
        if (!user) {
            throw new Error("User not found");
        }

        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
        };
    }),

    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().min(2).optional(),
                avatar: z.string().url().optional(),
            })
        )
        .handler(async ({ input, context }) => {
            const user = await User.findByIdAndUpdate(
                context.user.userId,
                { $set: input },
                { new: true }
            );

            if (!user) {
                throw new Error("User not found");
            }

            return {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            };
        }),
};
