import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  notifications: router({
    /**
     * Send a chore reminder notification to the app owner (parent).
     * Called from the Parent Dashboard "Send Reminder" button.
     */
    sendReminder: publicProcedure
      .input(z.object({
        childName: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const child = input.childName || "Dean and Emma";
        const customMsg = input.message || "";
        const title = `⭐ Chore Quest Reminder`;
        const content = customMsg
          ? `${customMsg}`
          : `Time to check the chore chart! ${child} still has quests to complete today. Open the app to see their progress! 🏆`;

        const sent = await notifyOwner({ title, content });
        return { sent };
      }),

    /**
     * Send an "Above & Beyond" alert to the parent when a child submits something.
     */
    aboveBeyondAlert: publicProcedure
      .input(z.object({
        childName: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const title = `🌟 Above & Beyond from ${input.childName}!`;
        const content = `${input.childName} says: "${input.description}"\n\nOpen the Parent Dashboard to approve and award stars!`;
        const sent = await notifyOwner({ title, content });
        return { sent };
      }),

    /**
     * Send a "Week Complete!" celebration notification to the parent.
     */
    weekComplete: publicProcedure
      .input(z.object({
        childName: z.string(),
        totalStars: z.number(),
      }))
      .mutation(async ({ input }) => {
        const title = `🏆 ${input.childName} completed all quests!`;
        const content = `Amazing news! ${input.childName} has completed ALL their quests this week and earned ${input.totalStars} ⭐ stars!\n\nDon't forget to give them their reward!`;
        const sent = await notifyOwner({ title, content });
        return { sent };
      }),
  }),
});

export type AppRouter = typeof appRouter;
