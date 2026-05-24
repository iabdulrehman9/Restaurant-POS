import { getDb } from "../db/index.js";

export const requirePermission = (moduleKey, actionKey) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (user.role === "admin") {
      return next();
    }

    const db = getDb();
    const permission = db
      .prepare(
        "SELECT allowed FROM user_permissions WHERE user_id = ? AND module_key = ? AND action_key = ?"
      )
      .get(user.id, moduleKey, actionKey);

    if (!permission || permission.allowed !== 1) {
      return res.status(403).json({ error: "Permission denied" });
    }

    return next();
  };
};
