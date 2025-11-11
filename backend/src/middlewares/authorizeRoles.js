export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // console.log("req.user is empty")
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
        // 403 - forbidden
      // console.log("req.user is present")
      // console.log(req.user.role)
      return res.status(403).json({ message: 'Access Denied: Insufficient Role' });
    }
    next();
  };
}