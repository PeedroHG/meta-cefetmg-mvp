# Regras de Desenvolvimento — Plataforma Digital META (CEFET-MG)

> **Propósito deste documento:** Centralizar as convenções e regras de desenvolvimento acordadas ao longo da construção do projeto. Este arquivo será atualizado incrementalmente conforme novas decisões forem tomadas.

---

## 1. Controle de Versão e Commits (Git)

- **Padrão Conventional Commits em Português (`pt-BR`):**
  - Todos os commits devem seguir a estrutura do *Conventional Commits* (`<tipo>(<escopo opcional>): <descrição>`), porém com a mensagem escrita **sempre em português (pt-BR)**, no imperativo ou descrevendo claramente a alteração em letras minúsculas.
  - **Tipos permitidos:**
    - `feat`: nova funcionalidade (ex.: `feat(passaporte): adiciona coleta de selo via qr code dinâmico`)
    - `fix`: correção de bug (ex.: `fix(avaliacao): corrige validação de nota do diário de bordo`)
    - `docs`: criação ou atualização de documentação (ex.: `docs: adiciona planejamento visual e regras de desenvolvimento`)
    - `style`: ajustes visuais/formatação que não alteram lógica (ex.: `style(header): ajusta cores do badge por perfil`)
    - `refactor`: refatoração de código sem mudança de comportamento (ex.: `refactor(db): simplifica query de projetos recomendados`)
    - `chore`: configurações, dependências e tarefas de manutenção (ex.: `chore: configura next.js, tailwind e drizzle`)
    - `test`: adição ou ajuste de testes (ex.: `test(credenciamento): adiciona testes de liberação de assinatura`)
