import { userDTOSchema } from '@/types';
import { clerkClient } from '@clerk/nextjs/server';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    if (!userId) {
        return Response.json('Not found', { status: 404 });
    }

    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        return Response.json(
            userDTOSchema.parse({
                id: user.id,
                imageUrl: user.imageUrl,
                firstName: user.firstName,
                lastName: user.lastName
            })
        );
    } catch (error) {
        if (isClerkAPIResponseError(error)) {
            return Response.json(error, { status: error.status });
        }

        return Response.json(error, { status: 400 });
    }
}
