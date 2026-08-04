# Publicar o Frame Digital Sales (Render + Neon, de graça)

Este guia coloca o sistema no ar em um endereço acessível pelo celular dos
vendedores, sem custo. São três etapas: **GitHub** (guardar o código),
**Neon** (banco de dados) e **Render** (rodar o sistema).

O código já está preparado para isso. Você vai criar as contas e clicar em
publicar — nada aqui exige conhecimento técnico, é seguir os passos.

> Tempo estimado: 30 a 40 minutos na primeira vez.

---

## Antes de começar

Você vai precisar criar três contas gratuitas (pode usar o login com Google
em todas):

- **GitHub** — https://github.com
- **Neon** — https://neon.tech
- **Render** — https://render.com

---

## Etapa 1 — Enviar o código para o GitHub

O Render lê o código a partir do GitHub. Por isso, primeiro o projeto precisa
estar lá.

1. Crie uma conta no GitHub e clique em **New repository**.
2. Dê um nome (ex.: `frame-digital-sales`), deixe como **Private** e crie.
3. Suba o código. No computador, dentro da pasta do projeto, rode:

   ```bash
   git remote add origin https://github.com/SEU_USUARIO/frame-digital-sales.git
   git push -u origin main
   ```

   (Troque `SEU_USUARIO` pelo seu usuário do GitHub. Ele vai pedir login na
   primeira vez.)

> Deixar o repositório **Private** é importante: o código fica só com você.

---

## Etapa 2 — Criar o banco de dados no Neon

1. Crie uma conta no Neon e clique em **Create project**.
2. Dê um nome (ex.: `frame-digital-sales`), escolha a região mais próxima
   (ex.: **AWS - São Paulo** ou **US East**) e crie.
3. Na tela do projeto, procure **Connection string** (string de conexão).
   Copie o valor inteiro — ele começa com `postgresql://...`.

   > Guarde essa string. Ela é a **DATABASE_URL** que o Render vai usar.
   > Se aparecer a opção, use a string com **"Pooled connection"**. Ela já vem
   > com `?sslmode=require` no final — mantenha assim.

---

## Etapa 3 — Publicar no Render

1. Crie uma conta no Render e conecte sua conta do GitHub quando ele pedir.
2. No painel do Render, clique em **New +** → **Blueprint**.
3. Selecione o repositório `frame-digital-sales`. O Render encontra o arquivo
   `render.yaml` sozinho e já monta o serviço.
4. Ele vai pedir para preencher duas variáveis:

   | Variável | O que colocar |
   | --- | --- |
   | `DATABASE_URL` | A string de conexão que você copiou do Neon (Etapa 2). |
   | `ADMIN_PASSWORD` | A senha do administrador. **Escolha uma senha forte.** |

   (O `JWT_SECRET` é gerado automaticamente. Não precisa mexer.)

5. Clique em **Apply** / **Create**. O Render vai construir e publicar — a
   primeira vez leva alguns minutos. Acompanhe pelos logs; quando aparecer
   `FRAME DIGITAL SALES` e a porta, está no ar.

6. No topo da página do serviço aparece o endereço, algo como
   **`https://frame-digital-sales.onrender.com`**. Esse é o link do sistema.

---

## Primeiro acesso

1. Abra o endereço `.onrender.com`.
2. Entre com:
   - **E-mail:** `admin@framedigital.com.br` (ou o que você definiu em `ADMIN_EMAIL`)
   - **Senha:** a que você colocou em `ADMIN_PASSWORD`
3. Vá em **Configurações → Alterar senha** e troque por uma senha só sua.
4. Cadastre os serviços (**Serviços**) e recadastre os vendedores
   (**Administração → Vendedores**).

> O banco no Neon começa vazio, então os vendedores e serviços que existiam no
> seu computador **não vão junto** — recadastre-os por aqui. São poucos, leva
> minutos. O administrador é criado automaticamente no primeiro deploy.

---

## O que esperar do plano grátis

- **O servidor "dorme".** Depois de ~15 minutos sem ninguém acessar, o Render
  desliga o serviço. A próxima pessoa a entrar espera ~30 a 60 segundos para
  ele acordar. Depois disso, fica rápido. Para uma equipe pequena, é normal.
- **Atualizações são automáticas.** Toda vez que você enviar mudanças novas
  para o GitHub (`git push`), o Render publica sozinho.

---

## Endereço próprio (opcional)

O endereço `.onrender.com` é grátis e funciona. Se um dia quiser
`sistema.framedigital.com.br`, é só registrar o domínio (ex.: registro.br,
~R$ 40/ano) e apontar no Render, em **Settings → Custom Domains**.

---

## Se algo der errado

- **A página abre em branco:** aguarde o servidor "acordar" (até 1 minuto) e
  recarregue. Se persistir, veja os logs no painel do Render.
- **Erro de banco / não faz login:** confira se a `DATABASE_URL` foi colada
  inteira e termina com `?sslmode=require`.
- **Esqueceu a senha do admin:** no Render, mude a variável `ADMIN_PASSWORD`
  não resolve (o admin já existe). Use **Esqueci minha senha** na tela de login
  ou me chame para gerar uma nova.
