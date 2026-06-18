export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}

export function requireSelfParam(...paramNames) {
  return (req, res, next) => {
    if (!req.user?.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const requestedIds = paramNames
      .map((name) => req.params[name])
      .filter(Boolean)
      .map(String);

    if (requestedIds.length === 0) {
      return next();
    }

    const userId = String(req.user.user_id);
    const matches = requestedIds.some((id) => id === userId);

    if (!matches) {
      return res.status(403).json({ message: "Access denied" });
    }

    return next();
  };
}
