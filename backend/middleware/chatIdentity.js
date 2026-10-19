import { supabase } from '../config/db.js';

// Chat identifies doctors by doctors.unique_id rather than the numeric id in the JWT.
const uniqueIdCache = new Map();

export const getDoctorChatId = async (doctorId) => {
  if (uniqueIdCache.has(doctorId)) return uniqueIdCache.get(doctorId);

  const { data, error } = await supabase
    .from('doctors')
    .select('unique_id')
    .eq('id', doctorId)
    .maybeSingle();

  if (error || !data?.unique_id) return null;
  uniqueIdCache.set(doctorId, data.unique_id);
  return data.unique_id;
};

// Pairs of [id field, type field] through which chat requests claim "who I am".
const SELF_FIELDS = [
  ['userId', 'userType'],
  ['myUserId', 'myUserType'],
  ['senderId', 'senderType'],
  ['adminId', 'adminType'],
  ['currentUserId', null],
];

const claimsOtherUser = (source, chatId, numericId) => {
  if (!source || typeof source !== 'object') return false;
  return SELF_FIELDS.some(([idField, typeField]) => {
    const claimedId = source[idField];
    const claimedType = typeField ? source[typeField] : undefined;
    const idMismatch = claimedId != null && claimedId !== '' &&
      String(claimedId) !== String(chatId) && String(claimedId) !== String(numericId);
    const typeMismatch = claimedType != null && claimedType !== '' && claimedType !== 'doctor';
    return idMismatch || typeMismatch;
  });
};

// Rejects chat requests that act on behalf of someone other than the signed-in doctor.
// Must run after doctorOnly.
export const requireOwnChatIdentity = async (req, res, next) => {
  try {
    const chatId = await getDoctorChatId(req.user.id);
    if (!chatId) {
      return res.status(403).json({ success: false, message: 'No chat identity for this account' });
    }
    req.chatUserId = chatId;

    const sources = [req.query, req.body, req.body?.creator];
    if (sources.some((source) => claimsOtherUser(source, chatId, req.user.id))) {
      return res.status(403).json({ success: false, message: 'You can only act as yourself in chat' });
    }
    next();
  } catch (error) {
    next(error);
  }
};
