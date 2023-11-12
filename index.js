const express = require('express')
const cors = require('cors')
const crypto = require('node:crypto') //lib para crear id nativa de node
const fs = require('node:fs')

//acceso a modulos de la app
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js')

//buscar un puerto
const PORT = process.env.PORT ?? 1234

//middleware
const app = express()

//read static file
app.use(express.static('web'));

app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://127.0.0.1:5500',
            'http://localhost:1234',
            'https://movies.com',
            'https://midu.dev',
            'https://app-movies-1.vercel.app'
        ]

        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    }
}))

//eliminar x-powered-by'
app.disable('x-powered-by')

//Recuperar todas las peliculas
/*
app.get('/movies', (req, res) => {

    //leer  query param de formato 

    //const form = req.query.format
    //if(formtar === 'html' ){ //xml,etc
    //    res.send('<h1>hola mundo</h1>')
    //}
    res.json(movies)
})
*/

//pagina de inicio

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/web/index.html');
    console.log('connect')
});


//Recuperar todas las pelicula de un Genero
app.get('/movies', (req, res) => {
    const { genre } = req.query

    if (genre) {

        const filteredMovies = movies.filter(
            //movie => movie.includes(genre) //no seria case sensitive
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
    //res.status(500).json({ message: 'Movie not found' })
})

//Recuperar un pelicula por su ID
app.get('/movies/:id', (req, res) => {
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)
    if (movie) return res.json(movie)
    res.status(404).json({ message: 'Movie not found' })
})

//Crear una pelicula
app.post('/movies', (req, res) => {

    const result = validateMovie(req.body)

    if (!result.success) {
        // 422 Unprocessable Entity
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    // en base de datos
    const newMovie = {
        id: crypto.randomUUID(), // uuid v4
        ...result.data
    }
    /*
      const {
          title,
          year,
          director,
          duration,
          poster,
          genre,
          rate
      } = req.body
  
      const newMovie = {
          id: crypto.randomUUID,  //crea un id v4
          title,
          year,
          director,
          duration,
          poster,
          genre,
          rate: rate ?? 0,
      }
      */
    // Esto no sería REST, porque estamos guardando
    // el estado de la aplicación en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {

    const result = validatePartialMovie(req.body)
    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' })

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)
})

//Eliminar una pelicula
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' })
    }

    movies.splice(movieIndex, 1)

    return res.json({ message: 'Movie deleted' })
})

// 404
app.use((req, res) => {
    res.status(404).send('<h1>404</h1>')
})

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})