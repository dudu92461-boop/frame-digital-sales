/**
 * Manual de vendas da Frame Digital.
 *
 * Conteudo de treinamento da equipe comercial, versionado junto com o codigo
 * (nao no banco): esta sempre presente, abre dentro do sistema e nao depende de
 * cadastro. Cada capitulo e uma lista de blocos que a tela de leitura
 * (GuideView) renderiza. Para editar o material, mexa aqui.
 *
 * Nos textos, **assim** vira negrito ao ser exibido.
 */

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | {
      t: 'callout';
      kind: 'dica' | 'atencao' | 'exemplo' | 'passo';
      title?: string;
      text: string | string[];
    }
  | { t: 'script'; title?: string; lines: { who?: string; text: string }[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'quote'; text: string };

export interface Chapter {
  slug: string;
  order: number;
  icon: string; // nome de um icone lucide, resolvido em GuideView
  title: string;
  subtitle: string;
  minutes: number;
  blocks: Block[];
}

export const HANDBOOK: Chapter[] = [
  // -------------------------------------------------------------------------
  {
    slug: 'comece-por-aqui',
    order: 1,
    icon: 'Rocket',
    title: 'Comece por aqui',
    subtitle: 'O que e a Frame Digital, o que voce vende e como voce ganha.',
    minutes: 6,
    blocks: [
      { t: 'p', text: 'Seja bem-vindo ao time comercial da **Frame Digital**. Este manual e o seu treinamento: leia com calma, do primeiro ao ultimo capitulo. Quando terminar, voce vai saber o que vender, como abordar um cliente, como responder as objecoes mais comuns e como registrar tudo no sistema para receber sua comissao.' },
      { t: 'p', text: 'Voce nao precisa ser um especialista em tecnologia. Precisa gostar de conversar com pessoas, entender o problema de cada negocio e mostrar como a Frame resolve. O resto este manual ensina.' },

      { t: 'h', text: 'O que a Frame Digital faz' },
      { t: 'p', text: 'A Frame Digital cria a **presenca digital** de pequenos e medios negocios: o site, a identidade visual (logo e as cores da marca) e a gestao das redes sociais. Nosso cliente e o dono da pizzaria, do salao, da loja de roupas, da oficina, da clinica — gente que trabalha muito no proprio negocio e nao tem tempo nem conhecimento para cuidar da parte digital.' },
      { t: 'p', text: 'O que a gente vende, no fundo, nao e "um site". E **mais clientes para o negocio dele**. E parecer profissional. E ser encontrado no Google e no Instagram quando alguem procura o que ele vende. Guarde essa ideia: ninguem compra um site, as pessoas compram o resultado que o site traz.' },

      { t: 'h', text: 'Qual e o seu papel' },
      { t: 'p', text: 'Voce e o vendedor. Seu trabalho tem cinco passos, e este manual segue exatamente essa ordem:' },
      {
        t: 'list',
        ordered: true,
        items: [
          'Encontrar negocios que precisam da Frame (prospeccao).',
          'Fazer o primeiro contato e despertar interesse (abordagem).',
          'Conversar, entender a necessidade e apresentar a solucao (a venda).',
          'Responder duvidas e fechar (objecoes e fechamento).',
          'Registrar a venda no sistema e acompanhar (pos-venda e comissao).',
        ],
      },

      { t: 'h', text: 'Como voce ganha: a comissao' },
      { t: 'p', text: 'Voce recebe **25% do valor de cada venda**. E o mesmo percentual para todo mundo e para qualquer quantidade de vendas no mes. Simples assim.' },
      {
        t: 'callout',
        kind: 'exemplo',
        title: 'Fazendo a conta',
        text: [
          'Vendeu um site de R$ 1.000? Sua comissao e R$ 250.',
          'Vendeu identidade visual de R$ 600? Sua comissao e R$ 150.',
          'Fechou 7 vendas de R$ 500 no mes (R$ 3.500)? Sua comissao e R$ 875.',
        ],
      },
      { t: 'p', text: 'A comissao aparece sozinha no sistema assim que voce registra a venda. Voce acompanha tudo em **Comissoes**: quanto esta previsto, quanto foi liberado e quanto ja foi pago. Nada de planilha, nada de conta na mao.' },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'A comissao segue o dinheiro',
        text: 'A comissao so vira dinheiro no seu bolso quando o cliente paga a Frame e o administrador aprova. Por isso seu trabalho nao termina no "sim" do cliente: termina quando ele paga. O capitulo sobre o sistema explica cada etapa.',
      },

      { t: 'h', text: 'A mentalidade que faz vender' },
      { t: 'p', text: 'Antes de qualquer tecnica, tres verdades que separam quem vende de quem desiste:' },
      {
        t: 'list',
        items: [
          '**Nao e sorte, e volume.** Ninguem fecha com todo mundo. Voce vai ouvir muito "nao". Quanto mais gente voce aborda, mais "sim" aparece. Vender e um jogo de numeros somado a capricho.',
          '**O "nao" nao e pessoal.** O cliente nao esta te rejeitando. Ele esta com medo, sem tempo ou sem entender o valor ainda. Seu papel e tirar esse medo, nao insistir.',
          '**Voce esta ajudando, nao incomodando.** O negocio dele esta perdendo cliente por nao ter presenca digital. Voce traz a solucao. Venda com essa consciencia e a conversa muda de tom.',
        ],
      },
      { t: 'quote', text: 'Todo negocio bom que parece amador esta perdendo dinheiro em silencio. Seu trabalho e mostrar isso e resolver.' },
      { t: 'p', text: 'Pronto? Vamos ao que voce vende.' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'o-que-voce-vende',
    order: 2,
    icon: 'Package',
    title: 'O que voce vende',
    subtitle: 'Cada servico da Frame: o problema que resolve e como explicar.',
    minutes: 8,
    blocks: [
      { t: 'p', text: 'Voce nao precisa decorar termos tecnicos. Precisa saber, de cada servico: **para quem serve, que problema resolve e como explicar em uma frase**. Os precos oficiais estao sempre atualizados na tela **Servicos** do sistema — consulte por la na hora de passar valor, porque quem define preco e o administrador.' },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'Preco quem define e a Frame',
        text: 'Nunca invente preco nem prometa desconto por conta propria. Use os valores da tela Servicos. Se o cliente pedir condicao especial, diga que vai verificar e fale com o administrador.',
      },

      { t: 'h', text: 'Site' },
      { t: 'p', text: '**Para quem:** todo negocio que quer ser levado a serio e encontrado no Google. **Problema que resolve:** o cliente pesquisa no celular antes de comprar; sem site, o negocio parece amador ou nem aparece.' },
      { t: 'p', text: 'Explique assim: *"Quando alguem ouve falar do seu negocio, a primeira coisa que faz e procurar voce no Google. Se nao acha nada, ou acha algo mal feito, voce perde o cliente ali. O site e a sua vitrine aberta 24 horas."*' },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Site basico x profissional',
        text: [
          'Site basico: presenca simples e bonita — quem e, o que faz, contato e localizacao. Ideal para quem esta comecando ou tem orcamento curto.',
          'Site profissional: mais paginas, catalogo, integracao com WhatsApp e foco em aparecer no Google. Para quem quer usar o site como maquina de captar cliente.',
        ],
      },

      { t: 'h', text: 'Identidade visual' },
      { t: 'p', text: '**Para quem:** negocio sem logo, ou com uma logo feita "nas coxas" que passa imagem de amador. **Problema que resolve:** marca sem identidade nao gera confianca nem se destaca da concorrencia.' },
      { t: 'p', text: 'Explique assim: *"Sua marca e a cara do seu negocio. Uma identidade visual profissional — logo, cores, um padrao — faz voce parecer solido e ser lembrado. E a diferenca entre parecer um negocio de fundo de quintal e um negocio de verdade."*' },

      { t: 'h', text: 'Social Media (redes sociais)' },
      { t: 'p', text: '**Para quem:** negocio que tem Instagram parado, postando de vez em quando, sem constancia. **Problema que resolve:** rede social abandonada afasta cliente; quem posta sempre, com qualidade, vende mais.' },
      { t: 'p', text: 'Explique assim: *"Seu cliente esta no Instagram todo dia. Se voce some, ele esquece de voce e lembra do concorrente que aparece. A gente cuida das suas redes para voce aparecer sempre, com posts bonitos, sem voce precisar parar seu trabalho para isso."*' },
      {
        t: 'callout',
        kind: 'exemplo',
        title: 'Servico que se repete todo mes',
        text: 'Social Media costuma ser mensal. Isso e otimo para voce: e um cliente que gera comissao todo mes enquanto continuar. Cuidar bem desse cliente vale ouro.',
      },

      { t: 'h', text: 'A frase de uma linha (o "elevador")' },
      { t: 'p', text: 'Se tivesse 10 segundos para dizer o que a Frame faz, seria isto: *"A gente deixa seu negocio com cara de profissional na internet — site, marca e redes sociais — para voce atrair mais cliente sem ter que entender de tecnologia."* Decore essa frase. Ela abre muitas conversas.' },

      { t: 'h', text: 'Combine servicos (venda maior, comissao maior)' },
      { t: 'p', text: 'Raramente um negocio precisa de so uma coisa. Quem faz um site novo geralmente precisa de uma logo decente. Quem cuida da marca ganha muito com redes sociais ativas. Ofereca o conjunto:' },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Exemplo de combo',
        text: 'Cliente quer um site (R$ 1.000). Voce percebe que a logo dele e fraca. Ofereca identidade visual junto (R$ 600). Venda de R$ 1.600, sua comissao de R$ 400 em vez de R$ 250. O cliente sai com um resultado inteiro, nao pela metade.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'onde-achar-clientes',
    order: 3,
    icon: 'Search',
    title: 'Onde achar clientes',
    subtitle: 'Como montar sua lista de negocios para abordar (prospeccao).',
    minutes: 7,
    blocks: [
      { t: 'p', text: 'Venda comeca antes da conversa: comeca na **lista**. Vendedor que acorda sem saber com quem vai falar nao vende. Sua meta neste capitulo e nunca ficar sem gente para abordar.' },

      { t: 'h', text: 'Quem e o cliente ideal da Frame' },
      { t: 'p', text: 'Procure negocios que tem movimento mas parecem amadores na internet. Sinais de que ali tem venda:' },
      {
        t: 'list',
        items: [
          'Tem Instagram, mas o ultimo post e de meses atras ou as fotos sao ruins.',
          'Voce procura no Google e nao acha o site, so o telefone.',
          'A logo e sem graca, feita em algum aplicativo gratis.',
          'O negocio vai bem no boca a boca, mas nao aparece online.',
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Segmentos que costumam fechar',
        text: 'Pizzarias e lanchonetes, saloes e barbearias, clinicas e consultorios, lojas de roupa, oficinas e autopecas, academias, pet shops, restaurantes, imobiliarias pequenas. Comece pelos que voce ja conhece ou frequenta.',
      },

      { t: 'h', text: 'Onde garimpar (de graca, do celular)' },
      {
        t: 'list',
        items: [
          '**Google Maps:** pesquise "pizzaria em [sua cidade]", "salao em [seu bairro]". Cada resultado e um cliente em potencial, com telefone a vista.',
          '**Instagram:** procure por hashtags e localizacao da sua cidade. Veja quem tem movimento mas perfil descuidado.',
          '**A sua rua:** ande pelo comercio do bairro. Todo negocio com placa e um cliente. Anote o nome e procure depois.',
          '**Indicacao:** o melhor de todos. Cliente satisfeito indica outro. Sempre pergunte: "conhece mais alguem que precisaria disso?".',
        ],
      },

      { t: 'h', text: 'Monte a lista dentro do sistema' },
      { t: 'p', text: 'Cada negocio que voce encontrar, cadastre como **Lead** no sistema (o capitulo do sistema mostra o passo a passo). Assim voce nao perde ninguem, sabe com quem ja falou e em que pe esta cada conversa. Lead na cabeca ou no papel se perde; lead no sistema vira comissao.' },
      {
        t: 'callout',
        kind: 'passo',
        title: 'Meta simples de prospeccao',
        text: 'Cadastre pelo menos 3 leads novos por dia. Sao 15 na semana, 60 no mes. Se voce fechar so 1 a cada 10, ja sao 6 vendas no mes. Volume vira comissao.',
      },

      { t: 'h', text: 'Antes de abordar, observe' },
      { t: 'p', text: 'Dedique 1 minuto a olhar o negocio antes de falar com ele. Veja o Instagram, procure no Google. Assim voce chega na conversa sabendo o problema dele — e isso muda tudo. Ninguem resiste a alguem que claramente fez o dever de casa.' },
      { t: 'quote', text: 'Um lead bem escolhido e meia venda feita. Nao gaste energia com quem nunca vai comprar; gaste com quem tem o problema que voce resolve.' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'o-primeiro-contato',
    order: 4,
    icon: 'MessageCircle',
    title: 'O primeiro contato',
    subtitle: 'Como abordar sem parecer chato — WhatsApp e presencial.',
    minutes: 8,
    blocks: [
      { t: 'p', text: 'O primeiro contato tem um unico objetivo: **abrir a conversa**. Nao e vender ainda. E fazer o dono parar, prestar atencao e responder. Se ele responder, voce ganhou a chance de vender.' },

      { t: 'h', text: 'As tres regras de ouro da abordagem' },
      {
        t: 'list',
        items: [
          '**Fale do problema dele, nao de voce.** Ninguem se importa com a Frame. Todo mundo se importa com o proprio negocio.',
          '**Seja curto.** Mensagem gigante ninguem le. Duas ou tres linhas.',
          '**Termine com uma pergunta.** Pergunta pede resposta e mantem a conversa viva.',
        ],
      },

      { t: 'h', text: 'Abordagem por WhatsApp' },
      { t: 'p', text: 'O WhatsApp e seu principal canal. Personalize sempre — cite o nome do negocio. Modelo que funciona:' },
      {
        t: 'script',
        title: 'Primeiro contato (negocio sem site)',
        lines: [
          { who: 'Voce', text: 'Oi, tudo bem? Aqui e o [seu nome], da Frame Digital. Vi a [Pizzaria Rocha] e o movimento de voces parece otimo! So notei uma coisa: quando procuro voces no Google, nao aparece um site. Ja pensaram em ter um? Isso costuma trazer bastante cliente novo.' },
        ],
      },
      {
        t: 'script',
        title: 'Primeiro contato (Instagram parado)',
        lines: [
          { who: 'Voce', text: 'Oi! Aqui e o [seu nome], da Frame Digital. Segui o Instagram de voces e curti o trabalho. Reparei que faz um tempinho sem post novo — e uma pena, porque cliente que some do feed acaba esquecendo da gente. Voces cuidam disso internamente ou topariam uma ajuda para deixar a rede sempre ativa?' },
        ],
      },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'Nao mande o preco de cara',
        text: 'Se voce joga o preco na primeira mensagem, o cliente decide so pelo numero, sem entender o valor. Primeiro desperte interesse e entenda a necessidade. Preco vem depois, no lugar certo (capitulo do fechamento).',
      },

      { t: 'h', text: 'Abordagem presencial' },
      { t: 'p', text: 'Entrar no negocio pessoalmente assusta no comeco, mas converte muito. O dono ve seu rosto, cria confianca. Roteiro simples:' },
      {
        t: 'script',
        title: 'Chegando no balcao',
        lines: [
          { who: 'Voce', text: 'Oi, bom dia! O senhor e o dono? Prazer, [seu nome], da Frame Digital. Passei aqui porque gosto do movimento de voces e queria fazer uma pergunta rapida: hoje voces tem site e alguem cuidando das redes sociais?' },
          { who: 'Dono', text: 'A gente tem so o Instagram, mas ta meio parado...' },
          { who: 'Voce', text: 'Entendi. E justamente com isso que a gente ajuda. Posso te mostrar em dois minutos como funciona? Sem compromisso nenhum.' },
        ],
      },

      { t: 'h', text: 'Se nao responder, faca o follow-up' },
      { t: 'p', text: 'A maioria nao responde de primeira — e normal, o dono esta ocupado. Nao suma. Volte depois de 2 ou 3 dias, sem cobrar, agregando algo:' },
      {
        t: 'script',
        title: 'Segunda mensagem (follow-up)',
        lines: [
          { who: 'Voce', text: 'Oi [nome], tudo certo? So retomando aqui. Preparei um exemplo rapido de como ficaria a presenca de voces online. Quer que eu te mostre? Sem compromisso.' },
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Registre cada contato no lead',
        text: 'Sempre que falar com alguem, atualize o status do lead no sistema (Contato realizado, Em negociacao...) e anote nas observacoes o que rolou. Assim voce sabe quando voltar e nunca repete a mesma mensagem.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'a-conversa-de-venda',
    order: 5,
    icon: 'Handshake',
    title: 'A conversa de venda',
    subtitle: 'Ouvir, entender e mostrar valor antes de falar preco.',
    minutes: 8,
    blocks: [
      { t: 'p', text: 'O cliente respondeu, ha interesse. Agora e a conversa que decide a venda. O erro do vendedor iniciante e **falar demais**. O bom vendedor faz o cliente falar, entende o problema e so entao apresenta a solucao sob medida.' },

      { t: 'h', text: 'Passo 1: pergunte e escute (descoberta)' },
      { t: 'p', text: 'Antes de oferecer qualquer coisa, entenda o negocio. Boas perguntas fazem o cliente perceber sozinho que precisa de voce:' },
      {
        t: 'list',
        items: [
          '"Como os clientes costumam te achar hoje?"',
          '"Voce sente que perde venda por nao aparecer na internet?"',
          '"Ja teve cliente dizendo que nao te achou no Google?"',
          '"Quem cuida das suas redes sociais hoje?"',
          '"Como voce gostaria que seu negocio fosse visto online?"',
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'A regra dos dois ouvidos',
        text: 'Voce tem dois ouvidos e uma boca — use nessa proporcao. Escute o dobro do que fala. Cada dor que o cliente contar e um argumento que voce vai usar na hora de apresentar a solucao.',
      },

      { t: 'h', text: 'Passo 2: mostre o problema custando dinheiro' },
      { t: 'p', text: 'As pessoas agem mais para evitar uma perda do que para ganhar algo. Ajude o cliente a enxergar o que a ausencia digital ja custa a ele:' },
      {
        t: 'script',
        title: 'Conectando o problema ao bolso',
        lines: [
          { who: 'Voce', text: 'Deixa eu te perguntar: quantas pessoas por dia procuram pizzaria no Google aqui na regiao? Umas dezenas, no minimo. Cada uma dessas que nao te acha, acha o concorrente. Nao e que voce esta gastando com isso — voce ja esta perdendo com isso, todo dia, sem ver.' },
        ],
      },

      { t: 'h', text: 'Passo 3: apresente a solucao sob medida' },
      { t: 'p', text: 'Agora sim voce oferece — mas ligando cada servico a dor que ele mesmo contou. Nao venda "um site"; venda a solucao do problema dele:' },
      {
        t: 'script',
        title: 'Ligando solucao a dor',
        lines: [
          { who: 'Voce', text: 'Voce me disse que muita gente nao te acha e que o Instagram anda parado. Entao faz sentido a gente resolver os dois: um site simples para voce aparecer no Google quando procurarem pizza, e a gente assumindo suas redes para voce postar sempre sem esforco. Assim voce para de perder cliente nos dois canais.' },
        ],
      },

      { t: 'h', text: 'Passo 4: ancore o preco no valor' },
      { t: 'p', text: 'Quando for falar preco (so aqui, nunca antes), coloque o valor ao lado do retorno. O numero sozinho assusta; ao lado do beneficio, faz sentido:' },
      {
        t: 'script',
        title: 'Apresentando o preco',
        lines: [
          { who: 'Voce', text: 'O site fica em R$ 1.000, uma vez so. Pensa comigo: se ele te trouxer dois ou tres clientes novos por mes, ja se pagou no primeiro mes — e continua trabalhando por voce o ano inteiro. Nao e um gasto, e o que faz voce parar de perder cliente.' },
        ],
      },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'Fale o preco com firmeza',
        text: 'Diga o valor olhando no olho (ou direto na mensagem) e fique em silencio. Nao peca desculpa pelo preco, nao gagueje, nao ofereca desconto antes de ele pedir. Preco falado com inseguranca vira objecao na hora.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'quebrando-objecoes',
    order: 6,
    icon: 'ShieldQuestion',
    title: 'Quebrando objeções',
    subtitle: 'O que responder quando o cliente hesita.',
    minutes: 9,
    blocks: [
      { t: 'p', text: 'Objecao nao e "nao". Objecao e "ainda nao me convenci". E otimo sinal: quem objeta esta pensando em comprar. Seu trabalho e tirar a duvida com calma, sem discutir. Aqui estao as objecoes mais comuns e como responder cada uma.' },

      { t: 'h', text: '"Ta caro"' },
      { t: 'p', text: 'Quase sempre nao e caro — e que o cliente ainda nao viu o retorno. Nunca baixe o preco de imediato. Reforce o valor:' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Ah, ta caro isso...' },
          { who: 'Voce', text: 'Entendo. Deixa eu te perguntar: caro comparado a que? Se esse site te trouxer dois clientes por mes, em quanto tempo ele se paga? Nao e despesa, e investimento que volta. E da para dividir o pagamento, se ajudar.' },
        ],
      },

      { t: 'h', text: '"Vou pensar"' },
      { t: 'p', text: 'Traducao: ficou uma duvida que ele nao disse. Descubra qual, com leveza:' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Deixa eu pensar e te falo.' },
          { who: 'Voce', text: 'Claro, decisao e sua! So para eu te ajudar melhor: o que ainda ta te segurando? E o valor, o prazo, ou quer entender melhor como funciona? Me fala que eu esclareco agora.' },
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Combine o proximo passo',
        text: 'Se ele realmente precisa pensar, nao deixe no ar. "Fechado, e se eu te chamar quinta-feira para saber o que decidiu?" Marcar o retorno evita que o lead esfrie e some.',
      },

      { t: 'h', text: '"Ja tenho site / ja tenho quem cuida"' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Ja tenho um site.' },
          { who: 'Voce', text: 'Que otimo, entao voce ja entende o valor de estar online! Posso dar uma olhada nele? Muita vez o site existe mas nao aparece no Google ou nao funciona bem no celular, que e onde a maioria acessa. Se estiver perfeito, eu mesmo te falo. Se der para melhorar, eu te mostro.' },
        ],
      },

      { t: 'h', text: '"Meu sobrinho/amigo faz de graca"' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Meu sobrinho mexe com isso, ele faz pra mim.' },
          { who: 'Voce', text: 'Legal ter alguem de confianca! So pensa numa coisa: com o sobrinho, quando der um problema ou precisar mudar algo, voce depende da boa vontade e do tempo livre dele. Com a Frame, e uma empresa responsavel pelo seu negocio, com prazo e suporte. Seu negocio e serio demais para depender de tempo livre.' },
        ],
      },

      { t: 'h', text: '"Nao tenho tempo agora"' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Agora ta corrido, nao tenho tempo pra isso.' },
          { who: 'Voce', text: 'Perfeito, e justamente por isso que a Frame existe: para voce nao ter que se preocupar com isso. Voce cuida do seu negocio, a gente cuida da parte digital. O que a gente precisa de voce sao uns 15 minutos para entender o que voce quer. So isso.' },
        ],
      },

      { t: 'h', text: '"Nao preciso disso"' },
      {
        t: 'script',
        lines: [
          { who: 'Cliente', text: 'Meu negocio ja vai bem sem isso.' },
          { who: 'Voce', text: 'Fico feliz que va bem! E imagina indo bem e ainda aparecendo para quem ainda nao te conhece. Quem ja e bom no boca a boca costuma explodir quando entra na internet direito. Nao e consertar o que ta ruim, e crescer o que ja ta bom.' },
        ],
      },

      {
        t: 'callout',
        kind: 'atencao',
        title: 'Nunca brigue com o cliente',
        text: 'Concorde antes de rebater: "entendo", "faz sentido", "boa pergunta". Cliente contrariado fecha a porta. Cliente que se sente ouvido continua a conversa. Voce quer a venda, nao ganhar a discussao.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'fechando-a-venda',
    order: 7,
    icon: 'CheckCircle2',
    title: 'Fechando a venda',
    subtitle: 'A hora de pedir o sim — e o que fazer logo depois.',
    minutes: 6,
    blocks: [
      { t: 'p', text: 'Muita venda morre porque o vendedor **nao pede a venda**. Fica esperando o cliente falar "pode fechar". Isso raramente acontece. Fechar e conduzir o cliente para a decisao com naturalidade.' },

      { t: 'h', text: 'Reconheca o sinal de compra' },
      { t: 'p', text: 'Quando o cliente comeca a perguntar detalhes, ele ja decidiu no fundo — so falta o empurrao. Sinais: "e quanto tempo demora?", "como funciona o pagamento?", "voces fazem tal coisa?". Ao ouvir isso, pare de vender e comece a fechar.' },

      { t: 'h', text: 'Feche com uma pergunta de decisao' },
      { t: 'p', text: 'Nao pergunte "voce quer?" (convida o "nao"). Pergunte de um jeito que assume o sim e so escolhe o "como":' },
      {
        t: 'list',
        items: [
          '"Prefere comecar pelo site ou pela identidade visual junto?"',
          '"Voce quer no pix a vista ou prefere dividir no cartao?"',
          '"Posso ja te mandar os detalhes para a gente comecar essa semana?"',
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'O silencio fecha',
        text: 'Depois de fazer a pergunta de fechamento, fique calado e espere a resposta. O primeiro que fala perde. Deixe o cliente pensar e decidir. Preencher o silencio por nervosismo so estraga o momento.',
      },

      { t: 'h', text: 'Formas de pagamento' },
      { t: 'p', text: 'Ter opcao de pagamento derruba a objecao do preco. Confirme as condicoes atuais com o administrador, mas em geral a Frame trabalha com pix, cartao, boleto e transferencia. Se o valor pesar, oferecer parcelar costuma destravar o sim.' },

      { t: 'h', text: 'Fechou! E agora?' },
      { t: 'p', text: 'Assim que o cliente disser sim, faca tres coisas na ordem:' },
      {
        t: 'callout',
        kind: 'passo',
        title: 'Logo apos o sim',
        text: [
          '1. Confirme o combinado em uma frase: "Fechado entao: site profissional, R$ 1.000, comecando essa semana. Perfeito!"',
          '2. Registre na hora no sistema — converta o lead em cliente e lance a venda (proximo capitulo). Venda nao registrada nao gera comissao.',
          '3. Diga o proximo passo ao cliente: o que vai acontecer, quando, e o que voce precisa dele (fotos, textos, logo atual).',
        ],
      },
      { t: 'quote', text: 'A venda so esta segura quando esta no sistema e o cliente sabe qual e o proximo passo. Ate la, e so uma conversa boa.' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'depois-do-sim',
    order: 8,
    icon: 'Star',
    title: 'Depois do sim',
    subtitle: 'Entregar bem, acompanhar e transformar 1 cliente em 3.',
    minutes: 6,
    blocks: [
      { t: 'p', text: 'A venda nao acaba no sim — ali ela comeca. Um cliente bem cuidado paga em dia, volta a comprar e te indica para outros. Um cliente abandonado some e ainda fala mal. Este capitulo e sobre proteger e multiplicar o que voce conquistou.' },

      { t: 'h', text: 'Pegue um bom briefing' },
      { t: 'p', text: 'A equipe de producao precisa de informacao para entregar um bom trabalho. Voce e a ponte. Colete e registre nas observacoes do cliente:' },
      {
        t: 'list',
        items: [
          'O que o cliente faz e o que ele mais quer vender.',
          'Fotos, logo atual, textos e contatos que ele ja tem.',
          'Referencias que ele gosta (sites ou perfis de concorrentes).',
          'Cores, estilo e o que ele NAO quer de jeito nenhum.',
        ],
      },

      { t: 'h', text: 'Acompanhe o pagamento' },
      { t: 'p', text: 'Sua comissao depende do cliente pagar a Frame. Entao acompanhe: confirme que o pagamento saiu, e se atrasar, faca uma cobranca gentil. Ninguem melhor que voce, que criou a relacao, para lembrar o cliente com leveza.' },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'Comissao segue o pagamento',
        text: 'No sistema, marque a venda como PAGA so quando o dinheiro realmente entrou. E isso que libera sua comissao para aprovacao. Marcar como paga sem o pagamento so bagunca o controle e atrasa o seu proprio dinheiro.',
      },

      { t: 'h', text: 'Faca o pos-venda' },
      { t: 'p', text: 'Alguns dias apos a entrega, mande uma mensagem simples perguntando se ficou tudo bom. Custa nada e vale muito:' },
      {
        t: 'script',
        title: 'Mensagem de pos-venda',
        lines: [
          { who: 'Voce', text: 'Oi [nome]! Passando para saber se voce curtiu o resultado e se ta tudo funcionando bem. Qualquer ajuste, e so me falar. Foi um prazer trabalhar com voces!' },
        ],
      },

      { t: 'h', text: 'Transforme 1 cliente em 3' },
      { t: 'p', text: 'Cliente satisfeito e sua melhor fonte de novos clientes. Duas coisas simples multiplicam sua comissao:' },
      {
        t: 'list',
        items: [
          '**Peca indicacao:** "Que bom que gostou! Voce conhece outro dono de negocio que precisaria disso? Se indicar, cuido dele com o mesmo carinho."',
          '**Ofereca o proximo passo:** quem comprou site pode querer social media daqui a um tempo. Volte depois de um mes e ofereca o proximo servico. Cliente que ja confia compra de novo com muito mais facilidade.',
        ],
      },
      { t: 'quote', text: 'Vender para quem ja e cliente e cinco vezes mais facil que achar um novo. Nao abandone quem ja disse sim.' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'usando-o-sistema',
    order: 9,
    icon: 'MonitorSmartphone',
    title: 'Usando o sistema',
    subtitle: 'Passo a passo: do lead a comissao, dentro do Frame Digital Sales.',
    minutes: 8,
    blocks: [
      { t: 'p', text: 'O sistema e onde seu trabalho vira comissao. A regra e simples: **o que nao esta no sistema nao existe**. Lead na cabeca se perde, venda no papel nao gera comissao. Registre tudo, na hora. Este e o caminho completo.' },

      { t: 'h', text: '1. Cadastre o lead' },
      { t: 'p', text: 'Assim que encontrar um negocio para abordar, va em **Leads > Novo lead**. Preencha o que souber: nome da empresa, responsavel, WhatsApp, Instagram, cidade, segmento. Nas observacoes, anote o que voce notou (ex.: "sem site, Instagram parado").' },
      {
        t: 'callout',
        kind: 'dica',
        title: 'Use o status do lead',
        text: 'Cada lead tem um status que mostra em que pe esta a conversa: NOVO, CONTATO REALIZADO, EM NEGOCIACAO, PROPOSTA ENVIADA, AGUARDANDO PAGAMENTO, GANHO ou PERDIDO. Atualize sempre. Assim voce sabe de relance quem precisa de um retorno hoje.',
      },

      { t: 'h', text: '2. Converta o lead em cliente' },
      { t: 'p', text: 'Quando o negocio fecha, o lead vira **Cliente**. Isso mantem o historico: de onde veio, quando fechou, o que comprou. O sistema faz a conversao para voce — o lead ganho vira uma ficha de cliente.' },

      { t: 'h', text: '3. Registre a venda' },
      { t: 'p', text: 'Va em **Vendas > Registrar venda**. Escolha o cliente, o servico, informe o valor e a forma de pagamento. Ao escolher o servico, o valor de tabela ja aparece — ajuste se houve condicao combinada com o administrador.' },
      {
        t: 'callout',
        kind: 'exemplo',
        title: 'A comissao aparece na hora',
        text: 'Assim que voce digita o valor, o sistema ja mostra sua comissao (25%). Registrou uma venda de R$ 1.000? Ele mostra R$ 250 de comissao ali mesmo, antes de salvar.',
      },

      { t: 'h', text: '4. Acompanhe o status da venda' },
      { t: 'p', text: 'A venda passa por etapas: PENDENTE (registrada, cliente ainda nao pagou), PAGO (dinheiro entrou), EM EXECUCAO, CONCLUIDO ou CANCELADO. Mantenha atualizado — principalmente marcar PAGO quando o cliente pagar, porque e isso que movimenta sua comissao.' },

      { t: 'h', text: '5. Acompanhe sua comissao' },
      { t: 'p', text: 'Na tela **Comissoes** voce ve seu dinheiro em quatro estagios:' },
      {
        t: 'table',
        head: ['Estagio', 'O que significa'],
        rows: [
          ['Prevista', 'A venda foi registrada, mas o cliente ainda nao pagou.'],
          ['Pendente', 'O cliente pagou; aguardando a aprovacao do administrador.'],
          ['Liberada', 'O administrador aprovou; entra no proximo repasse.'],
          ['Paga', 'O dinheiro caiu para voce. Fechado!'],
        ],
      },
      {
        t: 'callout',
        kind: 'atencao',
        title: 'Voce so ve o que e seu',
        text: 'Cada vendedor enxerga apenas os proprios leads, clientes, vendas e comissoes. O administrador ve tudo. Nao da para ver a carteira de outro vendedor — e assim de proposito.',
      },

      { t: 'h', text: '6. Materiais e servicos sempre a mao' },
      { t: 'p', text: 'Na tela **Servicos** ficam os precos oficiais e atualizados — consulte antes de passar valor. Aqui em **Materiais** ficam estes guias de treinamento e os apoios de venda (propostas, portfolio, scripts) que o administrador disponibilizar.' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: 'rotina-de-quem-vende',
    order: 10,
    icon: 'Trophy',
    title: 'Rotina de quem vende',
    subtitle: 'Metas, ranking e a disciplina que separa o topo do resto.',
    minutes: 5,
    blocks: [
      { t: 'p', text: 'Talento ajuda, mas o que faz vendedor de verdade e **rotina**. Quem trata a venda como profissao, e nao como sorte, vende todo mes. Este ultimo capitulo e sobre transformar tudo que voce aprendeu em habito.' },

      { t: 'h', text: 'Sua rotina diaria (o basico que funciona)' },
      {
        t: 'list',
        ordered: true,
        items: [
          'Cadastre pelo menos 3 leads novos.',
          'Faca os retornos (follow-ups) de quem nao respondeu.',
          'Avance pelo menos uma negociacao (mande proposta, marque conversa).',
          'Atualize o status de cada lead que voce tocou hoje.',
        ],
      },
      {
        t: 'callout',
        kind: 'dica',
        title: 'O funil nunca para',
        text: 'Enquanto voce fecha uns, precisa estar prospectando outros. Vendedor que so cuida das negociacoes abertas fica sem ninguem quando elas fecham (ou caem). Sempre tenha leads novos entrando.',
      },

      { t: 'h', text: 'Meta do mes' },
      { t: 'p', text: 'O administrador define sua meta em **Metas**: um numero de vendas e um valor a alcancar no mes. Acompanhe a barra de progresso. Meta nao e cobranca, e bussola — ela te diz se voce esta no ritmo ou se precisa acelerar a prospeccao.' },

      { t: 'h', text: 'Ranking' },
      { t: 'p', text: 'Na tela **Ranking** voce ve sua posicao entre os vendedores no mes, por valor vendido. Use como combustivel: mira em subir uma posicao por semana. Competicao saudavel puxa todo mundo para cima — e o topo do ranking costuma ser tambem o topo da comissao.' },

      { t: 'h', text: 'As contas que todo vendedor deveria saber' },
      { t: 'p', text: 'Vender fica menos assustador quando vira matematica. Exemplo com numeros reais da Frame:' },
      {
        t: 'callout',
        kind: 'exemplo',
        title: 'De leads a dinheiro',
        text: [
          'Voce cadastra 60 leads no mes (3 por dia util).',
          'Fecha 1 a cada 10 abordagens: 6 vendas.',
          'Ticket medio de R$ 700: R$ 4.200 vendidos.',
          'Sua comissao (25%): R$ 1.050 no mes.',
          'Quer ganhar mais? Melhore uma alavanca: mais leads, mais fechamento ou ticket maior (combos).',
        ],
      },

      { t: 'h', text: 'Palavra final' },
      { t: 'p', text: 'Voce agora tem o mapa inteiro: o que vender, onde achar cliente, como abordar, como conversar, como quebrar objecao, como fechar, como cuidar do cliente e como usar o sistema. Nada disso funciona parado. Abra o sistema, cadastre seu primeiro lead e mande a primeira mensagem hoje. A primeira venda esta a poucas conversas de distancia.' },
      { t: 'quote', text: 'O melhor vendedor nao e o que fala mais bonito. E o que aparece todo dia, ajuda de verdade e nao desiste no primeiro nao. Esse pode ser voce.' },
    ],
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return HANDBOOK.find((c) => c.slug === slug);
}
