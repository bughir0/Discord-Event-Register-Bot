# Discord Event Bot

Bot em **TypeScript** com **discord.js v14** e **PostgreSQL** para gestão de eventos em servidores Discord: anúncio com embed, participação por **botões** e por **mensagens**, finalização com resumo, relatórios, ranking e exportação (JSON/CSV).

## Autor

**Samuel (hiro)** — projeto autoral.  
Se publicares um fork, mantém a licença e os créditos conforme [LICENSE](./LICENSE).

## Stack

| Tecnologia | Uso |
|------------|-----|
| Node.js 18.17+ | Runtime |
| TypeScript | Linguagem |
| discord.js v14 | API Discord |
| PostgreSQL | Persistência e migrações |

## Funcionalidades principais

- **Eventos ativos** por canal: embed de anúncio com lista de participantes atualizada.
- **Participar da dinâmica** / **Sair da dinâmica** (botões no anúncio, com confirmação onde aplicável).
- Contagem de **mensagens** durante o evento (requer intent de conteúdo de mensagens).
- **Organizador** do evento não entra na lista de participantes da dinâmica (nem por mensagem nem pelo botão).
- **Finalizar** evento: snapshot, embed de agradecimento e agregados mensais.
- Comandos slash **`/evento`** para staff/admin (ver tabela abaixo).
- **Purge por servidor**: apagar todos os dados do bot naquele guild (com confirmação).
- Logs administrativos opcionais (PostgreSQL + canal Discord).

## Requisitos

- **Node.js** 18.17 ou superior  
- **PostgreSQL** 14+ (recomendado)  
- Aplicação **Discord** (bot + permissões adequadas)

## Configuração no Discord Developer Portal

1. Crie uma aplicação e um **Bot**; guarde o **token** (só em `.env`, nunca no Git).
2. Em **OAuth2 → URL Generator**, marque `bot` e `applications.commands`.
3. Em **Bot**, ative **Privileged Gateway Intents**:
   - **MESSAGE CONTENT INTENT** — necessário para contar mensagens nos canais.
4. Convide o bot com permissões mínimas sugeridas: `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Use Slash Commands`, `Attach Files` (exportação).

## Base de dados

Crie a base e um utilizador com permissão **DDL** (as migrações criam/alteram tabelas na primeira execução):

```sql
CREATE DATABASE discord_events;
```

Defina `DATABASE_URL` no `.env` (modelo em [`.env.example`](./.env.example)).

As migrações correm **automaticamente** ao iniciar com `npm start`. Também podes correr:

```bash
npm run migrate
```

## Instalação rápida

```bash
git clone https://github.com/bughir0/Discord-Event-Register-Bot.git
cd Discord-Event-Register-Bot
cp .env.example .env
# Edita .env: DISCORD_TOKEN, DISCORD_CLIENT_ID, DATABASE_URL, etc.

npm install
npm run build
npm run deploy-commands
npm start
```

- **`npm run deploy-commands`**: regista o comando `/evento`. Com `DISCORD_GUILD_ID` preenchido, a atualização no servidor de testes é **rápida**; sem guild, o registo é **global** (pode demorar até ~1h a propagar).
- **`npm run deploy-commands:global`**: script alternativo para deploy global (se existir no teu `package.json`).
- **`npm run dev`**: desenvolvimento com `tsx watch` (migrações em `src/database/migrations`).

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DISCORD_TOKEN` | Sim | Token do bot |
| `DISCORD_CLIENT_ID` | Sim | Application ID (Client ID) |
| `DISCORD_GUILD_ID` | Não | ID do servidor para deploy rápido de comandos slash |
| `DISCORD_GLOBAL_COMMANDS` | Não | `true` / `1`: `deploy-commands` regista sempre comandos **globais** (útil mesmo com `DISCORD_GUILD_ID` definido) |
| `DATABASE_URL` | Sim | URL PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `STAFF_ROLE_IDS` | Não | IDs de cargos staff (vírgula). Se vazio, quem tem **Gerenciar servidor** conta como staff |
| `ADMIN_ROLE_IDS` | Não | Cargos com permissões extra (exportação, purge). Se vazio, só **Gerenciar servidor** |
| `ADMIN_LOG_CHANNEL_ID` | Não | ID do canal para espelhar logs administrativos (além da BD) |

## Comandos slash (`/evento`)

| Subcomando | Quem pode | Função |
|------------|-----------|--------|
| `iniciar` | Staff | Inicia evento no canal atual: embed + botões **Participar** / **Sair** |
| `finalizar` | Staff | Encerra evento (ID ou evento ativo no canal) e envia resumo |
| `listar` | Staff | Eventos cujo **início** foi no mês indicado (padrão: mês atual UTC) |
| `detalhes` | Staff | Detalhes e participantes de um evento |
| `relatorio` | Staff | Relatório do mês e totais em `monthly_aggregates` |
| `participacao` | Staff | Quantos eventos um membro participou no servidor |
| `ranking` | Staff | Ranking por mensagens em eventos **finalizados** no mês |
| `exportar` | Admin | Exporta JSON ou CSV do mês |
| `deletar-dados` | Admin | Remove **todos** os dados do bot **nesse servidor** (irreversível, com confirmação) |

## Modelo de dados (resumo)

- **`events`**: metadados, canal, horários, estado (`active` / `ended` / `cancelled`).
- **`event_participants`**: uma linha por utilizador/evento; botão, mensagens e contagens.
- **`event_snapshots`**: totais ao finalizar (histórico estável).
- **`monthly_aggregates`**: agregados por servidor/mês.
- **`admin_logs`**: auditoria de ações sensíveis.

## Produção

- Usa `npm run build` e `node dist/index.js` (ou `npm start`) atrás de **systemd**, **PM2** ou container.
- O processo deve arrancar na **raiz do projeto** (para encontrar `dist/database/migrations` após o build).
- Faz **backup** regular do PostgreSQL.
- Não commits nem partilhes o `.env`. Vê [SECURITY.md](./SECURITY.md).

## Estrutura do código

```
src/
  index.ts              # Entrada, intents, listeners
  context.ts            # Serviços partilhados
  config/env.ts
  database/             # Pool, migrações, repositórios
  commands/             # Slash e roteamento
  interactions/         # Botões (participação, purge, etc.)
  listeners/
  services/
  utils/
scripts/copy-migrations.mjs
```

## Enviar para o GitHub (checklist)

1. Confirma que **`.env` não está** a ser commitado (`git status` não deve listar `.env`).
2. Opcional: `git init` se ainda não for repositório Git.
3. Cria o repositório vazio no GitHub (sem README se já tiveres um local).
4. Na pasta do projeto:

```bash
git add .
git commit -m "feat: bot de eventos Discord com PostgreSQL"
git branch -M main
git remote add origin https://github.com/bughir0/Discord-Event-Register-Bot.git
git push -u origin main
```

5. No GitHub: define **description**, **topics** sugeridos: `discord`, `discord-bot`, `typescript`, `postgresql`, `discord-js`, `events`.

## Contribuir e segurança

- [CONTRIBUTING.md](./CONTRIBUTING.md)  
- [SECURITY.md](./SECURITY.md)

## Licença

[MIT](./LICENSE) — uso livre com preservação do aviso de copyright.
