import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  // Esperado: "Bearer <token>"
  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido. Use "Bearer TOKEN".' });
  }

  const token = partes[1];

  try {
    const secreto = process.env.JWT_SECRET || 'clave_secreta_jwt_super_segura_para_el_isp';
    const verificado = jwt.verify(token, secreto);
    req.user = verificado;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export const esAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Permisos insuficientes. Se requiere rol de Administrador.' });
  }
};
