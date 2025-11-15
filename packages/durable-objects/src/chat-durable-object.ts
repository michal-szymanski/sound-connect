import { ChatMessage, chatMessageSchema, WebSocketMessage, SystemMessage, systemMessageSchema } from '@sound-connect/common/types/models';
import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, gte } from 'drizzle-orm';
import { schema } from '@sound-connect/drizzle';

const { userSettingsTable, blockedUsersTable, usersFollowersTable, messagesTable, chatRoomParticipantsTable, chatRoomsTable, bandsMembersTable } = schema;

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

        this.participants.add(userId);

        const [type, identifier] = roomId.split(':');

        if (type === 'dm' && identifier) {
            const roomUserIds = identifier.split('-');

            for (const id of roomUserIds) {
                if (id && id !== userId) {
                    this.participants.add(id);
                }
            }
        } else if (type === 'band' && identifier) {
            this.participants.add(identifier);
        }

        await this.ensureRoomExists(roomId);

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

        this.participants.delete(userId);

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

        if (!this.participants.has(senderId)) {
            console.error('[ChatDO] Sender not in participants - attempting to add from database');

            await this.ensureParticipantsLoaded(roomId, senderId);

            if (!this.participants.has(senderId)) {
                console.error('[ChatDO] Sender still not in participants after DB check - aborting');
                return;
            }
        }

        const isBandRoom = roomId.startsWith('band:');

        if (isBandRoom) {
            const isMember = await this.isParticipant(senderId, roomId);
            if (!isMember) {
                console.error('[ChatDO] User not a room participant - aborting');
                return;
            }
        } else {
            const recipientId = Array.from(this.participants).find((id) => id !== senderId);

            if (recipientId) {
                const canSend = await this.canSendMessage(senderId, recipientId);
                if (!canSend) {
                    console.error('[ChatDO] Permission denied - cannot send message');
                    return;
                }
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

    async getRoomHistory(roomId: string, userId?: string): Promise<(ChatMessage | SystemMessage)[]> {
        this.roomId = roomId;

        try {
            const db = drizzle(this.env.DB);

            if (!userId) {
                console.error('[ChatDO] userId required for room history');
                return [];
            }

            let joinedAt: string;

            if (roomId.startsWith('band:')) {
                const [, identifier] = roomId.split(':');

                if (!identifier) {
                    console.error('[ChatDO] Invalid band room ID format:', roomId);
                    return [];
                }

                const bandId = parseInt(identifier, 10);

                if (isNaN(bandId)) {
                    console.error('[ChatDO] Invalid band ID in room:', roomId);
                    return [];
                }

                const [member] = await db
                    .select({ joinedAt: bandsMembersTable.joinedAt })
                    .from(bandsMembersTable)
                    .where(and(eq(bandsMembersTable.userId, userId), eq(bandsMembersTable.bandId, bandId)))
                    .limit(1);

                if (!member) {
                    console.error('[ChatDO] User not a band member');
                    return [];
                }

                joinedAt = member.joinedAt;
            } else {
                const [participant] = await db
                    .select({ joinedAt: chatRoomParticipantsTable.joinedAt })
                    .from(chatRoomParticipantsTable)
                    .where(and(eq(chatRoomParticipantsTable.chatRoomId, roomId), eq(chatRoomParticipantsTable.userId, userId)))
                    .limit(1);

                if (!participant) {
                    console.error('[ChatDO] User not a participant');
                    return [];
                }

                joinedAt = participant.joinedAt;
            }

            const messages = await db
                .select()
                .from(messagesTable)
                .where(and(eq(messagesTable.chatRoomId, roomId), gte(messagesTable.createdAt, joinedAt)))
                .orderBy(desc(messagesTable.createdAt))
                .limit(100);

            return messages.reverse().map((msg) => ({
                id: msg.id,
                type: msg.messageType === 'system' ? ('system' as const) : ('chat' as const),
                content: msg.content,
                roomId: roomId,
                senderId: msg.senderId || 'system',
                timestamp: new Date(msg.createdAt).getTime()
            }));
        } catch (error) {
            console.error('[ChatDO] Failed to retrieve room history:', error);
            return [];
        }
    }

    private async storeMessage(message: ChatMessage | SystemMessage) {
        try {
            const db = drizzle(this.env.DB);

            await this.ensureRoomExists(this.roomId!);

            await db.insert(messagesTable).values({
                id: crypto.randomUUID(),
                chatRoomId: this.roomId!,
                senderId: message.type === 'system' ? null : message.senderId,
                messageType: message.type === 'system' ? 'system' : 'message',
                content: message.content,
                createdAt: new Date(message.timestamp).toISOString()
            });
        } catch (error) {
            console.error('[ChatDO] Failed to store message in database:', error);
            console.error('[ChatDO] Message details:', {
                senderId: message.type === 'system' ? 'system' : message.senderId,
                roomId: this.roomId,
                participants: Array.from(this.participants)
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
            }
        }
    }

    private async isParticipant(userId: string, chatRoomId: string): Promise<boolean> {
        const db = drizzle(this.env.DB);

        if (chatRoomId.startsWith('band:')) {
            const [, identifier] = chatRoomId.split(':');

            if (!identifier) {
                console.error('[ChatDO] Invalid band room ID format:', chatRoomId);
                return false;
            }

            const bandId = parseInt(identifier, 10);

            if (isNaN(bandId)) {
                console.error('[ChatDO] Invalid band ID in room:', chatRoomId);
                return false;
            }

            const [member] = await db
                .select()
                .from(bandsMembersTable)
                .where(and(eq(bandsMembersTable.userId, userId), eq(bandsMembersTable.bandId, bandId)))
                .limit(1);

            return member !== undefined;
        }

        const [participant] = await db
            .select()
            .from(chatRoomParticipantsTable)
            .where(and(eq(chatRoomParticipantsTable.userId, userId), eq(chatRoomParticipantsTable.chatRoomId, chatRoomId)))
            .limit(1);

        return participant !== undefined;
    }

    async removeMember(bandId: number, userId: string): Promise<void> {
        const roomId = `band:${bandId}`;
        this.roomId = roomId;

        this.participants.delete(userId);

        const systemMessage = systemMessageSchema.parse({
            type: 'system',
            content: 'User left the band',
            roomId: roomId,
            userId,
            timestamp: Date.now()
        });

        await this.storeMessage(systemMessage);
        await this.broadcastMessage(systemMessage);
    }

    private async ensureParticipantsLoaded(chatRoomId: string, _requestingUserId: string): Promise<void> {
        const [type, identifier] = chatRoomId.split(':');

        if (type === 'dm' && identifier) {
            const roomUserIds = identifier.split('-');

            for (const id of roomUserIds) {
                if (id) {
                    this.participants.add(id);
                }
            }
        } else if (type === 'band' && identifier) {
            const db = drizzle(this.env.DB);

            const bandId = parseInt(identifier, 10);
            if (isNaN(bandId)) {
                console.error('[ChatDO] Invalid band ID in room:', chatRoomId);
                return;
            }

            const participants = await db.select({ userId: bandsMembersTable.userId }).from(bandsMembersTable).where(eq(bandsMembersTable.bandId, bandId));

            for (const participant of participants) {
                this.participants.add(participant.userId);
            }
        }
    }

    private async ensureRoomExists(chatRoomId: string): Promise<void> {
        const db = drizzle(this.env.DB);

        const [existingRoom] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, chatRoomId)).limit(1);

        if (existingRoom) {
            return;
        }

        const isBandRoom = chatRoomId.startsWith('band:');
        const roomType = isBandRoom ? 'band' : 'direct';

        await db.insert(chatRoomsTable).values({
            id: chatRoomId,
            type: roomType,
            createdAt: new Date().toISOString()
        });

        if (!isBandRoom) {
            const participants = Array.from(this.participants);
            for (const participantId of participants) {
                const [existingParticipant] = await db
                    .select()
                    .from(chatRoomParticipantsTable)
                    .where(and(eq(chatRoomParticipantsTable.chatRoomId, chatRoomId), eq(chatRoomParticipantsTable.userId, participantId)))
                    .limit(1);

                if (!existingParticipant) {
                    await db.insert(chatRoomParticipantsTable).values({
                        chatRoomId,
                        userId: participantId,
                        joinedAt: new Date().toISOString()
                    });
                }
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
