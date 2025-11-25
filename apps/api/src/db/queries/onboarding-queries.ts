import { schema } from '@/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '../index';

const { userOnboardingTable } = schema;

type CreateOnboardingData = {
    userId: string;
    currentStep: number;
};

export const createOnboarding = async (data: CreateOnboardingData) => {
    const [onboarding] = await db
        .insert(userOnboardingTable)
        .values({
            userId: data.userId,
            currentStep: data.currentStep
        })
        .returning();

    if (!onboarding) {
        throw new Error('Failed to create onboarding');
    }

    return onboarding;
};

export const getOnboardingByUserId = async (userId: string) => {
    const [onboarding] = await db.select().from(userOnboardingTable).where(eq(userOnboardingTable.userId, userId)).limit(1);

    return onboarding || null;
};

export const updateOnboardingStep = async (userId: string, step: number) => {
    const [onboarding] = await db
        .update(userOnboardingTable)
        .set({
            currentStep: step
        })
        .where(eq(userOnboardingTable.userId, userId))
        .returning();

    if (!onboarding) {
        throw new Error('Failed to update onboarding step');
    }

    return onboarding;
};

export const completeOnboarding = async (userId: string) => {
    const now = new Date();

    const [onboarding] = await db
        .update(userOnboardingTable)
        .set({
            completedAt: now
        })
        .where(eq(userOnboardingTable.userId, userId))
        .returning();

    if (!onboarding) {
        throw new Error('Failed to complete onboarding');
    }

    return onboarding;
};

export const skipOnboarding = async (userId: string) => {
    const now = new Date();

    const [onboarding] = await db
        .update(userOnboardingTable)
        .set({
            skippedAt: now
        })
        .where(eq(userOnboardingTable.userId, userId))
        .returning();

    if (!onboarding) {
        throw new Error('Failed to skip onboarding');
    }

    return onboarding;
};
