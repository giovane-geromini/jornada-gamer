# MVP Backend Status — Jornada Gamer

## Status atual
Backend base validado com sucesso no Supabase.

---

## Estrutura criada
Tabelas disponíveis no schema público:

- `games`
- `game_platforms`
- `trophy_lists`
- `trophies`
- `user_games`
- `user_trophies`
- `game_covers`
- `profiles`

---

## Fluxos já validados

### Catálogo
- cadastro de jogo
- cadastro de plataforma por jogo
- cadastro de trophy list
- cadastro de troféus
- cadastro de capa

### Jornada do usuário
- vínculo do usuário com o jogo em `user_games`
- registro manual de troféus conquistados em `user_trophies`
- timeline de troféus por jogo
- progresso calculado por jogo

### Backend funcional
- query de progresso por jogo validada
- função SQL/RPC `earn_trophy` criada e testada
- view `v_user_game_progress` criada e validada

---

## Jogos piloto cadastrados

### Astro's Playroom
- `game_id`: `5f9ace62-312e-4b96-ac40-26aa70dc05b4`
- `trophy_list_id`: `30bd5b6c-99a3-4a8a-8bb0-a2613ea4d70a`

Estado validado:
- progresso calculado corretamente
- troféus registrados para o usuário

### The Last of Us Part I
- `game_id`: `94c873f3-355c-41ee-8060-adc7c13d9bf8`
- `trophy_list_id`: `0f4c2b09-f5ef-47ae-9112-334ef5a8c75f`

Estado validado:
- progresso calculado corretamente
- troféus registrados para o usuário
- integração com função `earn_trophy` validada

---

## Usuário de teste

- `profile_id`: `ae3477bf-41d0-4a02-8ef8-7e8bea096d28`
- `email`: `teste@gamer.com`
- `display_name`: `Gio Gamer`

---

## View pronta para o dashboard

### `public.v_user_game_progress`

Campos disponíveis:
- `user_id`
- `game_id`
- `title`
- `slug`
- `cover_url`
- `platform_name`
- `status`
- `total_trophies`
- `earned_trophies`
- `progress_percent`

Estado atual validado:
- Astro's Playroom → 60%
- The Last of Us Part I → 60%

---

## Função pronta para ação do app

### `public.earn_trophy(p_user_id uuid, p_trophy_id uuid)`

Objetivo:
- representar a ação de marcar troféu como conquistado
- servir como base para integração futura com o frontend

Observação:
- a função recebe `trophy_id` individual, não `trophy_list_id`

---

## O que já está pronto para o frontend
O frontend já poderá consumir:

- lista de jogos com progresso por usuário via `v_user_game_progress`
- ação de conquista de troféu via `earn_trophy`
- base relacional completa de jogos e troféus

---

## Próximo passo natural
Quando o projeto voltar para o notebook pessoal:

1. iniciar frontend em Next.js
2. conectar Supabase
3. configurar auth
4. montar dashboard inicial consumindo `v_user_game_progress`
5. criar interface para marcar troféu como conquistado usando `earn_trophy`

---

## Observação final
Esta etapa consolidou a base de backend/MVP no navegador, sem necessidade de ambiente local de desenvolvimento, deixando o projeto pronto para iniciar a camada frontend na próxima fase.
