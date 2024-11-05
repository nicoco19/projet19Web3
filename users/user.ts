import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("url", { migrations: "./migrations" });

interface User {
  id: number; // ID de l'utilisateur
  pseudo: string; // Pseudo de l'utilisateur
}

// Récupérer tous les utilisateurs
export const allUsers = api({
  method: 'GET',
  path: '/users',
  expose: true
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
  path: '/users/:pseudo',
  expose: true
}, async ({ pseudo }: { pseudo: string }): Promise<User> => {
  const row = await db.queryRow`SELECT * FROM users WHERE pseudo = ${pseudo}`;

  if (!row) throw APIError.notFound('Utilisateur non trouvé');

  return { id: row.id, pseudo: row.pseudo };
});

// Ajouter un nouvel utilisateur
export const addUser = api({
  method: 'POST',
  path: '/users',
  expose: true
}, async ({ pseudo }: { pseudo: string }): Promise<User> => {
  const row = await db.queryRow`
    INSERT INTO users (pseudo)
    VALUES (${pseudo})
    RETURNING id
  `;

  if (!row) throw APIError.notFound('Erreur lors de l ajout de l utilisateur');

  return { id: row.id, pseudo };
});
