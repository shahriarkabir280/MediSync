import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function unify() {
    console.log('🚀 Starting ID Unification to DOC-10x sequence...');

    try {
        // 1. Update chat_participants
        console.log('Updating chat_participants...');

        // DOC-001 -> DOC-101
        const { error: p1Err } = await supabase
            .from('chat_participants')
            .update({ user_id: 'DOC-101' })
            .eq('user_id', 'DOC-001');
        if (p1Err) throw p1Err;

        // DOC-002 -> DOC-102
        const { error: p2Err } = await supabase
            .from('chat_participants')
            .update({ user_id: 'DOC-102' })
            .eq('user_id', 'DOC-002');
        if (p2Err) throw p2Err;

        // 2. Update messages
        console.log('Updating messages...');

        // DOC-001 -> DOC-101
        const { error: m1Err } = await supabase
            .from('messages')
            .update({ sender_id: 'DOC-101' })
            .eq('sender_id', 'DOC-001');
        if (m1Err) throw m1Err;

        // DOC-002 -> DOC-102
        const { error: m2Err } = await supabase
            .from('messages')
            .update({ sender_id: 'DOC-102' })
            .eq('sender_id', 'DOC-002');
        if (m2Err) throw m2Err;

        // 3. Update message_status
        console.log('Updating message_status...');

        // DOC-001 -> DOC-101
        const { error: s1Err } = await supabase
            .from('message_status')
            .update({ user_id: 'DOC-101' })
            .eq('user_id', 'DOC-001');
        if (s1Err) throw s1Err;

        // DOC-002 -> DOC-102
        const { error: s2Err } = await supabase
            .from('message_status')
            .update({ user_id: 'DOC-102' })
            .eq('user_id', 'DOC-002');
        if (s2Err) throw s2Err;

        // 4. Identify chats that now have identical participants
        console.log('Merging fragmented chats...');

        // Get all chats between DOC-101 and DOC-102
        const { data: participants } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .in('user_id', ['DOC-101', 'DOC-102'])
            .eq('user_type', 'doctor');

        // Group by chat_id
        const chatCounts = participants.reduce((acc, p) => {
            acc[p.chat_id] = (acc[p.chat_id] || 0) + 1;
            return acc;
        }, {});

        // Chats that have both DOC-101 and DOC-102
        const candidateChats = Object.keys(chatCounts).filter(id => chatCounts[id] >= 2).map(Number);
        console.log('Candidate chats to merge:', candidateChats);

        if (candidateChats.length > 1) {
            const primaryChatId = candidateChats[0];
            const obsoleteChatIds = candidateChats.slice(1);

            console.log(`Merging secondary chats ${obsoleteChatIds} into primary chat ${primaryChatId}`);

            for (const oldId of obsoleteChatIds) {
                // Move messages to primary chat
                const { error: msgMoveErr } = await supabase
                    .from('messages')
                    .update({ chat_id: primaryChatId })
                    .eq('chat_id', oldId);
                if (msgMoveErr) console.error(`Error moving messages from ${oldId}:`, msgMoveErr);

                // Delete obsolete participants
                const { error: partDelErr } = await supabase
                    .from('chat_participants')
                    .delete()
                    .eq('chat_id', oldId);
                if (partDelErr) console.error(`Error deleting participants from ${oldId}:`, partDelErr);

                // Delete obsolete chat record
                const { error: chatDelErr } = await supabase
                    .from('chats')
                    .delete()
                    .eq('id', oldId);
                if (chatDelErr) console.error(`Error deleting chat ${oldId}:`, chatDelErr);
            }
        }

        console.log('✅ Identity unification and chat merging completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

unify();
