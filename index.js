const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db')
const app = express()

// parse body into JS objects
app.use(express.json());

// log the requests as they come in
app.use(require('morgan')('dev'));

// create notes - C
app.post('/api/notes', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO notes(txt)
      VALUES($1)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.txt])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
});

// read notes - R
app.get('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from notes ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
});

// update notes - U
app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE notes
      SET txt=$1, ranking=$2, updated_at=now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [req.body.txt, req.body.ranking, req.params.id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
});

// delete notes - D
app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
      DELETE from notes
      WHERE id=$1
    `
    const response = await client.query(SQL, req.params.id)
    res.sendStatus(204)
  } catch (ex) {
    next(ex)
  }

});


// create and run the express app
const init = async () => {
  await client.connect();
  console.log('connected to database');
  let SQL = `
    DROP TABLE IF EXISTS notes;
    CREATE TABLE notes(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    ranking INTEGER DEFAULT 3 NOT NULL,
    txt VARCHAR(255) NOT NULL
    );
  `;
  await client.query(SQL);
  console.log('tables created');
  SQL = `
    INSERT INTO notes(txt, ranking) VALUES('learn express', 5)
    INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4)
    INSERT INTO notes(txt, ranking) VALUES('create routes', 2)
  `;
  await client.query(SQL);
  console.log('data seeded');
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`))
};

init();