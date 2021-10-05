const express = require('express');
const router = express.Router();
const postgres = require('./../database/connection').pool;

const sqlValida = `select (CASE WHEN a.time_finally >= now()::time THEN TRUE ELSE FALSE END) as result
            from sessoes a
            where a.id_pai = $1 and a.id = $2;`;

router.post('/cadastro', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `INSERT INTO pautas 
            (name_pauta, description)
            VALUES ($1, $2) RETURNING id;`,
            [req.body.name_pauta, req.body.description],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Pauta cadastrada com sucesso!",

                    pautasCriadas: results.rows.map(pautas => {
                        return {
                            id_pauta: pautas.id,
                            nome_pauta: req.body.name_pauta,
                            descricao: req.body.description
                        }
                    })

                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.get('/', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            "SELECT * FROM pautas;",
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Todas as Pautas do Sistema!",
                    pautas: results.rows.map(pautas => {
                        return {
                            id_pauta: pautas.id,
                            nome_pauta: pautas.name_pauta,
                            descricao: pautas.description
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.get('/:id/sessao', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `SELECT b.id, a.name_pauta, a.description, b.nome_sessao, b.descricao, (CASE WHEN b.time_finally >= now()::time THEN 'Sessão Aberta' ELSE 'Sessão Fechada' END) as result
            FROM pautas a
            INNER join sessoes b
            on a.id = b.id_pai
            where a.id = $1
            ORDER BY result ASC;`,
            [req.params.id],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Pauta selecionada!",
                    sessoes: results.rows.map(sessoes => {
                        return {
                            id_sessao: sessoes.id,
                            nome_pauta: sessoes.name_pauta,
                            descricao: sessoes.description,
                            nome_sessao: sessoes.nome_sessao,
                            descricao_sessao: sessoes.descricao,
                            active: sessoes.result
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.put('/atualizar/:id', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `UPDATE pautas
            SET name_pauta = $1,
            description = $2
            WHERE id = $3 RETURNING id;`,
            [req.body.nome_pauta, req.body.description, req.params.id],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Pauta atualizada com sucesso!",
                    pautas: results.rows.map(pautas => {
                        return {
                            id_pauta: pautas.id,
                            nome_pauta: req.body.nome_pauta,
                            descricao: req.body.description
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.delete('/deletar/:id', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            "delete from pautas where id = $1 returning name_pauta",
            [req.params.id],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Pauta deletada com sucesso!",
                    pautas: results.rows.map(pautas => {
                        return {
                            id_pauta: req.params.id
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});


router.get('/:idpauta/sessao/:idsessao', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            sqlValida,
            [req.params.idpauta, req.params.idsessao],
            (error, resposta) => {
                if (error) { return res.status(500).send({ error: error }) }
                if (resposta.rows[0].result) {
                    conn.query(
                        "SELECT a.nome_sessao, a.descricao, a.pergunta, a.id FROM sessoes a WHERE a.id = $1;",
                        [req.params.idsessao],
                        (error, results) => {
                            conn.release();
                            if (error) { return res.status(500).send({ error: error }) }
                            const response = {
                                result: "Sessão selecionada!",
                                sessao: results.rows.map(sessao => {
                                    return {
                                        id_sessao: sessao.id,
                                        nome_sessao: sessao.nome_sessao,
                                        descricao: sessao.descricao,
                                        pergunta: sessao.pergunta
                                    }
                                })
                            }
                            return res.status(200).send({ response });
                        }
                    );
                } else {
                    return res.status(200).send({ mensagem: 'Sessão fechada' });
                }
            }
        );
    });
});

router.post('/:idpauta/sessao/', (req, res, next) => {

    var sql;
    if (req.body.time_finally == undefined) {
        sql = `INSERT INTO sessoes ( nome_sessao, descricao, pergunta, id_pai)
        VALUES ( $1, $2, $3, $4) RETURNING id;`;
    } else {
        sql = `INSERT INTO sessoes ( nome_sessao, descricao, pergunta, time_finally, id_pai)
        VALUES ( $1, $2, $3, '`+ req.body.time_finally + `', $4) RETURNING id;`;
    }

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            sql,
            [req.body.nome_sessao, req.body.descricao, req.body.pergunta, req.params.idpauta],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Sessão criada com sucesso!",
                    sessao: results.rows.map(sessao => {
                        return {
                            id_sessao: sessao.id,
                            nome_sessao: req.body.nome_sessao,
                            descricao: req.body.descricao,
                            pergunta: req.body.pergunta
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.put('/:idpauta/sessao/:id', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            sqlValida,
            [req.params.idpauta, req.params.id],
            (error, resposta) => {
                if (error) { return res.status(500).send({ error: error }) }
                if (resposta.rows[0].result) {
                    conn.query(
                        `UPDATE sessoes 
                        SET 
                          nome_sessao = $1,
                          descricao = $2,
                          pergunta = $3
                        WHERE id = $4;`,
                        [req.body.nome_sessao, req.body.descricao, req.body.pergunta, req.params.id],
                        (error, results) => {
                            conn.release();
                            if (error) { return res.status(500).send({ error: error }) }
                            const response = {
                                result: "Sessão atualizada com sucesso!",
                                id_pauta: req.params.idpauta,
                                id_sessao: req.params.id,
                                nome_sessao: req.body.nome_sessao,
                                descricao: req.body.descricao,
                                pergunta: req.body.pergunta
                            }
                            return res.status(200).send({ response });
                        }
                    );
                } else {
                    return res.status(200).send({ mensagem: 'Sessão fechada' });
                }
            }
        );
    });
});

router.delete('/:idpauta/sessao/:id', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            sqlValida,
            [req.params.idpauta, req.params.id],
            (error, resposta) => {
                if (error) { return res.status(500).send({ error: error }) }
                if (resposta.rows[0].result) {
                    conn.query(
                        `delete from sessoes where id = $1`,
                        [req.params.id],
                        (error, results) => {
                            conn.release();
                            if (error) { return res.status(500).send({ error: error }) }
                            const response = {
                                result: "Sessão deleta com sucesso!",
                                id_pauta: req.params.idpauta,
                                id_sessao: req.params.id,
                            }
                            return res.status(200).send({ response });
                        }
                    );
                } else {
                    return res.status(200).send({ mensagem: 'Sessão fechada' });
                }
            }
        );
    });
});

router.get('/:idpauta/sessao/:idsessao/votos', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `SELECT min(a.name_pauta) as name_pauta,
            min(a.description) as description,
            min(b.nome_sessao) as nome_sessao,
            min(b.descricao) as descricao,
            min(b.pergunta) as pergunta,
            c.voto,
            count(c.voto) as quant
            FROM pautas a
            INNER join sessoes b on a.id = b.id_pai
            INNER JOIN votos c ON b.id = c.id_sessao
            where b.id = $1
            GROUP BY c.voto
            ORDER BY c.voto desc;`,
            [req.params.idsessao],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Totais de votos desta sessão!",
                    votos: results.rows.map(votos => {
                        return {
                            id_sessao: votos.id,
                            name_pauta: votos.name_pauta,
                            description: votos.description,
                            nome_sessao: votos.nome_sessao,
                            descricao: votos.descricao,
                            pergunta: votos.pergunta,
                            voto: votos.voto,
                            quantidade: votos.quant
                        }
                    })
                }
                return res.status(200).send({ response });
            }
        );
    });
});

router.post('/:idpauta/sessao/:idsessao/votos', (req, res, next) => {

    postgres.connect((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(
            `INSERT INTO votos( voto, id_sessao)
            VALUES ($1, $2);`,
            [req.body.voto, req.params.idsessao],
            (error, results) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                const response = {
                    result: "Voto inserido com sucesso!",
                    id_sessao: req.params.idsessao,
                    id_pauta: req.params.idpauta,
                    voto: req.body.voto
                }
                return res.status(200).send({ response });
            }
        );
    });
});

module.exports = router;