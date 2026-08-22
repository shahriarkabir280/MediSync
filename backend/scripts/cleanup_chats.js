
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanupChats() {
    console.log('🧹 Starting Chat System Cleanup...');

    try {
        // 1. Identify all chats
        const { data: chats, error: chatsErr } = await supabase.from('chats').select('id, type');
        if (chatsErr) throw chatsErr;

        console.log(`Checking ${chats.length} chats...`);

        for (const chat of chats) {
            // Get participants for this chat
            const { data: participants } = await supabase
                .from('chat_participants')
                .select('id, user_id, user_type')
                .eq('chat_id', chat.id);

            // Rule A: Private chats MUST have 2 participants
            if (chat.type === 'private') {
                if (!participants || participants.length < 2) {
                    console.log(`🗑️ Deleting orphan private chat ${chat.id} (Participants: ${participants?.length || 0})`);
                    await supabase.from('chats').delete().eq('id', chat.id);
                    continue;
                }
            }

            // Rule B: Remove legacy numeric IDs if they are mixed with new ones OR just old
            const hasLegacyId = participants.some(p => !p.user_id.includes('-') && p.user_id.length < 5);
            if (hasLegacyId) {
                console.log(`🗑️ Deleting legacy chat ${chat.id} (contains numeric IDs: ${participants.map(p => p.user_id).join(', ')})`);
                await supabase.from('chats').delete().eq('id', chat.id);
            }
        }

        console.log('✅ Chat cleanup complete.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanupChats();
