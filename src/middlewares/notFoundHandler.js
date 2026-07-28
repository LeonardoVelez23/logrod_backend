export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada - ${req.originalUrl}`,
  });
};
