# FRAME DIGITAL SALES

Painel comercial da Frame Digital: cadastro de leads, acompanhamento de negociacoes,
registro de vendas, calculo automatico de comissao, metas, ranking e painel
administrativo.

---

## Como rodar

Requisitos: **Node.js 20 ou superior**. Nada mais precisa ser instalado — o banco de
desenvolvimento e SQLite, criado como arquivo dentro do projeto.

```bash
npm install && npm run setup
```

`setup` instala as dependencias do backend e do frontend, cria o banco e popula os
dados de demonstracao. Depois:

```bash
npm run dev
```

- Interface: <http://localhost:5173>
- API: <http://localhost:4000/api>

### Acessos de demonstracao

Senha para todos: `frame@2025`

| Perfil | E-mail |
| --- | --- |
| Administrador | `admin@framedigital.com.br` |
| Vendedor | `joao@framedigital.com.br` |
| Vendedor | `pedro@framedigital.com.br` |
| Vendedor | `lucas@framedigital.com.br` |
| Vendedor | `mariana@framedigital.com.br` |
| Vendedor | `rafael@framedigital.com.br` |

> Troque essas senhas antes de qualquer uso real.

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe API e interface juntos |
| `npm run dev:api` | Sobe apenas a API |
| `npm run dev:web` | Sobe apenas a interface |
| `npm run db:clean` | **Zera a operacao para uso real**: apaga vendedores, leads, clientes, vendas, comissoes e metas, mantendo o administrador e o catalogo de servicos |
| `npm run db:reset` | Recria o banco e popula novamente os dados de demonstracao |
| `npm run db:seed` | Repopula os dados de demonstracao sem recriar o banco |
| `npm test` | Roda os testes das regras de negocio |
| `npm run typecheck` | Verifica os tipos do backend e do frontend |
| `npm run build` | Compila os dois projetos para producao |

Para inspecionar o banco visualmente: `npm --prefix server run db:studio`.

> **Pare a API antes de `db:clean`, `db:reset`, `db:seed` e `build`.** O SQLite nao
> aceita duas escritas concorrentes e, no Windows, o processo em execucao mantem o
> motor do Prisma travado. Rodar com a API no ar deixa a carga pela metade ou faz o
> build falhar com `EPERM`. O seed detecta a carga incompleta e aborta com aviso.

---

## Estrutura

```
server/                      API em Node + Express + TypeScript
  prisma/schema.prisma       Modelo de dados
  prisma/seed.ts             Dados de demonstracao
  src/
    domain/                  Regras puras (percentual de comissao, enumeracoes)
    services/                Regras com banco (motor de comissao, notificacoes)
    controllers/             Um arquivo por recurso
    routes/                  Mapa de rotas e permissoes
    middlewares/             Autenticacao, validacao, tratamento de erro
    schemas/                 Validacao de entrada (Zod)
    lib/                     Prisma, JWT, datas, auditoria, formatacao
    tests/                   Testes das regras de negocio

web/                         Interface em React + TypeScript + Vite
  src/
    pages/                   Uma pagina por item do menu (admin/ em subpasta)
    layouts/                 Sidebar, topo e estrutura da aplicacao
    components/              Tabela, modal, filtros, graficos, indicadores
    hooks/                   Sessao, requisicoes, avisos
    services/api.ts          Cliente HTTP
    utils/                   Formatacao (moeda, datas) e estilos de status
    types/                   Tipos compartilhados com a API
```

---

## Foto do vendedor

Cada vendedor pode enviar a propria foto em **Configuracoes**, e o administrador pode
definir ou trocar a foto de qualquer vendedor em **Administracao > Vendedores**. Sem
foto, o sistema mostra as iniciais sobre a cor escolhida.

A imagem e recortada em quadrado, reduzida para 256x256 e convertida para JPEG **no
navegador** antes do envio (fica em torno de 20 KB). O servidor revalida formato e
tamanho — o preparo no cliente e conveniencia, nao a defesa.

A foto e guardada como data URL na coluna `users.avatarUrl`. E uma escolha
deliberada: dispensa diretorio de uploads, servidor de arquivos estaticos e volume
persistente no deploy, e a foto acompanha o backup do banco. Se um dia o volume de
imagens crescer (fotos de clientes, anexos de proposta), o caminho e migrar para
armazenamento de objetos e guardar apenas a URL nessa coluna.

---

## Regras de comissao

