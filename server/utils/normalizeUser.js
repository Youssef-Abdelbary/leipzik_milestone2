export function resolveUserFullname(user = {}) {
  return (user.fullname || user.fullName || "").trim();
}

export function normalizeUserRecord(user) {
  const { fullName, ...rest } = user;

  return {
    ...rest,
    fullname: resolveUserFullname(user),
  };
}
