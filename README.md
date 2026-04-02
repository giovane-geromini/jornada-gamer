# Jornada Gamer

**Sua história nos jogos**

Jornada Gamer é um app para registrar jogos, acompanhar troféus e visualizar a trajetória gamer do usuário ao longo do tempo.

A proposta do produto é unir:
- biblioteca pessoal de jogos
- progresso por troféus
- histórico temporal
- dashboard analítico
- consulta por jogo, dia, mês e ano

## Objetivo do MVP

Entregar uma primeira versão funcional onde o usuário consiga:

- criar conta com e-mail e senha
- acessar uma biblioteca de jogos PS4 e PS5
- adicionar jogos à própria jornada
- visualizar todos os troféus de um jogo
- marcar troféus conquistados com data e hora
- acompanhar progresso por jogo
- consultar dashboard e histórico por período

## Escopo inicial

### Entra no V1
- autenticação com e-mail e senha
- biblioteca inicial PS4 e PS5
- detalhe do jogo
- lista de troféus
- marcação manual de troféus conquistados
- registro de data e hora da conquista
- dashboard com cartões principais
- histórico por jogo
- histórico por período
- status do jogo
- filtros básicos

### Fica para depois
- integração automática com PSN
- importação automática de troféus
- outras plataformas além de PS4 e PS5
- wishlist separada
- sistema social
- retrospectiva anual automática
- notificações

## Estrutura inicial do banco

- profiles
- games
- trophies
- user_games
- user_trophies

## Telas iniciais do produto

1. Landing page
2. Login / Cadastro
3. Dashboard
4. Biblioteca de jogos
5. Minha Jornada
6. Detalhe do jogo
7. Histórico / Timeline
8. Perfil / Estatísticas

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## Roadmap

### V1 — Fundação funcional
- autenticação
- catálogo PS4/PS5
- vínculo de jogos ao usuário
- listagem de troféus
- marcação manual de troféus
- dashboard inicial
- timeline / histórico

### V1.1 — Qualidade e experiência
- busca e filtros melhores
- progresso visual mais rico
- polish premium
- mais informações no detalhe do jogo
- ajustes de UX nos troféus

### V1.2 — Jornada expandida
- seção “quero jogar”
- notas pessoais por jogo
- favoritos
- status mais refinados
- memória/comentário pessoal por jogo

### V2 — Inteligência e escala
- novas plataformas
- importação semiautomática
- insights do usuário
- retrospectiva anual
- possíveis integrações externas
