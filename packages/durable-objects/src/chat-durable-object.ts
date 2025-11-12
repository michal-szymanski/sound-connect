import { ChatMessage, chatMessageSchema, WebSocketMessage } from '@sound-connect/common/types/models';
import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { schema } from '@sound-connect/drizzle';

const MESSAGES_KEY = 'messages';
const PARTICIPANTS_KEY = 'participants';

const { userSettingsTable, blockedUsersTable, usersFollowersTable } = schema;

export class ChatDurableObject extends DurableObject {
    private storage: DurableObjectStorage;
    private roomId: string | null = null;
    private participants: Set<string> = new Set();

    constructor(
        ctx: DurableObjectState,
        public override env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    async subscribeUser(userId: string, roomId: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.add(userId);
        await this.saveParticipants();

        await this.broadcastMessage(
            {
                type: 'user-joined',
                roomId: this.roomId,
                userId
            },
            userId
        );
    }

    async unsubscribeUser(userId: string, roomId: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.delete(userId);
        await this.saveParticipants();

        await this.broadcastMessage(
            {
                type: 'user-left',
                roomId: this.roomId,
                userId
            },
            userId
        );
    }

    async sendMessage(senderId: string, roomId: string, content: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        if (!this.participants.has(senderId)) {
            return;
        }

        const recipientId = Array.from(this.participants).find((id) => id !== senderId);

        if (recipientId) {
            const canSend = await this.canSendMessage(senderId, recipientId);
            if (!canSend) {
                return;
            }
        }

        const message = chatMessageSchema.parse({
            id: crypto.randomUUID(),
            type: 'chat',
            content,
            roomId: this.roomId,
            senderId,
            timestamp: Date.now()
        });

        await this.storeMessage(message);
        await this.broadcastMessage(message);
    }

    private async canSendMessage(senderId: string, recipientId: string): Promise<boolean> {
        const db = drizzle(this.env.DB);

        const [blockedBySender, blockedByRecipient] = await Promise.all([
            db
                .select()
                .from(blockedUsersTable)
                .where(and(eq(blockedUsersTable.blockerId, senderId), eq(blockedUsersTable.blockedId, recipientId)))
                .limit(1),
            db
                .select()
                .from(blockedUsersTable)
                .where(and(eq(blockedUsersTable.blockerId, recipientId), eq(blockedUsersTable.blockedId, senderId)))
                .limit(1)
        ]);

        if (blockedBySender.length > 0 || blockedByRecipient.length > 0) {
            return false;
        }

        const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, recipientId)).limit(1);

        if (!settings) {
            return true;
        }

        if (settings.messagingPermission === 'none') {
            return false;
        }

        if (settings.messagingPermission === 'followers') {
            const [following] = await db
                .select()
                .from(usersFollowersTable)
                .where(and(eq(usersFollowersTable.userId, senderId), eq(usersFollowersTable.followedUserId, recipientId)))
                .limit(1);

            return following !== undefined;
        }

        return true;
    }

    async getRoomHistory(roomId: string): Promise<ChatMessage[]> {
        this.roomId = roomId;

        const history = (await this.storage.get<ChatMessage[]>(MESSAGES_KEY)) || [];

        return history;
    }

    private async loadParticipants() {
        const storedParticipants = (await this.storage.get<string[]>(PARTICIPANTS_KEY)) || [];
        this.participants = new Set(storedParticipants);
    }

    private async saveParticipants() {
        await this.storage.put(PARTICIPANTS_KEY, Array.from(this.participants));
    }

    private async storeMessage(message: ChatMessage) {
        const history = (await this.storage.get<ChatMessage[]>(MESSAGES_KEY)) || [];
        history.push(message);

        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }

        await this.storage.put(MESSAGES_KEY, history);

        const db = drizzle(this.env.DB);
        const { messagesTable } = schema;

        const receiverId = Array.from(this.participants).find((id) => id !== message.senderId);

        if (receiverId) {
            await db.insert(messagesTable).values({
                senderId: message.senderId,
                receiverId: receiverId,
                content: message.content,
                createdAt: new Date(message.timestamp).toISOString()
            });
        }
    }

    private async broadcastMessage(message: WebSocketMessage, excludeUserId?: string) {
        const participantList = Array.from(this.participants);

        for (const participantId of participantList) {
            if (excludeUserId && participantId === excludeUserId) {
                continue;
            }

            try {
                const id = this.env.UserDO.idFromName(`user:${participantId}`);
                const stub = this.env.UserDO.get(id);
                await stub.sendMessage(message);
            } catch {
                this.participants.delete(participantId);
                await this.saveParticipants();
            }
        }
    }

    async getStorageForDebug() {
        try {
            const list = await this.storage.list();

            const storage = Array.from(list.entries()).map(([key, value]) => ({
                [key]: value
            }));

            return storage;
        } catch (error) {
            throw new Error(`Failed to retrieve storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
