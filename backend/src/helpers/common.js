// Valida se o usuário tem perfil de admin
export async function validateAdmin(req, res, next) {
    try {
        const usuario = req.usuario;

        if (usuario.perfil !== 'admin') {
            return res.status(403).json({ error: 'Privilégios insuficientes para realizar esta operação.' });
        }
        next();
    } catch (error) {
        console.error('Erro ao validar perfil de admin:', error);
        throw error;
    }
}

// Valida se o usuário tem perfil de colab ou admin
export async function validateColab(req, res, next) {
    try {
        const usuario = req.usuario;

        if (usuario.perfil !== 'colab' && usuario.perfil !== 'admin') {
            return res.status(403).json({ error: 'Privilégios insuficientes para realizar esta operação.' });
        }
        next();
    } catch (error) {
        console.error('Erro ao validar perfil de colaborador:', error);
        throw error;
    }
}
