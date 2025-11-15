import { sql } from 'drizzle-orm';
import { conversationsResponseSchema, type ConversationDTO } from '@sound-connect/common/types/conversations';
import { db } from '../index';

type GetConversationsParams = {
    userId: string;
    limit: number;
    offset: number;
};

export const getConversations = async ({ userId, limit, offset }: GetConversationsParams) => {
    const query = sql.raw(`
        WITH user_rooms AS (
            SELECT
                cr.id as room_id,
                cr.type as room_type,
                MAX(m.created_at) as last_message_at
            FROM chat_room_participants crp
            INNER JOIN chat_rooms cr ON cr.id = crp.chat_room_id
            LEFT JOIN messages m ON m.chat_room_id = cr.id
            WHERE crp.user_id = '${userId}'
            GROUP BY cr.id, cr.type

            UNION

            SELECT
                'band:' || bm.band_id as room_id,
                'band' as room_type,
                MAX(m.created_at) as last_message_at
            FROM bands_members bm
            LEFT JOIN messages m ON m.chat_room_id = 'band:' || bm.band_id
            WHERE bm.user_id = '${userId}'
            GROUP BY bm.band_id
        )
        SELECT
            ur.room_type as conversation_type,
            CASE
                WHEN ur.room_type = 'direct' THEN (
                    SELECT crp2.user_id
                    FROM chat_room_participants crp2
                    WHERE crp2.chat_room_id = ur.room_id
                        AND crp2.user_id != '${userId}'
                    LIMIT 1
                )
                ELSE NULL
            END as partnerId,
            CASE
                WHEN ur.room_type = 'band' THEN CAST(SUBSTR(ur.room_id, 6) AS INTEGER)
                ELSE NULL
            END as bandId,
            u.id as partner_id,
            u.name as partner_name,
            u.image as partner_image,
            b.id as band_id_data,
            b.name as band_name,
            b.profile_image_url as band_image,
            (SELECT COUNT(*) FROM bands_members WHERE band_id = CAST(SUBSTR(ur.room_id, 6) AS INTEGER)) as band_member_count,
            m.content as last_message_content,
            m.sender_id as last_message_sender_id,
            CASE
                WHEN ur.room_type = 'band' THEN mu.name
                ELSE NULL
            END as last_message_sender_name,
            ur.last_message_at as last_message_created_at,
            CASE
                WHEN ur.room_type = 'direct' THEN (
                    SELECT COUNT(*) > 0
                    FROM users_followers uf1
                    INNER JOIN users_followers uf2
                        ON uf1.followed_user_id = uf2.user_id
                        AND uf1.user_id = uf2.followed_user_id
                    WHERE uf1.user_id = '${userId}'
                        AND uf1.followed_user_id = (
                            SELECT crp2.user_id
                            FROM chat_room_participants crp2
                            WHERE crp2.chat_room_id = ur.room_id
                                AND crp2.user_id != '${userId}'
                            LIMIT 1
                        )
                )
                ELSE 0
            END as is_mutual_follow
        FROM user_rooms ur
        LEFT JOIN users u ON ur.room_type = 'direct' AND u.id = (
            SELECT crp2.user_id
            FROM chat_room_participants crp2
            WHERE crp2.chat_room_id = ur.room_id
                AND crp2.user_id != '${userId}'
            LIMIT 1
        )
        LEFT JOIN bands b ON ur.room_type = 'band' AND b.id = CAST(SUBSTR(ur.room_id, 6) AS INTEGER)
        LEFT JOIN messages m ON m.chat_room_id = ur.room_id AND m.created_at = ur.last_message_at
        LEFT JOIN users mu ON mu.id = m.sender_id
        LEFT JOIN blocked_users b1
            ON ur.room_type = 'direct' AND b1.blocker_id = '${userId}' AND b1.blocked_id = u.id
        LEFT JOIN blocked_users b2
            ON ur.room_type = 'direct' AND b2.blocker_id = u.id AND b2.blocked_id = '${userId}'
        WHERE ur.last_message_at IS NOT NULL
            AND ((ur.room_type = 'band') OR (b1.id IS NULL AND b2.id IS NULL))
        ORDER BY last_message_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `);

    const { results } = await db.run(query);

    const countQuery = sql.raw(`
        WITH user_rooms AS (
            SELECT
                cr.id,
                cr.type,
                MAX(m.created_at) as last_message_at
            FROM chat_room_participants crp
            INNER JOIN chat_rooms cr ON cr.id = crp.chat_room_id
            LEFT JOIN messages m ON m.chat_room_id = cr.id
            WHERE crp.user_id = '${userId}'
            GROUP BY cr.id, cr.type

            UNION

            SELECT
                'band:' || bm.band_id as id,
                'band' as type,
                MAX(m.created_at) as last_message_at
            FROM bands_members bm
            LEFT JOIN messages m ON m.chat_room_id = 'band:' || bm.band_id
            WHERE bm.user_id = '${userId}'
            GROUP BY bm.band_id
        )
        SELECT
            (
                SELECT COUNT(*)
                FROM user_rooms ur
                LEFT JOIN users u ON ur.type = 'direct' AND u.id = (
                    SELECT crp2.user_id
                    FROM chat_room_participants crp2
                    WHERE crp2.chat_room_id = ur.id
                        AND crp2.user_id != '${userId}'
                    LIMIT 1
                )
                LEFT JOIN blocked_users b1
                    ON ur.type = 'direct' AND b1.blocker_id = '${userId}' AND b1.blocked_id = u.id
                LEFT JOIN blocked_users b2
                    ON ur.type = 'direct' AND b2.blocker_id = u.id AND b2.blocked_id = '${userId}'
                WHERE ur.last_message_at IS NOT NULL
                    AND ((ur.type = 'band') OR (b1.id IS NULL AND b2.id IS NULL))
            ) as total
    `);

    const { results: countResults } = await db.run(countQuery);
    const total = (countResults as Array<{ total: number }>)[0]?.total || 0;

    const conversations: ConversationDTO[] = (
        results as Array<{
            conversation_type: 'direct' | 'band';
            partnerId: string | null;
            bandId: number | null;
            partner_id: string | null;
            partner_name: string | null;
            partner_image: string | null;
            band_id_data: number | null;
            band_name: string | null;
            band_image: string | null;
            band_member_count: number | null;
            last_message_content: string;
            last_message_sender_id: string;
            last_message_sender_name: string | null;
            last_message_created_at: string;
            is_mutual_follow: number;
        }>
    ).map((row) => {
        if (row.conversation_type === 'direct') {
            return {
                type: 'user' as const,
                partnerId: row.partnerId!,
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
            };
        }
        return {
            type: 'band' as const,
            bandId: row.bandId!,
            band: {
                id: row.band_id_data!,
                name: row.band_name!,
                image: row.band_image,
                memberCount: row.band_member_count || 0
            },
            lastMessage: {
                content: row.last_message_content,
                senderId: row.last_message_sender_id,
                senderName: row.last_message_sender_name ?? undefined,
                createdAt: row.last_message_created_at
            }
        };
    });

    return conversationsResponseSchema.parse({
        conversations,
        total
    });
};