A comissao e de **25% sobre o valor de cada venda**, igual para todos os vendedores e
para qualquer quantidade de vendas no mes.

Exemplo: 7 vendas de R$ 500,00 somam R$ 3.500,00 e geram R$ 875,00 de comissao.

O administrador pode definir um **percentual individual** para um vendedor especifico
(campo "Comissao individual" no cadastro), que substitui o padrao. E a excecao, nao a
regra — deixando o campo vazio, vale os 25%.

Alterar uma venda (criar, mudar status, mudar valor, excluir) recalcula o mes inteiro
daquele vendedor. Com percentual fixo isso raramente muda outras vendas, mas garante
que uma mudanca no percentual individual se propague para todas as vendas em aberto
do periodo sem rotina separada.

> **Historico:** ate 08/2026 o percentual era progressivo por faixa de vendas no mes
> (15/20/25/30%). A regra foi unificada em 25% a pedido da direcao. As comissoes ja
> **pagas** naquele modelo mantiveram o percentual original — dinheiro repassado nao
> se recalcula. A regra antiga esta no historico do git, caso precise ser retomada.

### Ciclo de vida da comissao

| Status | Quando acontece |
| --- | --- |
| `PREVISTA` | Venda registrada, cliente ainda nao pagou |
| `PENDENTE` | Venda marcada como paga, aguardando aprovacao do administrador |
| `LIBERADA` | Administrador aprovou; entra no proximo repasse |
| `PAGA` | Repasse efetuado — o valor e congelado e nao muda mais |
| `CANCELADA` | A venda foi cancelada |

Comissoes `PAGA` nunca sao recalculadas, mesmo que o percentual do vendedor mude
depois.

---

## Permissoes

| | Vendedor | Administrador |
| --- | --- | --- |
| Leads, clientes, vendas, comissoes | Apenas os proprios | Todos |
| Registrar venda | Sim | Sim, por qualquer vendedor |
| Aprovar venda | Nao | Sim |
| Liberar e pagar comissao | Nao | Sim |
| Criar e editar servicos e precos | Nao | Sim |
| Definir metas | Nao | Sim |
| Gerenciar vendedores | Nao | Sim |
| Relatorios e auditoria | Nao | Sim |

O escopo por vendedor e aplicado **no backend**, em `resolveSellerScope`. A interface
apenas reflete o que a API autoriza — nenhuma restricao depende do frontend.

---

## Seguranca

- Senhas com hash `bcrypt`; nunca trafegam nem sao armazenadas em texto.
- Sessao em cookie `httpOnly` + JWT, inacessivel a JavaScript da pagina.
- O usuario e recarregado do banco a cada requisicao: bloquear um vendedor derruba a
  sessao dele imediatamente.
- Toda entrada e validada no servidor com Zod, independente do frontend.
- Limite de tentativas no login e na recuperacao de senha.
- `helmet` para cabecalhos de seguranca.
- Acoes administrativas ficam registradas em `audit_logs`.

---

## Migrar para PostgreSQL

O schema nao usa nada exclusivo do SQLite. Para produzir em PostgreSQL:

1. Em `server/prisma/schema.prisma`, troque o bloco `datasource`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Em `server/.env`, aponte `DATABASE_URL` para o Postgres.

3. Em `server/src/lib/query.ts`, acrescente `mode: 'insensitive'` nas clausulas de
   busca — no SQLite o `LIKE` ja e insensivel a caixa, no PostgreSQL nao e.

4. Rode `npx prisma migrate dev --name init` dentro de `server/`.

Os campos de enumeracao sao `String` validadas em `src/domain/enums.ts` (o SQLite nao
suporta enums no Prisma). No PostgreSQL eles podem virar enums nativos sem alterar a
camada de aplicacao.

---

## Antes de publicar em producao

- [ ] Definir um `JWT_SECRET` proprio, longo e aleatorio (a API se recusa a subir em
      producao com o valor de desenvolvimento).
- [ ] Trocar as senhas dos usuarios de demonstracao.
- [ ] Migrar para PostgreSQL.
- [ ] Configurar envio de e-mail na recuperacao de senha — hoje o token e devolvido na
      resposta apenas em desenvolvimento (`authController.forgotPassword`).
- [ ] Servir tudo sob HTTPS (o cookie de sessao passa a `secure` automaticamente
      quando `NODE_ENV=production`).
- [ ] Ajustar `WEB_ORIGIN` para o dominio real.
