import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { getUserById } from "../users/user"

const db = new SQLDatabase("articles", { migrations: "./migrations" });

interface Article {
  id: number,
  contenu: string,
  utilisateur: number
}

// Fonction de validation pour les entrées
function validateContenu(contenu: string): void {
  if (!contenu || typeof contenu !== "string" || contenu.length < 3) {
    throw APIError.invalidArgument('contenu invalide : doit être une chaîne de caractères d\'au moins 3 caractères');
  }
}

  export const allArticles = api({
    method: 'GET',
    path:'/article',
    expose: true
  }, async () : Promise<{articles: Article[]}> => {
    const rows = await db.query`SELECT * FROM articles`;
    const articles: Article[] = [];

    for await (const row of rows) {
      articles.push({id: row.id, contenu: row.contenu, utilisateur: row.utilisateur})
    }
    return { articles }
  });

  export const getArticleById = api({
    method: 'GET',
    path: '/articles/:id',
    expose: true
  }, async ({id}:{id : number}) : Promise<Article> =>{
    const row = await db.queryRow`SELECT * FROM articles WHERE id = ${id}`
    if (!row) throw APIError.notFound('L article nexiste pas')
    return {id: row.id, contenu: row.contenu, utilisateur: row.utilisateur}
  });

export const addArticle = api({
  method: 'POST',
  path: '/article',
  expose: true,
}, async ({ contenu, utilisateur }: { contenu: string, utilisateur: number }) => {
  try {
    // Vérifie si l'utilisateur existe
    const user = await getUserById({ id: utilisateur });
    validateContenu(contenu);

    // Si l'utilisateur existe, ajoute l'article
    const row = await db.queryRow`
      INSERT INTO articles (contenu, utilisateur)
      VALUES (${contenu}, ${utilisateur})
      RETURNING id, contenu, utilisateur
    `;

    if (!row) {
      throw APIError.internal('Erreur lors de l\'ajout de l\'article');
    }

    return { id: row.id, contenu: row.contenu, utilisateur: row.utilisateur };
  } catch (error) {
    console.error(error);
    // Gestion de l'erreur si l'utilisateur n'existe pas
    if (error instanceof APIError && error.name === "notFound") {
      throw APIError.notFound('Utilisateur non trouvé pour cet article');
    }
    // Gère toute autre erreur
    throw APIError.internal('Erreur lors de l\'ajout de l\'article');
  }
});


