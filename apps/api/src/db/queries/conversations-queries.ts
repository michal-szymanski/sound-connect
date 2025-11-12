import { sql } from 'drizzle-orm';
import { conversationsResponseSchema } from '@sound-connect/common/types/conversations';
import { db } from '../index';

type GetConversationsParams = {
    userId: string;
    limit: number;
    offset: number;
};

export const getConversations = async ({ userId, limit, offset }: GetConversationsParams) => {
    const query = sql.raw(`
        WITH conversation_partners AS (
            SELECT DISTINCT
                CASE
                    WHEN sender_id = '${userId}' THEN receiver_id
                    ELSE sender_id
                END as partner_id,
                MAX(created_at) as last_message_at
            FROM messages
            WHERE sender_id = '${userId}' OR receiver_id = '${userId}'
            GROUP BY partner_id
        )
        SELECT
            cp.partner_id as partnerId,
            u.id as partner_id,
            u.name as partner_name,
            u.image as partner_image,
            m.id as last_message_id,
            m.content as last_message_content,
            m.sender_id as last_message_sender_id,
            cp.last_message_at as last_message_created_at,
            (
                SELECT COUNT(*) > 0
                FROM users_followers uf1
                INNER JOIN users_followers uf2
                    ON uf1.followed_user_id = uf2.user_id
                    AND uf1.user_id = uf2.followed_user_id
                WHERE uf1.user_id = '${userId}'
                    AND uf1.followed_user_id = cp.partner_id
            ) as is_mutual_follow
        FROM conversation_partners cp
        LEFT JOIN users u ON u.id = cp.partner_id
        INNER JOIN messages m ON (
            (m.sender_id = '${userId}' AND m.receiver_id = cp.partner_id)
            OR (m.sender_id = cp.partner_id AND m.receiver_id = '${userId}')
        ) AND m.created_at = cp.last_message_at
        LEFT JOIN blocked_users b1
            ON b1.blocker_id = '${userId}' AND b1.blocked_id = cp.partner_id
        LEFT JOIN blocked_users b2
            ON b2.blocker_id = cp.partner_id AND b2.blocked_id = '${userId}'
        WHERE b1.id IS NULL AND b2.id IS NULL
        ORDER BY is_mutual_follow DESC, last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

    const { results } = await db.run(query);

    const countQuery = sql.raw(`
        WITH conversation_partners AS (
            SELECT DISTINCT
                CASE
                    WHEN sender_id = '${userId}' THEN receiver_id
                    ELSE sender_id
                END as partner_id
            FROM messages
            WHERE sender_id = '${userId}' OR receiver_id = '${userId}'
        )
        SELECT COUNT(*) as total
        FROM conversation_partners cp
        LEFT JOIN blocked_users b1
            ON b1.blocker_id = '${userId}' AND b1.blocked_id = cp.partner_id
        LEFT JOIN blocked_users b2
            ON b2.blocker_id = cp.partner_id AND b2.blocked_id = '${userId}'
        WHERE b1.id IS NULL AND b2.id IS NULL
    `);

    const { results: countResults } = await db.run(countQuery);
    const total = (countResults as Array<{ total: number }>)[0]?.total || 0;

    const conversations = (
        results as Array<{
            partnerId: string;
            partner_id: string | null;
            partner_name: string | null;
            partner_image: string | null;
            last_message_id: number;
            last_message_content: string;
            last_message_sender_id: string;
            last_message_created_at: string;
            is_mutual_follow: number;
        }>
    ).map((row) => ({
        partnerId: row.partnerId,
        partner:
            row.partner_id && row.partner_name
                ? {
                      id: row.partner_id,
                      name: row.partner_name,
                      image: row.partner_image
                  }
                : null,
        lastMessage: {
            content: row.last_message_content,
            senderId: row.last_message_sender_id,
            createdAt: row.last_message_created_at
        },
        isMutualFollow: row.is_mutual_follow === 1
    }));

    return conversationsResponseSchema.parse({
        conversations,
        total
    });
};
