# Database Schema — Jornada Gamer

## Visão geral
Estrutura base do backend da Jornada Gamer no Supabase para suportar:

- catálogo de jogos
- plataformas por jogo
- listas de troféus
- troféus individuais
- progresso do usuário
- capas e imagens
- visão de dashboard por jogo

---

## Tabelas principais

### `games`
Catálogo principal de jogos.

Campos principais:
- `id`
- `title`
- `slug`
- `release_date`
- `developer`
- `publisher`
- `genre`
- `franchise`
- `description`
- `cover_url`
- `background_url`
- `source_name`
- `source_game_id`
- `source_url`
- `created_at`

---

### `game_platforms`
Relaciona um jogo com uma ou mais plataformas.

Campos principais:
- `id`
- `game_id`
- `platform_name`
- `platform_release_date`
- `has_separate_trophy_list`
- `created_at`

Relacionamento:
- muitos registros de plataforma para um jogo

---

### `trophy_lists`
Lista principal de troféus por jogo/plataforma.

Campos principais:
- `id`
- `game_id`
- `platform_name`
- `list_name`
- `is_base_game`
- `is_dlc`
- `total_bronze`
- `total_silver`
- `total_gold`
- `total_platinum`
- `source_name`
- `source_list_id`
- `created_at`

Relacionamento:
- um jogo pode ter uma ou mais trophy lists

---

### `trophies`
Troféus individuais vinculados a uma trophy list.

Campos principais:
- `id`
- `trophy_list_id`
- `name`
- `description`
- `trophy_type`
- `is_hidden`
- `sort_order`
- `image_url`
- `source_trophy_id`
- `created_at`

Relacionamento:
- uma trophy list possui vários troféus

---

### `user_games`
Relaciona o usuário com os jogos da sua biblioteca/jornada.

Campos principais:
- `id`
- `user_id`
- `game_id`
- `platform_name`
- `status`
- `started_at`
- `finished_at`
- `rating`
- `notes`
- `playthrough_number`
- `created_at`

Status possíveis:
- `backlog`
- `jogando`
- `pausado`
- `zerado`
- `platinado`
- `abandonado`

---

### `user_trophies`
Registra troféus conquistados pelo usuário.

Campos principais:
- `id`
- `user_id`
- `trophy_id`
- `earned_at`
- `screenshot_url`
- `notes`
- `created_at`

Restrição:
- combinação única de `user_id` + `trophy_id`

---

### `game_covers`
Armazena capas e outras imagens relacionadas aos jogos.

Campos principais:
- `id`
- `game_id`
- `image_url`
- `image_type`
- `is_primary`
- `source_name`
- `created_at`

Tipos previstos:
- `cover`
- `background`
- `banner`
- `poster`

---

### `profiles`
Tabela de perfil do usuário utilizada para identificação do jogador no sistema.

Campos observados:
- `id`
- `email`
- `display_name`
- `created_at`

---

## View criada

### `v_user_game_progress`
View pública criada para servir como base do dashboard do app.

Campos validados:
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

Objetivo:
- simplificar a leitura do frontend
- evitar repetir query complexa no app
- servir como base para cards do dashboard

---

## Função criada

### `earn_trophy(p_user_id uuid, p_trophy_id uuid)`
Função SQL/RPC criada para registrar conquista de troféu pelo usuário.

Objetivo:
- representar a ação real do app de “marcar troféu como conquistado”
- permitir consumo futuro pelo frontend via Supabase

---

## Relações principais

- `games` 1:N `game_platforms`
- `games` 1:N `trophy_lists`
- `trophy_lists` 1:N `trophies`
- `games` 1:N `game_covers`
- `games` 1:N `user_games`
- `trophies` 1:N `user_trophies`
- `profiles.id` / usuário -> relacionado a `user_games.user_id` e `user_trophies.user_id`

---

## Objetivo desta modelagem
A estrutura foi pensada para suportar o MVP inicial da Jornada Gamer e permitir evolução futura para:

- timeline de conquistas
- biblioteca gamer pessoal
- progresso por jogo
- filtros por status
- dashboard visual
- registro manual e futuro enriquecimento por importação/API
