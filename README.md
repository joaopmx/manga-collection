# Mangá Collection

Biblioteca pessoal de mangás: busque títulos (via API pública AniList), adicione-os às suas listas de **Quero Ler**, **Lidos** ou **Dropados**, avalie cada obra e comente sobre volumes específicos.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Prisma](https://www.prisma.io) + PostgreSQL (hospedado no [Neon](https://neon.tech))
- [NextAuth.js](https://authjs.dev) (v5) para autenticação multiusuário (email/senha)
- [AniList API](https://anilist.co/graphiql) (GraphQL) para dados de mangás
- Tailwind CSS

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um banco PostgreSQL gratuito (por exemplo no [Neon](https://neon.tech); para desenvolvimento, use um branch separado do de produção) e configure as variáveis de ambiente copiando o modelo (o `.env` não é versionado):

   ```bash
   cp .env.example .env
   ```

   ```
   DATABASE_URL="<connection string pooled>"
   DATABASE_URL_UNPOOLED="<connection string direct>"
   AUTH_SECRET="<uma string aleatória, ex.: gerada com npx auth secret>"
   ```

3. Aplique as migrações do banco de dados:

   ```bash
   npx prisma migrate deploy
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel + Neon)

O app precisa de servidor e banco, então não roda no GitHub Pages. Para publicá-lo na [Vercel](https://vercel.com):

1. Importe este repositório na Vercel (framework Next.js, detectado automaticamente).
2. Em **Environment Variables**, defina `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct) e `AUTH_SECRET`, usando o branch de **produção** do Neon.
3. O script `vercel-build` aplica as migrações (`prisma migrate deploy`) antes de compilar.

## Funcionalidades

- Cadastro/login de usuários (cada um com seu próprio perfil).
- Página inicial com seções: banner de busca (com o resumo da sua estante quando logado), exploração por gênero (`/?genre=Action`), "Continue lendo" com barras de progresso, mais populares, carrossel de recém-adicionados (até 15 títulos, só formato mangá), ranking dos mais bem avaliados e um resumo da comunidade (números, comentários recentes e maiores estantes). As três seções do AniList vêm de uma única consulta GraphQL, sem conteúdo adulto.
- Busca de mangás por título (dados vêm da API AniList e são importados sob demanda para o banco local).
- Página de detalhes de cada mangá com sinopse, autores, gêneros, nota do AniList.
- Adicionar/mover um mangá entre as listas "Quero Ler", "Lido" e "Dropado".
- Avaliar a obra com uma nota de 1 a 10.
- Comentar sobre a obra: cada comentário mostra foto, nome (com link para o perfil), nota e status de leitura de quem comentou; aviso de spoiler; só o autor edita ou exclui o seu.
- Perfil do usuário com abas mostrando cada lista.

## Observações

- A API AniList é gratuita e não exige chave de API; o rate limit é generoso (~90 requisições/min). Mangás já importados ficam salvos no banco local e não são buscados novamente na API.
- Se a AniList estiver instável, a busca exibe uma mensagem de erro amigável em vez de quebrar a página.
- Idioma: o AniList só fornece a sinopse em inglês, então ela é traduzida automaticamente para português (Google Tradutor, endpoint gratuito e não oficial) na primeira vez que a página do mangá é aberta, e o resultado fica salvo no banco. Se a tradução falhar, a sinopse original em inglês é exibida e uma nova tentativa acontece depois de alguns minutos. Os gêneros usam um dicionário fixo em `src/lib/genres.ts`.
- Volumes de obras em andamento: o AniList não informa o total enquanto a obra está sendo publicada, então o app consulta o MangaUpdates (API gratuita) usando título e ano de início idênticos, e mostra o número como "N volumes (até agora)". Esse valor é reconferido a cada 7 dias, e o AniList assume quando a obra é finalizada. Se nada for encontrado, o total fica desconhecido.
