export const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            error: "Unauthorized: Please log in to access this resource." 
        });
    }
    
    next();
};