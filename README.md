#Banco utilizado - Postgresql 10
#tabelas criadas: 
---tabela de pautas
CREATE TABLE public.pautas (
  id INTEGER DEFAULT nextval('table_id_seq'::regclass) NOT NULL,
  name_pauta VARCHAR(50) NOT NULL,
  description VARCHAR,
  CONSTRAINT pautas_id_key UNIQUE(id)
) 
WITH (oids = false);
---tabela de sessoes
CREATE TABLE public.sessoes (
  id SERIAL,
  nome_sessao VARCHAR(50),
  descricao VARCHAR,
  pergunta VARCHAR(100),
  time_created TIME WITHOUT TIME ZONE DEFAULT now()::time without time zone,
  id_pai INTEGER,
  time_finally TIME WITHOUT TIME ZONE DEFAULT now()::time without time zone + '00:01:00'::interval,
  CONSTRAINT sessoes_pkey PRIMARY KEY(id),
  CONSTRAINT fk_id_pautas FOREIGN KEY (id_pai)
    REFERENCES public.pautas(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
    NOT DEFERRABLE
) 
WITH (oids = false);
---tabela de votos
CREATE TABLE public.votos (
  id SERIAL,
  voto VARCHAR(3),
  id_sessao INTEGER,
  CONSTRAINT votos_pkey PRIMARY KEY(id),
  CONSTRAINT fk_id_sessao FOREIGN KEY (id_sessao)
    REFERENCES public.sessoes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
    NOT DEFERRABLE
) 
WITH (oids = false);

#rotas;
pautas/ (get)-> será listado todas as pautas
/pautas/cadastro (post) -> cadastro de pautas
/pautas/atualizar/:id (put) -> atualizar pautas
/pautas/deletar/:id (delete) -> deletar pautas em modo cascade
/pautas/:id/sessao (get) -> lista todas as sessoes de um pauta
/pautas/:id/sessao (post) -> cadastra uma nova sessao
/pautas/:id/sessao/:id (delete) -> deleta a sessão em modo cascade
/pautas/:id/sessao/:id (put) - > atualiza a sessão
/pautas/:id/sessao/:id/votos (post) -> cadastra um novo voto
/pautas/:id/sessao/:id/votos (get) -> lista os votos em quantidade
