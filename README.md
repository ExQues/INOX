# INOX Game Creator

INOX Game Creator é uma plataforma de desenvolvimento de jogos impulsionada por IA.
Ela permite que usuários criem, editem e gerenciem projetos de jogos diretamente do navegador, integrando-se com motores gráficos e oferecendo uma experiência fluida para prototipação e desenvolvimento.

## Funcionalidades Principais

- **Dashboard de Projetos**: Gerencie seus projetos ativos, rascunhos e projetos arquivados.
- **Desenvolvimento Guiado por IA**: SDKs de Inteligência Artificial integrados (OpenAI, Anthropic) para ajudar na criação de lógicas, assets e scripts.
- **Integração com Motores**: Suporte e scripts utilitários para integração com a Unreal Engine e visualizações Web.
- **Backend Escalável**: API Express com Supabase para autenticação e armazenamento de dados.

## Tecnologias Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (Gerenciamento de Estado)
- Three.js & Cannon.js (Para visualização e física web)

### Backend
- Node.js & Express
- Supabase (Auth, Database, Storage)
- Integrações de IA (OpenAI SDK, Anthropic SDK)

## Como Rodar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente baseadas no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Preencha as chaves do Supabase e as APIs de IA necessárias.

3. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
   Este comando inicia tanto o servidor frontend (Vite) quanto o backend (Express via Nodemon).

## Estrutura do Projeto

- `/src`: Código-fonte do frontend React.
- `/api`: Servidor backend Express e rotas.
- `/supabase`: Configurações e migrations do banco de dados.
- `/ue_scripts`: Scripts para integração com Unreal Engine.
- `/Source` & `/Config`: Arquivos de projeto da Unreal Engine (INOXSurvival).

## Contribuição

Para contribuir, crie uma branch, faça as alterações e abra um Pull Request detalhando suas modificações.
