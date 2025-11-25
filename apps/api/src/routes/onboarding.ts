import { Hono } from 'hono';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { createOnboarding, getOnboardingByUserId, updateOnboardingStep, completeOnboarding, skipOnboarding } from '@/api/db/queries/onboarding-queries';

const onboardingRoutes = new Hono<HonoContext>();

onboardingRoutes.get('/onboarding/status', async (c) => {
    const user = c.get('user');

    const onboarding = await getOnboardingByUserId(user.id);

    if (!onboarding) {
        return c.json({
            exists: false
        });
    }

    return c.json({
        exists: true,
        currentStep: onboarding.currentStep,
        completedAt: onboarding.completedAt ? Number(onboarding.completedAt) : null,
        skippedAt: onboarding.skippedAt ? Number(onboarding.skippedAt) : null
    });
});

onboardingRoutes.post('/onboarding/progress', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const { step } = z
        .object({
            step: z.number().int().min(1).max(6)
        })
        .parse(body);

    let onboarding = await getOnboardingByUserId(user.id);

    if (!onboarding) {
        onboarding = await createOnboarding({
            userId: user.id,
            currentStep: step
        });
    } else {
        onboarding = await updateOnboardingStep(user.id, step);
    }

    return c.json({
        exists: true,
        currentStep: onboarding.currentStep,
        completedAt: onboarding.completedAt ? Number(onboarding.completedAt) : null,
        skippedAt: onboarding.skippedAt ? Number(onboarding.skippedAt) : null
    });
});

onboardingRoutes.post('/onboarding/complete', async (c) => {
    const user = c.get('user');

    const onboarding = await getOnboardingByUserId(user.id);

    if (!onboarding) {
        throw new HTTPException(404, { message: 'Onboarding not found' });
    }

    const completed = await completeOnboarding(user.id);

    return c.json({
        exists: true,
        currentStep: completed.currentStep,
        completedAt: completed.completedAt ? Number(completed.completedAt) : null,
        skippedAt: completed.skippedAt ? Number(completed.skippedAt) : null
    });
});

onboardingRoutes.post('/onboarding/skip', async (c) => {
    const user = c.get('user');

    let onboarding = await getOnboardingByUserId(user.id);

    if (!onboarding) {
        onboarding = await createOnboarding({
            userId: user.id,
            currentStep: 1
        });
    }

    const skipped = await skipOnboarding(user.id);

    return c.json({
        exists: true,
        currentStep: skipped.currentStep,
        completedAt: skipped.completedAt ? Number(skipped.completedAt) : null,
        skippedAt: skipped.skippedAt ? Number(skipped.skippedAt) : null
    });
});

export { onboardingRoutes };
