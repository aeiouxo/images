/**
 * 临时调试端点：查看 Redis 中的会话数据
 * 仅用于排查问题，生产环境应删除
 */
import { getDatabase } from "../../utils/databaseAdapter.js";

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new Response(JSON.stringify({ error: 'token parameter required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const db = getDatabase(env);
        const sessionKey = `manage@session@${token}`;
        const sessionStr = await db.get(sessionKey);
        
        if (!sessionStr) {
            return new Response(JSON.stringify({ error: 'session not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 尝试解析
        try {
            const session = JSON.parse(sessionStr);
            console.log('[debug] session data:', JSON.stringify(session));
            console.log('[debug] typeof sessionStr:', typeof sessionStr);
            console.log('[debug] sessionStr raw:', sessionStr);
            console.log('[debug] Date.now():', Date.now());
            console.log('[debug] session.expiresAt:', session.expiresAt);
            console.log('[debug] expired?', Date.now() > session.expiresAt);
            
            return new Response(JSON.stringify({
                sessionKey,
                rawData: sessionStr,
                parsedData: session,
                now: Date.now(),
                isExpired: Date.now() > session.expiresAt,
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (parseErr) {
            return new Response(JSON.stringify({
                error: 'Failed to parse session data',
                rawData: sessionStr,
                parseError: parseErr.message,
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (err) {
        console.error('[debug] error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
