export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API operando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
