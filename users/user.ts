import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("userv2", { migrations: "./migrations" });

interface User {
  id: number;
  pseudo: string;
}

// Fonction de validation pour les entrées
function validatePseudo(pseudo: string): void {
  if (!pseudo || typeof pseudo !== "string" || pseudo.length < 3) {
    throw APIError.invalidArgument('Pseudo invalide : doit être une chaîne de caractères d\'au moins 3 caractères');
  }
}

// Récupérer tous les utilisateurs
export const allUsers = api({
  method: 'GET',
  path: '/users',
  expose: true,
}, async (): Promise<{ users: User[] }> => {
  const rows = await db.query`SELECT * FROM users`;
  const users: User[] = [];

  for await (const row of rows) {
    users.push({ id: row.id, pseudo: row.pseudo });
  }

  return { users }; // Retourner un objet avec la liste des utilisateurs
});

// Récupérer un utilisateur par son pseudo
export const getUserByPseudo = api({
  method: 'GET',
  path: '/users/pseudo/:pseudo',
  expose: true,
}, async ({ pseudo }: { pseudo: string }): Promise<User> => {
  // Validation du pseudo pour prévenir les injections et erreurs
  validatePseudo(pseudo);

  const row = await db.queryRow`SELECT * FROM users WHERE pseudo = ${pseudo}`;

  if (!row) throw APIError.notFound('Utilisateur non trouvé');

  return { id: row.id, pseudo: row.pseudo };
});

export const getUserById = api({
  method: 'GET',
  path: '/users/id/:id',
  expose: true,
}, async ({ id }: { id: number }): Promise<User> => {


  const row = await db.queryRow`SELECT * FROM users WHERE id = ${id}`;

  if (!row) throw APIError.notFound('Utilisateur non trouvé');

  return { id: row.id, pseudo: row.pseudo };
});

// Ajouter un nouvel utilisateur
export const addUser = api({
  method: 'POST',
  path: '/users',
  expose: true,
}, async ({ pseudo }: { pseudo: string }): Promise<User> => {
  // Validation du pseudo
  validatePseudo(pseudo);

  try {
    const row = await db.queryRow`
      INSERT INTO users (pseudo)
      VALUES (${pseudo})
      RETURNING id
    `;

    if (!row) throw APIError.internal('Erreur lors de l\'ajout de l\'utilisateur');

    return { id: row.id, pseudo };
  } catch (error) {
    throw APIError.internal('Une erreur est survenue lors de l\'ajout de l\'utilisateur');
  }
});
