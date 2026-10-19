import jwt from 'jsonwebtoken';

export const ROLES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  DIAGNOSTIC: 'diagnostic',
};

// Bearer header for API calls; ?token= for resources loaded by <img>, <iframe> or window.open,
// which cannot send headers.
export const getRequestToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (typeof req.query?.token === 'string') return req.query.token;
  return null;
};

// Doctor tokens issued before roles were added carry only doctorId.
export const identityFromPayload = (payload) => {
  const role = payload.role || (payload.doctorId ? ROLES.DOCTOR : payload.patientId ? ROLES.PATIENT : null);
  const id = role === ROLES.DOCTOR ? payload.doctorId
    : role === ROLES.PATIENT ? payload.patientId
    : payload.id ?? null;
  return { role, id, email: payload.email, name: payload.name };
};

export const verifyToken = (token) => identityFromPayload(jwt.verify(token, process.env.JWT_SECRET));

// authenticate()                      any signed-in user
// authenticate('doctor', 'patient')   only those roles
export const authenticate = (...allowedRoles) => (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let user;
  try {
    user = verifyToken(token);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  if (!user.role || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
  }

  req.user = user;
  if (user.role === ROLES.DOCTOR) req.doctorId = user.id;
  if (user.role === ROLES.PATIENT) req.patientId = user.id;
  next();
};

// A doctor may only act on routes carrying their own :doctorId.
export const requireOwnDoctor = (param = 'doctorId') => (req, res, next) => {
  if (req.user?.role === ROLES.DOCTOR && String(req.params[param]) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'You can only access your own records' });
  }
  next();
};

// A patient may only act on routes carrying their own :patientId; doctors pass through.
export const requireOwnPatient = (param = 'patientId') => (req, res, next) => {
  if (req.user?.role === ROLES.PATIENT && String(req.params[param]) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'You can only access your own records' });
  }
  next();
};

export const doctorOnly = authenticate(ROLES.DOCTOR);
